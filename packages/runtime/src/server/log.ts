/**
 * Structured logger.
 *
 * Emits JSON to stdout (or to a host-supplied fetcher) for `npx zapdev
 * logs` to tail. Levels follow Lakebed's convention.
 */

import type { Logger } from "./index.js";

export type LogEntry = {
  requestId: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  fields?: Record<string, unknown>;
  ts: string;
};

export function createLogger(options: {
  requestId: string;
  onEntry?: (entry: LogEntry) => void;
}): Logger {
  return {
    debug: (m, f) => write("debug", m, f, options),
    info: (m, f) => write("info", m, f, options),
    warn: (m, f) => write("warn", m, f, options),
    error: (m, f) => write("error", m, f, options),
  };
}

function write(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  fields: Record<string, unknown> | undefined,
  options: { requestId: string; onEntry?: (entry: LogEntry) => void },
) {
  const entry: LogEntry = {
    level,
    message,
    requestId: options.requestId,
    ts: new Date().toISOString(),
    ...(fields ?? {}),
  };
  options.onEntry?.(entry);
  if (level === "error" || level === "warn") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
