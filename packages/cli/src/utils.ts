/**
 * Shared CLI utilities: output formatting, prompts, file ops.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[38;5;154m",
  lime: "\x1b[38;5;191m",
  yellow: "\x1b[38;5;221m",
  red: "\x1b[38;5;203m",
  blue: "\x1b[38;5;111m",
  gray: "\x1b[38;5;244m",
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (color: keyof typeof COLORS, text: string) =>
  useColor ? `${COLORS[color]}${text}${COLORS.reset}` : text;

export const out = {
  plain: (s: string) => process.stdout.write(s + "\n"),
  info: (s: string) => process.stdout.write(c("gray", s) + "\n"),
  step: (s: string) => process.stdout.write(c("lime", "▌ ") + c("bold", s) + "\n"),
  ok: (s: string) => process.stdout.write(c("green", "✓ ") + s + "\n"),
  warn: (s: string) => process.stdout.write(c("yellow", "! ") + c("yellow", s) + "\n"),
  err: (s: string) => process.stderr.write(c("red", "✗ ") + s + "\n"),
  banner: (s: string) =>
    process.stdout.write("\n" + c("lime", s) + "\n\n"),
  dim: (s: string) => process.stdout.write(c("dim", s) + "\n"),
};

export function fileExists(path: string): boolean {
  try {
    return existsSync(path);
  } catch {
    return false;
  }
}

export function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

export function writeFile(path: string, contents: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

export function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

export function listDir(path: string): string[] {
  return readdirSync(path);
}

export function resolveDir(path: string): string {
  return resolve(path);
}

export function prompt(question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  process.stdout.write(`${c("lime", "?")} ${question}${suffix}: `);
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (data) => {
      input = String(data).trim();
      resolve(input || defaultValue || "");
    });
  });
}

export function confirm(question: string, defaultYes = true): Promise<boolean> {
  const suffix = defaultYes ? " [Y/n]" : " [y/N]";
  process.stdout.write(`${c("lime", "?")} ${question}${suffix}: `);
  return new Promise((resolve) => {
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (data) => {
      const input = String(data).trim().toLowerCase();
      if (!input) return resolve(defaultYes);
      if (input === "y" || input === "yes") return resolve(true);
      if (input === "n" || input === "no") return resolve(false);
      resolve(defaultYes);
    });
  });
}

export function join2(...parts: string[]): string {
  return join(...parts);
}
