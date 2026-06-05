/**
 * Client runtime — Preact hooks and primitives.
 *
 * Re-exports the Preact ecosystem (h, render, signals) so capsule authors
 * can write `import { h, render } from "zapdev/client"` without depending
 * on Preact directly.
 */

import { h, render } from "preact";
import { useEffect, useState, useCallback, useMemo } from "preact/hooks";
import { useSyncExternalStore } from "preact/compat";

import type { AuthClient, AuthIdentity } from "../shared/index.js";

export { h, render };
export { useEffect, useState, useSyncExternalStore, useCallback, useMemo };
export type { AuthClient, AuthIdentity };

/* ------------------------------------------------------------------------ */
/*  Transport                                                                */
/* ------------------------------------------------------------------------ */

declare global {
  interface Window {
    __LUMINAWEB_BASE__?: string;
  }
}

/** Deploy prefix when hosted under /d/:id (platform). Empty on edge root. */
function runtimeBase(): string {
  if (typeof window === "undefined") return "";
  const injected = window.__LUMINAWEB_BASE__;
  if (injected) return injected.replace(/\/$/, "");
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "d" && parts[1]) return `/d/${parts[1]}`;
  return "";
}

function zapPath(path: string): string {
  const base = runtimeBase();
  const sub = path.startsWith("/") ? path : `/${path}`;
  return `${base}${sub}`;
}

const sessionListeners = new Set<(auth: AuthClient) => void>();
let sessionCache: AuthClient | null = null;
let sessionInflight: Promise<AuthClient> | null = null;

function notifySession(auth: AuthClient) {
  sessionCache = auth;
  for (const fn of sessionListeners) fn(auth);
}

async function fetchSession(): Promise<AuthClient> {
  if (sessionCache && !sessionCache.isLoading) return sessionCache;
  if (sessionInflight) return sessionInflight;
  sessionInflight = fetch(zapPath("/__zap__/auth/me"), { credentials: "same-origin" })
    .then((r) => r.json() as Promise<AuthIdentity>)
    .then((identity) => ({ ...identity, isLoading: false }) satisfies AuthClient)
    .catch(() => ({
      userId: "guest:anonymous",
      displayName: "Guest",
      provider: "guest",
      isGuest: true,
      isAuthenticated: false,
      isLoading: false,
    }) satisfies AuthClient)
    .finally(() => {
      sessionInflight = null;
      notifySession(sessionCache as AuthClient);
    });
  return sessionInflight;
}

function subscribeSession(cb: (auth: AuthClient) => void): () => void {
  sessionListeners.add(cb);
  if (!sessionCache) {
    void fetchSession().then((auth) => {
      sessionCache = auth;
      cb(auth);
    });
  }
  return () => sessionListeners.delete(cb);
}

export function useAuth(): AuthClient {
  return useSyncExternalStore(
    (cb: () => void) => subscribeSession(cb as (auth: AuthClient) => void),
    () => sessionCache ?? ({ isLoading: true } as AuthClient),
  );
}

export function signOut(): Promise<void> {
  return fetch(zapPath("/__zap__/auth/sign-out"), { method: "POST" }).then(() => {
    notifySession({
      userId: "guest:anonymous",
      displayName: "Guest",
      provider: "guest",
      isGuest: true,
      isAuthenticated: false,
      isLoading: false,
    });
  });
}

export function signInWithGoogle(): void {
  window.location.href = zapPath("/__zap__/auth/google/start");
}

export function SignInWithGoogle({ class: className = "" }: { class?: string }) {
  return (
    <button
      type="button"
      class={`inline-flex items-center gap-2 border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2 font-mono text-sm text-[#f5f5f0] transition-[transform,border-color] duration-200 ease-out active:scale-[0.98] hover:border-[#D4FF4F] ${className}`}
      onClick={() => signInWithGoogle()}
    >
      <span class="inline-block h-2 w-2 rounded-full bg-[#D4FF4F]" />
      Sign in with Google
    </button>
  );
}

/* ------------------------------------------------------------------------ */
/*  Queries and mutations                                                    */
/* ------------------------------------------------------------------------ */

const queryCache = new Map<string, { value: unknown; ts: number; error: unknown }>();
const queryListeners = new Map<string, Set<() => void>>();

function notifyQuery(name: string) {
  const listeners = queryListeners.get(name);
  if (!listeners) return;
  for (const l of listeners) l();
}

async function callRpc<T>(kind: "query" | "mutation", name: string, args: unknown[]): Promise<T> {
  const path = kind === "query" ? `/__zap__/query/${name}` : `/__zap__/mutation/${name}`;
  const init: RequestInit = {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args ?? []),
  };
  const res = await fetch(zapPath(path), init);
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`${kind} ${name} failed: ${res.status} ${message}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export function useQuery<T>(name: string, args: unknown[] = []): T | undefined {
  const key = stableKey(name, args);
  const subscribe = useCallback(
    (cb: () => void) => {
      let listeners = queryListeners.get(key);
      if (!listeners) {
        listeners = new Set();
        queryListeners.set(key, listeners);
      }
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
        if (listeners.size === 0) queryListeners.delete(key);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    const entry = queryCache.get(key);
    return entry ? entry.value : undefined;
  }, [key]);

  const value = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    let cancelled = false;
    callRpc<T>("query", name, args)
      .then((v) => {
        if (cancelled) return;
        queryCache.set(key, { value: v, ts: Date.now(), error: null });
        notifyQuery(key);
      })
      .catch((err) => {
        if (cancelled) return;
        queryCache.set(key, { value: undefined, ts: Date.now(), error: err });
        notifyQuery(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return value as T | undefined;
}

export function useMutation<TArgs extends unknown[], TResult>(
  name: string,
): (...args: TArgs) => Promise<TResult> {
  return useCallback(
    async (...args: TArgs) => {
      const result = await callRpc<TResult>("mutation", name, args);
      const keys = [...queryCache.keys()];
      for (const key of keys) {
        queryCache.delete(key);
        notifyQuery(key);
        const sep = key.indexOf("::");
        const qName = sep === -1 ? key : key.slice(0, sep);
        const argsJson = sep === -1 ? "[]" : key.slice(sep + 2);
        let qArgs: unknown[] = [];
        try {
          qArgs = JSON.parse(argsJson) as unknown[];
        } catch {
          qArgs = [];
        }
        void callRpc("query", qName, qArgs)
          .then((v) => {
            queryCache.set(key, { value: v, ts: Date.now(), error: null });
            notifyQuery(key);
          })
          .catch((err) => {
            queryCache.set(key, { value: undefined, ts: Date.now(), error: err });
            notifyQuery(key);
          });
      }
      return result;
    },
    [name],
  );
}

function stableKey(name: string, args: unknown[]): string {
  return `${name}::${stableStringify(args)}`;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const keys = Object.keys(v as Record<string, unknown>).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = (v as Record<string, unknown>)[k];
      return out;
    }
    return v;
  });
}

/* ------------------------------------------------------------------------ */
/*  Router                                                                   */
/* ------------------------------------------------------------------------ */

import { useEffect as useEffectRouter, useState as useStateRouter } from "preact/hooks";

type Route = {
  path: string;
  element: any;
};

export function Router({ children }: { children: any }) {
  return children;
}

export function Routes({ children }: { children: any }) {
  const path = useLocationPath();
  const list: Route[] = Array.isArray(children) ? children : [children];
  for (const route of list) {
    if (!route) continue;
    if (matchPath(route.path, path)) {
      return route.element;
    }
  }
  for (const route of list) {
    if (route && route.path === "*") return route.element;
  }
  return null;
}

export function Route({ path, element }: { path: string; element: any }) {
  return { path, element } as Route;
}

export function Link({ to, children, class: className = "" }: { to: string; children: any; class?: string }) {
  const onClick = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} class={className} onClick={onClick}>
      {children}
    </a>
  );
}

export function useLocation() {
  return useLocationPath();
}

export function useNavigate() {
  return navigate;
}

export function navigate(to: string) {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useParams<T = Record<string, string>>(): T {
  return useStateRouter<T>({} as T)[0];
}

function useLocationPath(): string {
  const [path, setPath] = useStateRouter<string>(typeof window !== "undefined" ? window.location.pathname : "/");
  useEffectRouter(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

function matchPath(pattern: string, path: string): { params: Record<string, string> } | null {
  if (pattern === path) return { params: {} };
  if (!pattern.includes(":")) return null;
  const pp = pattern.split("/").filter(Boolean);
  const xp = path.split("/").filter(Boolean);
  if (pp.length !== xp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) {
      params[pp[i].slice(1)] = decodeURIComponent(xp[i]);
    } else if (pp[i] !== xp[i]) {
      return null;
    }
  }
  return { params };
}
