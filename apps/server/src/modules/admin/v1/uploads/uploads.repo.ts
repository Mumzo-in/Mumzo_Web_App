import { db } from "@mumzo/db";
import { uploadSessions } from "@mumzo/db/schema/media";
import { eq } from "drizzle-orm";

/** Pure data access — no business rules. `uploads.service.ts` owns those. */

export async function insertSession(userId: string, expiresAt: Date) {
  const [row] = await db
    .insert(uploadSessions)
    .values({ userId, expiresAt })
    .returning({ id: uploadSessions.id });

  if (!row) {
    throw new Error("Insert into upload_sessions returned no row.");
  }

  return row.id;
}

export async function findSessionById(id: string) {
  const [row] = await db
    .select()
    .from(uploadSessions)
    .where(eq(uploadSessions.id, id))
    .limit(1);
  return row;
}

export async function markFinalized(id: string) {
  await db
    .update(uploadSessions)
    .set({ finalized: true })
    .where(eq(uploadSessions.id, id));
}

export async function deleteSession(id: string) {
  await db.delete(uploadSessions).where(eq(uploadSessions.id, id));
}
