import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Database } from "bun:sqlite";
import { betterAuth } from "better-auth";

const DATA_DIR = process.env.LUMINAWEB_DATA_DIR ?? process.env.ZAPDEV_DATA_DIR ?? resolve(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

export const authDbPath = join(DATA_DIR, "luminaweb-auth.sqlite");

let _authDb: Database | null = null;

/** Lazily open the auth DB. Avoids opening SQLite at module load, which would
 *  otherwise lock the file across Next.js build worker processes. */
function authDb(): Database {
  if (_authDb) return _authDb;
  mkdirSync(dirname(authDbPath), { recursive: true });
  const db = new Database(authDbPath);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  db.exec(`
    create table if not exists user (
      id text primary key,
      name text not null,
      email text not null unique,
      emailVerified integer not null,
      image text,
      createdAt integer not null,
      updatedAt integer not null
    );
    create table if not exists session (
      id text primary key,
      userId text not null references user(id) on delete cascade,
      token text not null unique,
      expiresAt integer not null,
      ipAddress text,
      userAgent text,
      createdAt integer not null,
      updatedAt integer not null
    );
    create table if not exists account (
      id text primary key,
      userId text not null references user(id) on delete cascade,
      accountId text not null,
      providerId text not null,
      accessToken text,
      refreshToken text,
      accessTokenExpiresAt integer,
      refreshTokenExpiresAt integer,
      scope text,
      idToken text,
      password text,
      createdAt integer not null,
      updatedAt integer not null
    );
    create table if not exists verification (
      id text primary key,
      identifier text not null,
      value text not null,
      expiresAt integer not null,
      createdAt integer,
      updatedAt integer
    );
  `);
  _authDb = db;
  return db;
}

/** Origins allowed to call the auth API. Better Auth rejects any request whose
 *  Origin header is not the baseURL or listed here (e.g. the www subdomain when
 *  baseURL is the apex domain). Extra origins can be supplied via
 *  BETTER_AUTH_TRUSTED_ORIGINS as a comma-separated list. */
function trustedOrigins() {
  const origins = new Set<string>([
    // Apex + any subdomain of the wildcard domain (www, app, previews, etc.).
    "https://luminaweb.app",
    "https://*.luminaweb.app",
  ]);
  if (process.env.BETTER_AUTH_URL) origins.add(process.env.BETTER_AUTH_URL);
  for (const o of (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",")) {
    const trimmed = o.trim();
    if (trimmed) origins.add(trimmed);
  }
  return [...origins];
}

function buildAuth() {
  return betterAuth({
    appName: "Luminaweb",
    database: authDb(),
    secret: authSecret(),
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: trustedOrigins(),
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      // Share the session cookie across every *.luminaweb.app subdomain so a
      // user signed in on one subdomain stays signed in on the others.
      crossSubDomainCookies:
        process.env.NODE_ENV === "production"
          ? { enabled: true, domain: ".luminaweb.app" }
          : undefined,
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
  });
}

type AuthInstance = ReturnType<typeof buildAuth>;
let _auth: AuthInstance | null = null;

function getAuth(): AuthInstance {
  if (!_auth) _auth = buildAuth();
  return _auth;
}

/** Lazily-constructed better-auth instance. The real instance (and its DB) is
 *  built on first property access, never at import time. */
export const auth: AuthInstance = new Proxy({} as AuthInstance, {
  get(_target, prop) {
    return Reflect.get(getAuth() as object, prop);
  },
});

function authSecret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }
  return "development-only-luminaweb-secret-change-me-32chars";
}

export function ensureAuthMigrations() {
  return Promise.resolve();
}

export async function getSessionUser(req: Request) {
  await ensureAuthMigrations();
  const session = await auth.api.getSession({ headers: req.headers });
  return session?.user ?? null;
}
