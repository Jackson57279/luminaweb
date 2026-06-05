/**
 * `luminaweb new [name] [--template todo|guestbook] [--no-git]`
 *
 * Scaffolds a new capsule from one of the bundled templates. Each
 * template is a complete app: `server/index.ts`, `client/index.tsx`,
 * `shared/`, `.env.luminaweb.server`, and a `package.json`.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Ctx } from "../ctx.js";
import { out } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = resolve(__dirname, "../../../../examples");

const TEMPLATES = ["todo", "guestbook", "chat", "counter", "blank", "dashboard"] as const;
type Template = (typeof TEMPLATES)[number];

export async function newCommand(ctx: Ctx) {
  const raw = ctx.args.slice(1).filter((a) => !a.startsWith("--"));
  const name = raw[0] || "my-capsule";
  const template = (ctx.flag("template") ?? "todo") as Template;
  const noGit = ctx.boolFlag("no-git");

  if (!TEMPLATES.includes(template)) {
    out.err(`unknown template: ${template}`);
    out.plain(`  available: ${TEMPLATES.join(", ")}`);
    process.exit(2);
  }

  const dest = resolve(process.cwd(), name);
  if (existsSync(dest)) {
    out.err(`destination already exists: ${dest}`);
    process.exit(1);
  }

  const src = join(TEMPLATES_DIR, template);
  if (!existsSync(src)) {
    out.err(`template source missing: ${src}`);
    process.exit(1);
  }

  out.banner("▌▌  luminaweb new");
  out.step(`template: ${template}`);
  out.step(`destination: ${dest}`);

  copyDir(src, dest);

  const pkgPath = join(dest, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    pkg.name = name;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  // Rewrite workspace:* deps to real versions so `bun install` works
  // outside the monorepo. The bundled runtime is published as the same
  // name on npm; for local dev, users can edit the dep to point at a
  // local path.
  const pkgRaw = readFileSync(pkgPath, "utf-8");
  const rewritten = pkgRaw.replace(/"workspace:\*"/g, '"0.1.0"');
  if (rewritten !== pkgRaw) {
    writeFileSync(pkgPath, rewritten);
  }

  if (!noGit && !existsSync(join(dest, ".git"))) {
    try {
      const { execSync } = await import("node:child_process");
      execSync("git init -q", { cwd: dest, stdio: "ignore" });
      execSync("git add -A", { cwd: dest, stdio: "ignore" });
      execSync('git -c user.email="luminaweb@local" -c user.name="luminaweb" commit -q -m "init: scaffold luminaweb capsule"', {
        cwd: dest,
        stdio: "ignore",
      });
    } catch {
      // git is optional; skip silently
    }
  }

  out.ok(`capsule created: ${name}`);
  out.plain("");
  out.plain(`  cd ${name}`);
  out.plain(`  bun install`);
  out.plain(`  luminaweb dev`);
  out.plain("");
  out.plain(`  → http://localhost:3000`);
  out.plain("");
}

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === ".luminaweb") continue;
    const sp = join(src, entry);
    const dp = join(dest, entry);
    const stat = statSync(sp);
    if (stat.isDirectory()) {
      copyDir(sp, dp);
    } else {
      mkdirSync(dirname(dp), { recursive: true });
      copyFileSync(sp, dp);
    }
  }
}
