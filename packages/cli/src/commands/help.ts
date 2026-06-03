/**
 * `zapdev help` and `zapdev version`.
 */

import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

export function helpCommand(ctx: Ctx) {
  out.banner(ctx.banner);
  out.plain("  Ship the thing. Skip the plumbing.");
  out.plain("");
  out.plain("  Usage:");
  out.plain("    zapdev <command> [options]");
  out.plain("");
  out.plain("  Commands:");
  for (const line of COMMANDS) {
    out.plain("    " + line.cmd.padEnd(28) + line.desc);
  }
  out.plain("");
  out.plain("  Examples:");
  out.plain("    zapdev new my-app --template todo");
  out.plain("    cd my-app && zapdev dev");
  out.plain("    zapdev deploy");
  out.plain("");
}

export function versionCommand(ctx: Ctx) {
  out.plain(`zapdev ${ctx.version}`);
}

const COMMANDS = [
  { cmd: "new [name]", desc: "Scaffold a new capsule (alias: create)" },
  { cmd: "dev [dir]", desc: "Run a local dev server (default port 3000)" },
  { cmd: "build [dir] --target edge", desc: "Build a deployable bundle into dist/" },
  { cmd: "deploy [dir] [--public]", desc: "Push the bundle to Zapdev Edge" },
  { cmd: "claim [dir]", desc: "Claim a deploy for server env + fetch" },
  { cmd: "inspect <id|url>", desc: "Inspect a deployed capsule" },
  { cmd: "db list|dump <id|url>", desc: "List tables or dump rows" },
  { cmd: "logs <id|url>", desc: "Stream structured logs" },
  { cmd: "auth as <name>", desc: "Set local guest identity" },
  { cmd: "auth reset", desc: "Clear local guest identity" },
  { cmd: "run-many [dir] [--count N]", desc: "Boot N local dev instances" },
  { cmd: "version", desc: "Print the CLI version" },
];
