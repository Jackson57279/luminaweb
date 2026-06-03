# Zapdev

> An agent-native runtime for full-stack TypeScript apps. Ship the thing. Skip the plumbing.

Zapdev is a CLI and runtime for building small full-stack TypeScript apps called **capsules**. One directory, one port, one command. Write your server contract, write your client UI, and `zapdev deploy` to a global edge.

## Quick start

```sh
npm i -g zapdev
zapdev new my-app --template todo
cd my-app
zapdev dev
```

## Capsules

A capsule is one complete app: server, client, state, auth, and a deploy URL. The whole app lives in three files.

```txt
server/index.ts      # schema, queries, mutations, endpoints
client/index.tsx     # Preact UI
shared/              # pure TypeScript shared by both sides
.env.zapdev.server   # server-only secrets
```

## The runtime

The `@zapdev/runtime` package gives you:

- `zapdev/server` — `capsule()`, `query()`, `mutation()`, `endpoint()`, `table()`, `string()`, `boolean()`.
- `zapdev/client` — `useQuery`, `useMutation`, `useAuth`, `<SignInWithGoogle>`, `<Router>`, `<Route>`, `<Link>`.
- `zapdev/shared` — types and validation helpers.

The runtime preserves server-authoritative semantics. Server-side JavaScript runs in a restricted source runtime by default, so ordinary ownership checks in `mutation` handlers stay authoritative.

## CLI

```sh
zapdev new [name] [--template todo] [--no-git]
zapdev dev [dir] [--port 3000]
zapdev build [dir] --target edge --out dist
zapdev deploy [dir] [--public] [--env-file .env.zapdev.server]
zapdev inspect <deploy-id-or-url>
zapdev db list|dump <deploy-id-or-url>
zapdev logs <deploy-id-or-url>
zapdev auth as <name>
zapdev run-many [dir] [--count 20] [--base-port 4000]
```

## Hosting

Capsules deploy to **Zapdev Edge**, a Bun + SQLite runtime running on Railway. Anonymous deploys work first. Claim a deploy with `zapdev claim` to enable server env and outbound `fetch`.

## License

UNLICENSED, alpha.
