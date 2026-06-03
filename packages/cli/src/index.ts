#!/usr/bin/env bun
/**
 * Luminaweb CLI.
 *
 * Usage:
 *   luminaweb new [name] [--template todo|guestbook] [--no-git]
 *   luminaweb dev [dir] [--port 3000]
 *   luminaweb build [dir] --target edge --out dist
 *   luminaweb deploy [dir] [--public] [--env-file .env.luminaweb.server]
 *   luminaweb claim [dir]
 *   luminaweb inspect <deploy-id-or-url>
 *   luminaweb db list|dump <deploy-id-or-url>
 *   luminaweb logs <deploy-id-or-url>
 *   luminaweb auth as <name>
 *   luminaweb auth reset
 *   luminaweb run-many [dir] [--count 20] [--base-port 4000]
 *   luminaweb version
 */

import { newCommand } from "./commands/new.js";
import { devCommand } from "./commands/dev.js";
import { buildCommand } from "./commands/build.js";
import { deployCommand } from "./commands/deploy.js";
import { claimCommand } from "./commands/claim.js";
import { inspectCommand } from "./commands/inspect.js";
import { dbCommand } from "./commands/db.js";
import { logsCommand } from "./commands/logs.js";
import { authCommand } from "./commands/auth.js";
import { runManyCommand } from "./commands/run-many.js";
import { helpCommand, versionCommand } from "./commands/help.js";
import { out } from "./utils.js";

const VERSION = "0.1.0";
const BANNER = "▌▌  luminaweb";

const args = process.argv.slice(2);
const command = args[0];

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
}

function boolFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const ctx = { args, flag, boolFlag, version: VERSION, banner: BANNER, out };

async function main() {
  try {
    switch (command) {
      case "new":
      case "create":
        return await newCommand(ctx);
      case "dev":
        return await devCommand(ctx);
      case "build":
        return await buildCommand(ctx);
      case "deploy":
        return await deployCommand(ctx);
      case "claim":
        return await claimCommand(ctx);
      case "inspect":
        return await inspectCommand(ctx);
      case "db":
        return await dbCommand(ctx);
      case "logs":
        return await logsCommand(ctx);
      case "auth":
        return await authCommand(ctx);
      case "run-many":
        return await runManyCommand(ctx);
      case "version":
      case "--version":
      case "-v":
        return versionCommand(ctx);
      case "help":
      case "--help":
      case "-h":
      case undefined:
        return helpCommand(ctx);
      default:
        process.stderr.write(`luminaweb: unknown command "${command}"\n`);
        process.stderr.write(`run \`luminaweb help\` for usage.\n`);
        process.exit(2);
    }
  } catch (err) {
    process.stderr.write(`\n  ${BANNER}  error\n  ${String(err)}\n\n`);
    if (process.env.LUMINAWEB_DEBUG) {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
