/**
 * Structured logging for the notification worker.
 *
 * Every line is a single JSON object on one line, so a log aggregator can
 * filter on `event` / `templateId` / `jobId` instead of grepping prose.
 * Bare `console.error(...)` was fine while failures were rare; at 10k
 * notifications a day even a 2% failure rate is 200 lines nobody can
 * usefully query.
 */

type LogLevel = "info" | "warn" | "error";

type LogFields = {
  event: string;
  jobId?: string;
  templateId?: string;
  userId?: string;
  audience?: string;
  channel?: string;
  attempts?: number;
  maxAttempts?: number;
  retryInMs?: number;
  count?: number;
  completed?: number;
  dead?: number;
  durationMs?: number;
  error?: unknown;
};

/** Errors don't survive `JSON.stringify` — it yields `{}` — so they are
 * flattened to message + name here, keeping the stack for `error` level
 * where it is actually useful. */
function serializeError(error: unknown, includeStack: boolean) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(includeStack && error.stack ? { stack: error.stack } : {}),
    };
  }
  return { message: String(error) };
}

function emit(level: LogLevel, fields: LogFields) {
  const { error, ...rest } = fields;

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    scope: "notifications",
    ...rest,
    ...(error !== undefined
      ? { error: serializeError(error, level === "error") }
      : {}),
  });

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const log = {
  info: (fields: LogFields) => emit("info", fields),
  warn: (fields: LogFields) => emit("warn", fields),
  error: (fields: LogFields) => emit("error", fields),
};
