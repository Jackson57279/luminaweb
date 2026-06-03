/**
 * Shared types between server and client.
 *
 * Nothing in this file may import from `zapdev/server`, `zapdev/client`,
 * DOM APIs, Node built-ins, env values, or secrets. Pure types and helpers
 * only.
 */

export type FieldType = "string" | "boolean" | "number" | "text" | "json";

export interface FieldBuilder<T> {
  readonly type: FieldType;
  default(value: T): FieldBuilder<T>;
  optional(): FieldBuilder<T | null>;
}

export interface TableBuilder<Fields extends Record<string, FieldBuilder<unknown>>> {
  readonly fields: Fields;
  readonly _table: true;
}

export type Row<F extends Record<string, FieldBuilder<unknown>>> = {
  id: string;
  createdAt: string;
  updatedAt: string;
} & {
  [K in keyof F]: F[K] extends FieldBuilder<infer T> ? T : never;
};

export type AuthIdentity = {
  userId: string;
  displayName: string;
  provider: "guest" | "google" | "github";
  isGuest: boolean;
  isAuthenticated: boolean;
  email?: string;
  emailVerified?: boolean;
  picture?: string;
};

export type AuthClient = AuthIdentity & {
  isLoading: boolean;
};

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

export type ServerEnv = Record<string, string | undefined>;

export type CapsuleManifest = {
  name: string;
  version: string;
  tables: string[];
  queries: string[];
  mutations: string[];
  endpoints: Array<{ method: string; path: string }>;
};

export function table<F extends Record<string, FieldBuilder<unknown>>>(
  fields: F,
): TableBuilder<F> {
  return { fields, _table: true };
}

export function string(): FieldBuilder<string> {
  return builder("string");
}

export function boolean(): FieldBuilder<boolean> {
  return builder("boolean");
}

export function number(): FieldBuilder<number> {
  return builder("number");
}

export function text(): FieldBuilder<string> {
  return builder("text");
}

export function json<T>(): FieldBuilder<T> {
  return builder("json") as FieldBuilder<T>;
}

function builder<T>(type: FieldType): FieldBuilder<T> {
  const b: FieldBuilder<T> = {
    type,
    default(_value: T) {
      return b;
    },
    optional() {
      return b as FieldBuilder<T | null>;
    },
  };
  return b;
}

export function isTable(value: unknown): value is TableBuilder<Record<string, FieldBuilder<unknown>>> {
  return typeof value === "object" && value !== null && (value as { _table?: boolean })._table === true;
}
