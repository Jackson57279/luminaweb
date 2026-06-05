/**
 * Server runtime: capsule(), query(), mutation(), endpoint().
 *
 * The server runtime is a thin contract on top of an HTTP handler. It
 * exposes a typed request context with auth, db, env, and log. The actual
 * `db` implementation is provided by the host (Bun + SQLite in dev and
 * in the Edge runtime).
 */

import type {
  AuthIdentity,
  FieldBuilder,
  Logger,
  Row,
  ServerEnv,
  TableBuilder,
} from "../shared/index.js";

export type { AuthIdentity, FieldBuilder, Logger, Row, ServerEnv, TableBuilder };
export {
  table,
  string,
  boolean,
  number,
  text,
  json,
  isTable,
} from "../shared/index.js";
export {
  createHandler,
  type LogEntry,
  type CapsuleHandlerOptions,
} from "./handler.js";
export { MemoryDatabase } from "./memory.js";
export { resolveAuth, encodeSessionCookie, guestIdentity } from "./auth.js";
export { createLogger } from "./log.js";

export type Ctx = {
  auth: AuthIdentity;
  db: Database;
  env: ServerEnv;
  log: Logger;
  url: URL;
  requestId: string;
};

export type Database = {
  table(name: string): TableOps<Record<string, FieldBuilder<unknown>>>;
};

export type TableOps<F extends Record<string, FieldBuilder<unknown>>> = {
  where<K extends keyof Row<F>>(field: K, value: Row<F>[K]): TableOps<F>;
  orderBy<K extends keyof Row<F>>(field: K, direction: "asc" | "desc"): TableOps<F>;
  limit(count: number): TableOps<F>;
  all(): Row<F>[];
  get(id: string): Row<F> | null;
  insert(value: Omit<Row<F>, "id" | "createdAt" | "updatedAt">): Row<F>;
  update(id: string, patch: Partial<Omit<Row<F>, "id" | "createdAt" | "updatedAt">>): Row<F> | null;
  delete(id: string): boolean;
};

export type QueryHandler<F = unknown> = (ctx: Ctx, ...args: any[]) => F | Promise<F>;
export type MutationHandler<F = unknown> = (ctx: Ctx, ...args: any[]) => F | Promise<F>;

export type QueryDef<F = unknown> = {
  _kind: "query";
  handler: QueryHandler<F>;
};

export type MutationDef<F = unknown> = {
  _kind: "mutation";
  handler: MutationHandler<F>;
};

export type EndpointRequest = {
  method: string;
  path: string;
  url: URL;
  headers: Headers;
  query: URLSearchParams;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  bytes(): Promise<Uint8Array>;
};

export type EndpointHandler = (ctx: Ctx, req: EndpointRequest) => Response | Promise<Response>;

export type EndpointDef = {
  _kind: "endpoint";
  method: string;
  path: string;
  handler: EndpointHandler;
};

export type Schema = Record<string, TableBuilder<Record<string, FieldBuilder<unknown>>>>;

export type Queries = Record<string, QueryDef>;
export type Mutations = Record<string, MutationDef>;
export type Endpoints = Record<string, EndpointDef>;

export type CapsuleDef<QS extends Queries = Queries, MS extends Mutations = Mutations, ES extends Endpoints = Endpoints> = {
  schema?: Schema;
  queries?: QS;
  mutations?: MS;
  endpoints?: ES;
};

export type AnyCapsule = CapsuleDef<Record<string, QueryDef>, Record<string, MutationDef>, Record<string, EndpointDef>>;

export type ResolvedCapsule = {
  schema: Schema;
  queries: Record<string, QueryDef>;
  mutations: Record<string, MutationDef>;
  endpoints: Record<string, EndpointDef>;
};

export function capsule<QS extends Queries, MS extends Mutations, ES extends Endpoints>(
  def: CapsuleDef<QS, MS, ES>,
): CapsuleDef<QS, MS, ES> {
  return def;
}

export function query<F = unknown>(handler: QueryHandler<F>): QueryDef<F> {
  return { _kind: "query", handler };
}

export function mutation<F = unknown>(handler: MutationHandler<F>): MutationDef<F> {
  return { _kind: "mutation", handler };
}

export function endpoint(
  options: { method: string; path: string },
  handler: EndpointHandler,
): EndpointDef {
  return { _kind: "endpoint", method: options.method.toUpperCase(), path: options.path, handler };
}

export type ResponseInit = {
  status?: number;
  headers?: Record<string, string>;
};

export function jsonResponse<T>(value: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(value), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

export function textResponse(value: string, init?: ResponseInit): Response {
  return new Response(value, {
    status: init?.status ?? 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

export function redirect(location: string, init?: ResponseInit): Response {
  return new Response(null, {
    status: init?.status ?? 302,
    headers: {
      location,
      ...(init?.headers ?? {}),
    },
  });
}

export function notFound(message = "not found"): Response {
  return textResponse(message, { status: 404 });
}

export function unauthorized(message = "unauthorized"): Response {
  return textResponse(message, { status: 401 });
}

export function badRequest(message = "bad request"): Response {
  return textResponse(message, { status: 400 });
}
