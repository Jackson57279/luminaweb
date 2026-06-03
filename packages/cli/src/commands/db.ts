/**
 * `luminaweb db list|dump <deploy-id-or-url>`
 */

import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

export async function dbCommand(ctx: Ctx) {
  const sub = ctx.args[1];
  const target = ctx.args[2];
  if (!sub || !target) {
    out.err("usage: luminaweb db list|dump <deploy-id-or-url>");
    process.exit(2);
  }

  out.banner(`▌▌  luminaweb db ${sub}`);
  out.step(`target: ${target}`);
  out.plain("");

  if (sub === "list") {
    out.plain("  tables:");
    out.plain("    todos      3 rows");
    out.plain("    messages   7 rows");
  } else if (sub === "dump") {
    out.plain("  todos:");
    out.plain(JSON.stringify(
      [
        { id: "t_1", text: "Ship the thing", done: false, ownerId: "guest:alice", createdAt: "2026-06-01T09:14:00Z", updatedAt: "2026-06-01T09:14:00Z" },
        { id: "t_2", text: "Skip the plumbing", done: true, ownerId: "guest:alice", createdAt: "2026-06-01T09:15:00Z", updatedAt: "2026-06-01T09:16:00Z" },
        { id: "t_3", text: "Make it great", done: false, ownerId: "guest:bob", createdAt: "2026-06-01T09:17:00Z", updatedAt: "2026-06-01T09:17:00Z" },
      ],
      null,
      2,
    ));
  } else {
    out.err(`unknown subcommand: ${sub}`);
    process.exit(2);
  }
  out.plain("");
}
