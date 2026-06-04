import type { Ctx } from "../ctx.js";
import { configPath, saveConfiguredToken } from "../session.js";
import { out } from "../utils.js";

export async function loginCommand(ctx: Ctx) {
  const token = ctx.flag("token") ?? process.env.LUMINAWEB_TOKEN;
  out.banner("▌▌  luminaweb login");
  if (!token) {
    out.err("missing token");
    out.plain("  1. open https://luminaweb.app/account");
    out.plain("  2. sign in and click Create CLI token");
    out.plain("  3. run: luminaweb login --token lw_...");
    process.exit(1);
  }
  saveConfiguredToken(token);
  out.ok("CLI token saved");
  out.plain(`  → ${configPath()}`);
}
