/**
 * In-memory database adapter.
 *
 * Used for unit tests and short-lived `dev` sessions. The contract matches
 * the SQLite adapter, so the rest of the server runtime does not need to
 * care which backing store is plugged in.
 */

import type { Database, FieldBuilder, Row, TableBuilder, TableOps } from "./index.js";

type Schema = Record<string, TableBuilder<Record<string, FieldBuilder<unknown>>>>;

export class MemoryDatabase implements Database {
  readonly #tables = new Map<string, MemoryTable>();

  constructor(schema: Schema) {
    for (const name of Object.keys(schema)) {
      this.#tables.set(name, new MemoryTable());
    }
  }

  table(name: string): TableOps<Record<string, FieldBuilder<unknown>>> {
    const t = this.#tables.get(name);
    if (!t) throw new Error(`unknown table: ${name}`);
    return t;
  }
}

class MemoryTable implements TableOps<Record<string, FieldBuilder<unknown>>> {
  #rows: Row<Record<string, FieldBuilder<unknown>>>[] = [];
  #filters: Array<(r: Row<Record<string, FieldBuilder<unknown>>>) => boolean> = [];
  #orders: Array<(a: Row<Record<string, FieldBuilder<unknown>>>, b: Row<Record<string, FieldBuilder<unknown>>>) => number> = [];
  #limit: number | null = null;

  where(field: string, value: unknown): this {
    this.#filters.push((r) => (r as Record<string, unknown>)[field] === value);
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc"): this {
    const sign = direction === "asc" ? 1 : -1;
    this.#orders.push((a, b) => {
      const av = (a as Record<string, unknown>)[field];
      const bv = (b as Record<string, unknown>)[field];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const as = String(av);
      const bs = String(bv);
      if (as === bs) return 0;
      return as < bs ? -1 * sign : 1 * sign;
    });
    return this;
  }

  limit(count: number): this {
    this.#limit = count;
    return this;
  }

  all(): Row<Record<string, FieldBuilder<unknown>>>[] {
    const filtered = this.#rows.filter((r) => this.#filters.every((f) => f(r)));
    const chained = this.#orders.length
      ? filtered.slice().sort((a, b) => this.#orders.reduce((acc, fn) => (acc === 0 ? fn(a, b) : acc), 0))
      : filtered;
    return this.#limit !== null ? chained.slice(0, this.#limit) : chained;
  }

  get(id: string): Row<Record<string, FieldBuilder<unknown>>> | null {
    return this.#rows.find((r) => r.id === id) ?? null;
  }

  insert(
    value: Omit<Row<Record<string, FieldBuilder<unknown>>>, "id" | "createdAt" | "updatedAt">,
  ): Row<Record<string, FieldBuilder<unknown>>> {
    const now = new Date().toISOString();
    const row = {
      id: randomId(),
      createdAt: now,
      updatedAt: now,
      ...value,
    } as Row<Record<string, FieldBuilder<unknown>>>;
    this.#rows.push(row);
    return row;
  }

  update(
    id: string,
    patch: Partial<Omit<Row<Record<string, FieldBuilder<unknown>>>, "id" | "createdAt" | "updatedAt">>,
  ): Row<Record<string, FieldBuilder<unknown>>> | null {
    const idx = this.#rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const existing = this.#rows[idx];
    const next = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    } as Row<Record<string, FieldBuilder<unknown>>>;
    this.#rows[idx] = next;
    return next;
  }

  delete(id: string): boolean {
    const idx = this.#rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.#rows.splice(idx, 1);
    return true;
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
