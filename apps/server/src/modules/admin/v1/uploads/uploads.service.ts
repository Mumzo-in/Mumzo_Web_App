import { env } from "@mumzo/env/server";
import {
  buildTmpKey,
  copyObject,
  deleteObjects,
  KEY_PREFIXES,
  listKeys,
  processImage,
  putObject,
  toPublicUrl,
} from "@mumzo/storage";

import { badRequest, forbidden, notFound } from "@/core/errors";
import * as uploadsRepo from "./uploads.repo";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function assertWithinLimit(buffer: Buffer) {
  const maxBytes = env.R2_MAX_UPLOAD_MB * 1024 * 1024;
  if (buffer.byteLength > maxBytes) {
    throw badRequest(
      `File exceeds the ${env.R2_MAX_UPLOAD_MB}MB upload limit.`,
    );
  }
}

async function requireOwnedSession(sessionId: string, userId: string) {
  const session = await uploadsRepo.findSessionById(sessionId);
  if (!session) {
    throw notFound("Upload session");
  }
  if (session.userId !== userId) {
    throw forbidden("This upload session belongs to another user.");
  }
  return session;
}

type HandleUploadInput = {
  file: Buffer;
  /**
   * Not used to build the tmp key (drafts are keyed purely by session +
   * slot) but required from the client so validation stays symmetric with
   * the eventual finalize target and future direct-to-entity uploads can
   * branch on it.
   */
  entity: string;
  slot: string;
  sessionId?: string;
  userId: string;
};

export async function handleUpload({
  file,
  slot,
  sessionId,
  userId,
}: HandleUploadInput) {
  assertWithinLimit(file);

  const processed = await processImage(file);

  const resolvedSessionId = sessionId
    ? (await requireOwnedSession(sessionId, userId)).id
    : await uploadsRepo.insertSession(
        userId,
        new Date(Date.now() + SESSION_TTL_MS),
      );

  const key = buildTmpKey(resolvedSessionId, slot);
  await putObject("public", key, processed.data, processed.contentType);

  const resizeable =
    processed.sizeBytes > env.R2_RESIZE_THRESHOLD_MB * 1024 * 1024;

  return {
    key,
    url: toPublicUrl(key, resizeable ? { w: 800 } : undefined),
    sessionId: resolvedSessionId,
    resizeable,
    sizeBytes: processed.sizeBytes,
  };
}

function tmpPrefix(sessionId: string): string {
  return `${KEY_PREFIXES.tmp}${sessionId}/`;
}

/**
 * Discards a draft session: deletes every `tmp/{sessionId}/*` object (found
 * via a List call against the session's prefix) and the session row.
 */
export async function discardSession(sessionId: string, userId: string) {
  await requireOwnedSession(sessionId, userId);

  const keys = await listKeys("public", tmpPrefix(sessionId));
  await deleteObjects("public", keys);
  await uploadsRepo.deleteSession(sessionId);
}

/**
 * Copies every `{slot: destKey}` pair the caller resolved to for this
 * session from its tmp key to the final destination, then wipes every
 * remaining `tmp/{sessionId}/*` object and marks the session finalized.
 * Called internally by other server modules (products, brands, categories)
 * when a create/update consumes an `uploadSessionId` — never exposed over
 * HTTP directly.
 */
export async function finalizeSession(
  sessionId: string,
  userId: string,
  targetKeys: Record<string, string>,
) {
  const session = await requireOwnedSession(sessionId, userId);

  await Promise.all(
    Object.entries(targetKeys).map(([slot, destKey]) =>
      copyObject("public", buildTmpKey(sessionId, slot), destKey),
    ),
  );

  const remaining = await listKeys("public", tmpPrefix(sessionId));
  await deleteObjects("public", remaining);
  await uploadsRepo.markFinalized(session.id);
}
