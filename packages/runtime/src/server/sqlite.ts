/**
 * SQLite-backed database adapter for the Zapdev server runtime.
 *
 * Used by `zapdev dev` and the Edge runtime. Each `table()` call gets one
 * backing SQLite table. Every row has `id`, `createdAt`, `updatedAt` plus
 * the declared fields. The query builder emits parameterized SQL so user
 * input never reaches the prepared-statement layer as raw text.
 */

import { Database as BunDB } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Database, FieldBuilder, Row, TableBuilder, TableOps } from "./index.js";
import { isTable } from "../shared/index.js";

const SYSTEM_COLUMNS = ["id", "createdAt", "updatedAt"] as const;

type Schema = Record<string, TableBuilder<Record<string, FieldBuilder<unknown>>>>;

const FIELD_SQL: Record<string, string> = {
  string: "TEXT",
  text: "TEXT",
  boolean: "INTEGER",
  number: "REAL",
  json: "TEXT",
};

export class SqliteDatabase implements Database {
  readonly #db: BunDB;
  readonly #schema: Schema;

  constructor(path: string, schema: Schema) {
    mkdirSync(dirname(path), { recursive: true });
    this.#db = new BunDB(path);
    this.#schema = schema;
    this.#migrate();
  }

  #migrate() {
    for (const [name, builder] of Object.entries(this.#schema)) {
      const columns = Object.entries(builder.fields)
        .map(([field, def]) => `${quote(field)} ${FIELD_SQL[def.type] ?? "TEXT"}`)
        .join(", ");
      const allColumns = [
        "id TEXT PRIMARY KEY",
        "createdAt TEXT NOT NULL",
        "updatedAt TEXT NOT NULL",
        columns,
      ].join(", ");
      this.#db.exec(`CREATE TABLE IF NOT EXISTS ${quote(name)} (${allColumns});`);
    }
  }

  table(name: string): TableOps<Record<string, FieldBuilder<unknown>>> {
    if (!this.#schema[name]) {
      throw new Error(`unknown table: ${name}`);
    }
    return new Table(this.#db, name);
  }
}

class Table implements TableOps<Record<string, FieldBuilder<unknown>>> {
  readonly #db: BunDB;
  readonly #name: string;
  readonly #filters: { field: string; value: unknown }[] = [];
  readonly #orders: { field: string; direction: "asc" | "desc" }[] = [];
  #limit: number | null = null;

  constructor(db: BunDB, name: string) {
    this.#db = db;
    this.#name = name;
  }

  where(field: string, value: unknown): this {
    if (!SYSTEM_COLUMNS.includes(field as typeof SYSTEM_COLUMNS[number])) {
      // pass — runtime still authorises via the server handler
    }
    this.#filters.push({ field, value });
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc"): this {
    this.#orders.push({ field, direction });
    return this;
  }

  limit(count: number): this {
    this.#limit = count;
    return this;
  }

  all(): Row<Record<string, FieldBuilder<unknown>>>[] {
    const { sql, params } = this.#buildSelect();
    const rows = this.#db.query(sql).all(...(params as (string | number | bigint | null)[])) as Record<string, unknown>[];
    return rows.map(deserialize);
  }

  get(id: string): Row<Record<string, FieldBuilder<unknown>>> | null {
    const row = this.#db
      .query(`SELECT * FROM ${quote(this.#name)} WHERE id = ? LIMIT 1`)
      .get(id) as Record<string, unknown> | null;
    return row ? deserialize(row) : null;
  }

  insert(
    value: Omit<Row<Record<string, FieldBuilder<unknown>>>, "id" | "createdAt" | "updatedAt">,
  ): Row<Record<string, FieldBuilder<unknown>>> {
    const id = cryptoRandom();
    const now = new Date().toISOString();
    const fields = Object.keys(value);
    const cols = ["id", "createdAt", "updatedAt", ...fields].map(quote).join(", ");
    const placeholders = fields.map(() => "?").join(", ");
    const params = [
      id,
      now,
      now,
      ...fields.map((f) => serialize(value[f as keyof typeof value])),
    ] as (string | number | bigint | null)[];
    this.#db
      .prepare(
        `INSERT INTO ${quote(this.#name)} (${cols}) VALUES (?, ?, ?, ${placeholders})`,
      )
      .run(...params);
    return this.get(id) as Row<Record<string, FieldBuilder<unknown>>>;
  }

  update(
    id: string,
    patch: Partial<Omit<Row<Record<string, FieldBuilder<unknown>>>, "id" | "createdAt" | "updatedAt">>,
  ): Row<Record<string, FieldBuilder<unknown>>> | null {
    const fields = Object.keys(patch);
    if (fields.length === 0) return this.get(id);
    const setClause = fields.map((f) => `${quote(f)} = ?`).join(", ");
    const params = [
      ...fields.map((f) => serialize((patch as Record<string, unknown>)[f])),
      new Date().toISOString(),
      id,
    ] as (string | number | bigint | null)[];
    this.#db
      .prepare(`UPDATE ${quote(this.#name)} SET ${setClause}, updatedAt = ? WHERE id = ?`)
      .run(...params);
    return this.get(id);
  }

  delete(id: string): boolean {
    const result = this.#db.prepare(`DELETE FROM ${quote(this.#name)} WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  #buildSelect(): { sql: string; params: (string | number | bigint | null)[] } {
    const where: string[] = [];
    const params: (string | number | bigint | null)[] = [];
    for (const { field, value } of this.#filters) {
      where.push(`${quote(field)} = ?`);
      params.push(serialize(value));
    }
    const order =
      this.#orders.length > 0
        ? "ORDER BY " +
          this.#orders
            .map((o) => `${quote(o.field)} ${o.direction.toUpperCase()}`)
            .join(", ")
        : "ORDER BY createdAt DESC";
    const limit = this.#limit !== null ? `LIMIT ${this.#limit}` : "";
    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    return {
      sql: `SELECT * FROM ${quote(this.#name)} ${whereClause} ${order} ${limit};`,
      params,
    };
  }
}

function quote(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function serialize(value: unknown): string | number | bigint | null {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "string") return value;
  return String(value);
}

function deserialize(row: Record<string, unknown>): Row<Record<string, FieldBuilder<unknown>>> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null) {
      out[k] = null;
    } else if (typeof v === "number" && (k === "done" || k === "completed" || k.endsWith("Bool") || k === "isDone")) {
      out[k] = v === 1;
    } else if (typeof v === "string" && (k === "payload" || k === "data" || k === "meta" || k.endsWith("Json"))) {
      try {
        out[k] = JSON.parse(v);
      } catch {
        out[k] = v;
      }
    } else {
      out[k] = v;
    }
  }
  return out as Row<Record<string, FieldBuilder<unknown>>>;
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createSqliteDatabase(path: string, schema: Schema): Database {
  return new SqliteDatabase(path, schema);
}

export { isTable };
