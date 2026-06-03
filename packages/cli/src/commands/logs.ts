/**
 * `zapdev logs <deploy-id-or-url>`
 *
 * Streams structured JSON log lines from the edge. We currently emit a
 * demo stream so users can see the shape.
 */

import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

export async function logsCommand(ctx: Ctx) {
  const target = ctx.args[1];
  if (!target) {
    out.err("missing deploy id or url");
    process.exit(2);
  }
  out.banner("▌▌  zapdev logs");
  out.step(`target: ${target}`);
  out.plain("");

  const samples = [
    { level: "info", message: "dev server started", requestId: "req_1", ts: now() },
    { level: "debug", message: "query todos", requestId: "req_1", ts: now() },
    { level: "info", message: "mutation addTodo", requestId: "req_2", fields: { text: "Ship the thing" }, ts: now() },
    { level: "info", message: "mutation setTodoDone", requestId: "req_3", fields: { id: "t_1", done: true }, ts: now() },
    { level: "warn", message: "rate limit approaching", requestId: "req_4", ts: now() },
  ];
  for (const entry of samples) {
    out.dim(JSON.stringify(entry));
    await new Promise((r) => setTimeout(r, 200));
  }
}

function now(): string {
  return new Date().toISOString();
}
