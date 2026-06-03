/**
 * `zapdev inspect <deploy-id-or-url>`
 */

import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

export async function inspectCommand(ctx: Ctx) {
  const target = ctx.args[1];
  if (!target) {
    out.err("missing deploy id or url");
    process.exit(2);
  }
  out.banner("▌▌  zapdev inspect");
  out.step(`target: ${target}`);
  out.plain("");

  // Stub manifest. Real implementation calls the edge.
  out.plain("  name:        capsule");
  out.plain("  version:     0.1.0");
  out.plain("  runtime:     @zapdev/runtime 0.1.0");
  out.plain("  tables:      todos, messages");
  out.plain("  queries:     todos, messages");
  out.plain("  mutations:   addTodo, setTodoDone, clearDone, sendMessage");
  out.plain("  endpoints:   POST /webhooks/incoming");
  out.plain("  status:      healthy");
  out.plain("  region:      edge-iad-1");
  out.plain("");
}
