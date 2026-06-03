/* =====================================================================
   Luminaweb marketing site.
   ---------------------------------------------------------------------
   Server-rendered HTML (no React) served by a single Bun process.
   Vibe: Ethereal Glass + Editorial Split. Accent: electric lime.
   Type: Geist Sans + Geist Mono. No Inter. No cards-overload.
   ===================================================================== */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const DIST = join(import.meta.dir, "dist");
const PUBLIC_DIR = join(import.meta.dir, "public");

const PAGES: Record<string, Page> = {
  "/": home,
  "/docs": docs,
  "/docs/quickstart": docsQuickstart,
  "/docs/reference": docsReference,
  "/docs/capsule-api": docsCapsuleApi,
  "/docs/cli": docsCli,
  "/docs/deploy": docsDeploy,
  "/examples": examples,
  "/playground": playground,
  "/manifest": manifest,
  "/llms.txt": llms,
  "/llms-full.txt": llmsFull,
  "/docs.json": docsJson,
  "/style.css": styleCss,
  "/.well-known/security.txt": securityTxt,
};

type Page = (req: Request) => Response | Promise<Response>;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const page = PAGES[url.pathname] ?? PAGES["/"];
    try {
      return await page(req);
    } catch (err) {
      console.error(err);
      return textResponse("internal error", 500);
    }
  },
});

console.log(`[luminaweb-web] marketing on http://localhost:${server.port}`);

function textResponse(body: string, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", ...extra } });
}

function htmlResponse(body: string, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=300",
      ...extra,
    },
  });
}

function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });
}

function readPublic(name: string): string | null {
  const path = join(PUBLIC_DIR, name);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

/* ------------------------------------------------------------------ */
/*  Shared layout                                                      */
/* ------------------------------------------------------------------ */

function page(opts: {
  title: string;
  description: string;
  canonical: string;
  body: string;
  pathname: string;
}): string {
  const css = readPublic("style.css") ?? "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escape(opts.title)} · Luminaweb</title>
  <meta name="description" content="${escape(opts.description)}" />
  <link rel="canonical" href="${escape(opts.canonical)}" />
  <meta property="og:title" content="${escape(opts.title)}" />
  <meta property="og:description" content="${escape(opts.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escape(opts.canonical)}" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://rsms.me/" />
  <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
  <link rel="stylesheet" href="/style.css" />
  <style>${css}</style>
</head>
<body>
${SHELL(opts.pathname, opts.body)}
</body>
</html>`;
}

const SHELL = (pathname: string, body: string) => `
  <a class="skip" href="#main">Skip to content</a>
  <header class="nav" data-pad="lg">
    <div class="nav__inner">
      <a class="nav__brand" href="/">
        <span class="nav__bolt">▌</span>
        <span class="nav__word">luminaweb</span>
        <span class="nav__pill">[alpha]</span>
      </a>
      <nav class="nav__links" aria-label="Primary">
        <a href="/docs" ${pathname.startsWith("/docs") ? 'data-current="true"' : ""}>Docs</a>
        <a href="/examples" ${pathname === "/examples" ? 'data-current="true"' : ""}>Examples</a>
        <a href="/playground" ${pathname === "/playground" ? 'data-current="true"' : ""}>Playground</a>
        <a href="/docs/deploy" ${pathname === "/docs/deploy" ? 'data-current="true"' : ""}>Deploy</a>
        <a class="nav__cta" href="/docs/quickstart">Quickstart <span aria-hidden="true">→</span></a>
      </nav>
    </div>
  </header>
  <main id="main" class="main">${body}</main>
  <footer class="foot">
    <div class="foot__inner">
      <div class="foot__brand">
        <span class="nav__bolt">▌</span>
        <span class="nav__word">luminaweb</span>
        <span class="foot__tag">an agent-native runtime for full-stack TypeScript apps.</span>
      </div>
      <div class="foot__cols">
        <div>
          <h4>Product</h4>
          <a href="/docs">Docs</a>
          <a href="/examples">Examples</a>
          <a href="/playground">Playground</a>
          <a href="/docs/deploy">Deploy</a>
        </div>
        <div>
          <h4>Reference</h4>
          <a href="/docs/reference">Reference</a>
          <a href="/docs/capsule-api">Capsule API</a>
          <a href="/docs/cli">CLI</a>
          <a href="/llms.txt">llms.txt</a>
        </div>
        <div>
          <h4>Connect</h4>
          <a href="https://github.com/luminaweb/luminaweb">GitHub</a>
          <a href="https://x.com/luminaweb">X / Twitter</a>
          <a href="mailto:hi@luminaweb.app">hi@luminaweb.app</a>
        </div>
      </div>
      <div class="foot__base">
        <span>© 2026 Luminaweb</span>
        <span>v0.1.0 · built on Bun · deployed on Railway Edge</span>
      </div>
    </div>
  </footer>
`;

/* ------------------------------------------------------------------ */
/*  Pages                                                              */
/* ------------------------------------------------------------------ */

async function home(_req: Request): Promise<Response> {
  const body = `
    <section class="hero">
      <div class="hero__left">
        <span class="eyebrow">
          <span class="eyebrow__dot"></span>
          alpha · v0.1.0 · running on Bun
        </span>
        <h1 class="hero__title">
          <span class="hero__line"><span class="accent">Ship</span> the thing.</span>
          <span class="hero__line">Skip the <span class="accent">plumbing</span>.</span>
        </h1>
        <p class="hero__sub">
          Luminaweb is an agent-native runtime for full-stack TypeScript apps called
          <em>capsules</em>. One directory, one port, one command. <span class="hero__strike">No docker.</span> <span class="hero__strike">No yaml.</span> <span class="hero__strike">No 3am deploys.</span>
        </p>
        <div class="hero__cta">
          <a class="btn btn--primary" href="/docs/quickstart">
            <span>Install the CLI</span>
            <span class="btn__arrow" aria-hidden="true">→</span>
          </a>
          <a class="btn btn--ghost" href="/playground">Open the playground</a>
        </div>
        <pre class="terminal" aria-label="Quick start"><code><span class="t-prompt">$</span> <span class="t-cmd">npm i -g luminaweb</span>
<span class="t-prompt">$</span> <span class="t-cmd">luminaweb new my-app --template todo</span>
<span class="t-prompt">$</span> <span class="t-cmd">cd my-app && luminaweb dev</span>
<span class="t-out">▌ ready on http://localhost:3000 · 14ms cold start</span></code></pre>
      </div>
      <aside class="hero__right" aria-hidden="true">
        <div class="orb orb--a"></div>
        <div class="orb orb--b"></div>
        <div class="orb orb--c"></div>
        <div class="hero__chip hero__chip--1">
          <span class="hero__chip-dot"></span> capsule built
        </div>
        <div class="hero__chip hero__chip--2">9.2 kB client bundle</div>
        <div class="hero__chip hero__chip--3">luminaweb deploy 4.6s</div>
      </aside>
    </section>

    <section class="band">
      <div class="band__inner">
        <span class="band__pill">what is it</span>
        <h2 class="band__title">An agent-native runtime.<br/><span class="dim">Not a meta-framework.</span></h2>
        <p class="band__body">
          You write a <code>capsule()</code> with a schema, queries, mutations, and a Preact UI.
          Luminaweb handles the rest: server authority, routing, persistence, deploys, the boring parts.
          The runtime is small enough to read in a sitting. It stays out of your way.
        </p>
      </div>
    </section>

    <section class="split">
      <div class="split__copy">
        <span class="eyebrow eyebrow--dark">file layout</span>
        <h2>Three files.<br/>That's the whole app.</h2>
        <p>
          The capsule lives in one directory. A server contract, a Preact client, a
          <code>shared/</code> folder for types, and an optional <code>.env.luminaweb.server</code>
          for secrets. No build config. No router config. No bundler config.
        </p>
      </div>
      <pre class="tree"><code>my-app/
├── server/
│   └── index.ts       <span class="dim">// capsule, schema, queries, mutations</span>
├── client/
│   └── index.tsx      <span class="dim">// Preact UI</span>
├── shared/
│   └── todo.ts        <span class="dim">// pure types &amp; helpers</span>
├── .env.luminaweb.server <span class="dim">// server-only secrets</span>
└── package.json</code></pre>
    </section>

    <section class="code">
      <div class="code__head">
        <span class="code__file">server/index.ts</span>
        <span class="code__lang">TypeScript</span>
      </div>
      <pre class="code__body"><code><span class="kw">import</span> { <span class="sym">boolean, capsule, mutation, query, string, table</span> } <span class="kw">from</span> <span class="str">"@luminaweb/runtime/server"</span>;

<span class="kw">export default</span> <span class="fn">capsule</span>({
  schema: {
    todos: <span class="fn">table</span>({
      text: <span class="fn">string</span>(),
      done: <span class="fn">boolean</span>(),
      ownerId: <span class="fn">string</span>(),
    }),
  },
  queries: {
    todos: <span class="fn">query</span>((ctx) =&gt;
      ctx.db.todos.where(<span class="str">"ownerId"</span>, ctx.auth.userId).<span class="fn">all</span>(),
    ),
  },
  mutations: {
    addTodo: <span class="fn">mutation</span>((ctx, text: <span class="typ">string</span>) =&gt; {
      ctx.db.todos.insert({ text, done: <span class="kw">false</span>, ownerId: ctx.auth.userId });
    }),
  },
});</code></pre>
    </section>

    <section class="features">
      <div class="features__intro">
        <span class="eyebrow eyebrow--dark">why it works</span>
        <h2>Built for the <span class="accent">agent</span>,<br/> not the framework.</h2>
      </div>
      <div class="features__grid">
        <article class="feat">
          <span class="feat__num">01</span>
          <h3>Server-authoritative</h3>
          <p>
            Queries and mutations are the source of truth. The client never writes to tables.
            Re-check ownership in every mutation. The runtime preserves ordinary control flow
            in the server sandbox, so the contract stays the contract.
          </p>
        </article>
        <article class="feat">
          <span class="feat__num">02</span>
          <h3>Persistent by default</h3>
          <p>
            Local dev writes to a real SQLite file. Edge deploys get a managed SQLite.
            No in-memory resets, no "did you remember to flush". The data outlives the
            process.
          </p>
        </article>
        <article class="feat">
          <span class="feat__num">03</span>
          <h3>One port, one bundle</h3>
          <p>
            The client, the server, and the static SPA all live on the same origin. One
            deploy artifact, one process, one URL. No CORS. No "is staging on the same
            domain?" Slack archaeology.
          </p>
        </article>
        <article class="feat">
          <span class="feat__num">04</span>
          <h3>Typed through and through</h3>
          <p>
            <code>useQuery&lt;Todo[]&gt;("todos")</code> is end-to-end typed.
            Mutations are <code>useMutation&lt;[id: string, done: boolean], void&gt;</code>.
            Rename a query and the client errors in the editor, not in production.
          </p>
        </article>
        <article class="feat">
          <span class="feat__num">05</span>
          <h3>Runs on Railway Edge</h3>
          <p>
            <code>luminaweb deploy</code> pushes your capsule to the Luminaweb Edge, a Bun +
            SQLite runtime on Railway. Anonymous deploys go through in seconds. Claim
            for server env, outbound fetch, and stable subdomains.
          </p>
        </article>
        <article class="feat">
          <span class="feat__num">06</span>
          <h3>Inspectable</h3>
          <p>
            <code>luminaweb db dump</code>, <code>luminaweb logs</code>, <code>luminaweb inspect</code>.
            The CLI reads <code>.luminaweb/deploy.json</code> and sends the saved claim token
            automatically. No portal, no click-ops.
          </p>
        </article>
      </div>
    </section>

    <section class="deploy">
      <div class="deploy__inner">
        <span class="eyebrow">deploy</span>
        <h2>From <code class="dim">my-app/</code><br/>to <span class="accent">live</span> in one command.</h2>
        <ol class="deploy__steps">
          <li><span class="deploy__num">01</span><span class="deploy__cmd"><code>luminaweb build --target edge</code></span><span class="deploy__note">bundle server.mjs + client/bundle.js</span></li>
          <li><span class="deploy__num">02</span><span class="deploy__cmd"><code>luminaweb deploy</code></span><span class="deploy__note">push to edge.luminaweb.app</span></li>
          <li><span class="deploy__num">03</span><span class="deploy__cmd"><code>luminaweb claim</code></span><span class="deploy__note">opt in for env, fetch, and subdomains</span></li>
        </ol>
        <div class="deploy__url">
          <span class="deploy__url-label">live url</span>
          <code>https://my-app.luminaweb.app</code>
        </div>
      </div>
    </section>

    <section class="cta">
      <h2>Build the thing.<br/><span class="dim">The runtime will keep up.</span></h2>
      <a class="btn btn--primary btn--lg" href="/docs/quickstart">
        <span>Read the quickstart</span>
        <span class="btn__arrow" aria-hidden="true">→</span>
      </a>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Ship the thing. Skip the plumbing.",
      description:
        "Luminaweb is an agent-native runtime for full-stack TypeScript apps. One directory, one port, one command. Deployed to the edge.",
      canonical: "https://luminaweb.app/",
      body,
      pathname: "/",
    }),
  );
}

/* ------------------------------------------------------------------ */
/*  Docs pages                                                         */
/* ------------------------------------------------------------------ */

const DOCS_NAV = `
  <nav class="docs__nav" aria-label="Docs">
    <a href="/docs">Overview</a>
    <a href="/docs/quickstart">Quickstart</a>
    <a href="/docs/capsule-api">Capsule API</a>
    <a href="/docs/reference">Reference</a>
    <a href="/docs/cli">CLI</a>
    <a href="/docs/deploy">Deploy</a>
  </nav>
`;

async function docs(_req: Request): Promise<Response> {
  const body = `
    <section class="doc">
      <header class="doc__head">
        <span class="eyebrow">docs</span>
        <h1>Luminaweb Docs <span class="nav__pill">[alpha]</span></h1>
        <p class="doc__lede">
          Luminaweb is an agent-native CLI and runtime for building small full-stack TypeScript
          apps called <strong>capsules</strong>. The capsule directory is the whole app: server
          contract, Preact client, runtime state, deploy URL.
        </p>
      </header>
      ${DOCS_NAV}
      <article class="prose">
        <h2>Start here</h2>
        <p>Create and run a capsule:</p>
        <pre><code>npx luminaweb new my-app --template todo
cd my-app
npx luminaweb dev</code></pre>
        <p>
          <code>npx luminaweb create</code> is an alias for <code>npx luminaweb new</code>. New capsules
          get a git repository and initial commit unless they are created inside an existing git
          repository or <code>--no-git</code> is passed.
        </p>
        <h2>Capsule shape</h2>
        <pre><code>server/index.ts        # schema, queries, mutations, endpoints
client/index.tsx       # Preact UI
shared/                # pure types &amp; helpers
.env.luminaweb.server     # server-only env</code></pre>
        <h2>Read next</h2>
        <ul>
          <li><a href="/docs/quickstart">Quickstart</a> — the fastest path from <code>npm i</code> to <code>live url</code>.</li>
          <li><a href="/docs/capsule-api">Capsule API</a> — the API shape an agent uses.</li>
          <li><a href="/docs/reference">Reference</a> — capsule runtime, data API, CLI, deploy.</li>
          <li><a href="/docs/cli">CLI</a> — every command, every flag.</li>
          <li><a href="/docs/deploy">Deploy</a> — pushing to the Luminaweb Edge.</li>
        </ul>
      </article>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Luminaweb Docs",
      description: "Luminaweb is an agent-native CLI and runtime for full-stack TypeScript apps.",
      canonical: "https://luminaweb.app/docs",
      body,
      pathname: "/docs",
    }),
  );
}

async function docsQuickstart(_req: Request): Promise<Response> {
  const body = `
    <section class="doc">
      <header class="doc__head">
        <span class="eyebrow">docs · quickstart</span>
        <h1>Quickstart</h1>
        <p class="doc__lede">From <code>npm i</code> to a live URL in under a minute.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose">
        <h2>1 · Install</h2>
        <pre><code>npm i -g luminaweb
luminaweb version
# luminaweb 0.1.0</code></pre>
        <h2>2 · Scaffold</h2>
        <pre><code>luminaweb new my-app --template todo
cd my-app</code></pre>
        <h2>3 · Run</h2>
        <pre><code>luminaweb dev
# ready on http://localhost:3000 · 14ms cold start</code></pre>
        <p>Open <code>http://localhost:3000</code> and try <code>?luminaweb_guest=alice</code> in another tab.</p>
        <h2>4 · Inspect</h2>
        <pre><code>luminaweb db list --port 3000
luminaweb db dump --port 3000
luminaweb logs --port 3000</code></pre>
        <h2>5 · Deploy</h2>
        <pre><code>luminaweb build --target edge
luminaweb deploy
luminaweb claim</code></pre>
        <p>Anonymous deploys work first. <code>luminaweb claim</code> associates the deploy with your account and enables server env, outbound <code>fetch</code>, and stable subdomains.</p>
      </article>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Quickstart",
      description: "Install Luminaweb, scaffold a capsule, run it locally, deploy it.",
      canonical: "https://luminaweb.app/docs/quickstart",
      body,
      pathname: "/docs/quickstart",
    }),
  );
}

async function docsReference(_req: Request): Promise<Response> {
  const body = `
    <section class="doc">
      <header class="doc__head">
        <span class="eyebrow">docs · reference</span>
        <h1>Reference</h1>
        <p class="doc__lede">The full capsule contract: server, data API, client, auth, env, deploy.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose">
        <h2>Capsule</h2>
        <p>A capsule is one complete app: source, server API, client UI, state, auth, logs, and deploy URL.</p>
        <h2>Server API</h2>
        <pre><code>import { boolean, capsule, mutation, query, string, table } from "@luminaweb/runtime/server";</code></pre>
        <h3>Tables</h3>
        <pre><code>todos: table({
  text: string(),
  done: boolean(),
  ownerId: string(),
})</code></pre>
        <h3>Field types (v0)</h3>
        <ul>
          <li><code>string()</code></li>
          <li><code>boolean()</code></li>
          <li><code>number()</code></li>
          <li><code>text()</code> — same as <code>string()</code>, semantically free-form</li>
          <li><code>json&lt;T&gt;()</code> — stored as JSON</li>
        </ul>
        <h3>Every row has</h3>
        <ul>
          <li><code>id</code></li>
          <li><code>createdAt</code></li>
          <li><code>updatedAt</code></li>
        </ul>
        <h3>Table methods</h3>
        <ul>
          <li><code>where(field, value)</code></li>
          <li><code>orderBy(field, "asc" | "desc")</code></li>
          <li><code>limit(count)</code></li>
          <li><code>all()</code></li>
          <li><code>get(id)</code></li>
          <li><code>insert(value)</code></li>
          <li><code>update(id, patch)</code></li>
          <li><code>delete(id)</code></li>
        </ul>
        <h2>Client API</h2>
        <pre><code>import {
  Link, Route, Router, Routes, SignInWithGoogle,
  signOut, useAuth, useMutation, useNavigate, useParams, useQuery,
} from "@luminaweb/runtime/client";</code></pre>
        <h2>Auth</h2>
        <p>Every capsule starts with guest auth. <code>ctx.auth.userId</code> is the stable per-user identifier. <code>ctx.auth.provider</code> is <code>"guest"</code> or <code>"google"</code>.</p>
        <h2>Deploy</h2>
        <p>Anonymous deploys are first-class. <code>luminaweb claim</code> upgrades to env + fetch + stable subdomain.</p>
      </article>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Reference",
      description: "Capsule runtime, server, data, client, auth, env, and deploy reference.",
      canonical: "https://luminaweb.app/docs/reference",
      body,
      pathname: "/docs/reference",
    }),
  );
}

async function docsCapsuleApi(_req: Request): Promise<Response> {
  const body = `
    <section class="doc">
      <header class="doc__head">
        <span class="eyebrow">docs · capsule api</span>
        <h1>Capsule API</h1>
        <p class="doc__lede">The shape an agent uses when authoring a capsule.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose">
        <h2>Define the server</h2>
        <pre><code>import { boolean, capsule, mutation, query, string, table } from "@luminaweb/runtime/server";

export default capsule({
  schema: { todos: table({ text: string(), done: boolean(), ownerId: string() }) },
  queries: {
    todos: query((ctx) =&gt;
      ctx.db.todos.where("ownerId", ctx.auth.userId).orderBy("createdAt", "desc").all(),
    ),
  },
  mutations: {
    addTodo: mutation((ctx, text: string) =&gt; {
      const clean = text.trim().slice(0, 160);
      if (!clean) return;
      ctx.db.todos.insert({ text: clean, done: false, ownerId: ctx.auth.userId });
    }),
    setTodoDone: mutation((ctx, id: string, done: boolean) =&gt; {
      const todo = ctx.db.todos.get(id);
      if (!todo || todo.ownerId !== ctx.auth.userId) return;
      ctx.db.todos.update(id, { done });
    }),
  },
});</code></pre>
        <h2>Build the client</h2>
        <pre><code>import { useAuth, useMutation, useQuery, SignInWithGoogle, signOut } from "@luminaweb/runtime/client";

export function App() {
  const auth = useAuth();
  const todos = useQuery&lt;Todo[]&gt;("todos");
  const addTodo = useMutation&lt;[text: string], void&gt;("addTodo");
  // ...
}</code></pre>
        <h2>Auth</h2>
        <p>Use <code>useAuth()</code> on the client and <code>ctx.auth</code> on the server. Do not accept <code>authorId</code> or other trusted metadata from the client.</p>
      </article>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Capsule API",
      description: "The API shape an agent uses when authoring a Luminaweb capsule.",
      canonical: "https://luminaweb.app/docs/capsule-api",
      body,
      pathname: "/docs/capsule-api",
    }),
  );
}

async function docsCli(_req: Request): Promise<Response> {
  const body = `
    <section class="doc">
      <header class="doc__head">
        <span class="eyebrow">docs · cli</span>
        <h1>CLI</h1>
        <p class="doc__lede">Every command, every flag.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose">
        <h2>Commands</h2>
        <pre><code>luminaweb new [name] [--template todo] [--no-git]
luminaweb create [name]                    # alias for new
luminaweb dev [dir] [--port 3000]
luminaweb build [dir] --target edge [--out dist]
luminaweb deploy [dir] [--public]
luminaweb claim [dir]
luminaweb inspect &lt;deploy-id-or-url&gt;
luminaweb db list [deploy-id-or-url] [--port 3000]
luminaweb db dump [deploy-id-or-url] [--port 3000]
luminaweb logs [deploy-id-or-url] [--port 3000]
luminaweb auth as &lt;name&gt;
luminaweb auth reset
luminaweb run-many [dir] [--count 20] [--base-port 4000]
luminaweb version
luminaweb help</code></pre>
        <h2>Environment</h2>
        <ul>
          <li><code>ZAPDEV_TOKEN</code> — auth token for claimed deploys.</li>
          <li><code>ZAPDEV_EDGE_URL</code> — override the edge target (default <code>https://edge.luminaweb.app</code>).</li>
          <li><code>ZAPDEV_DATA_DIR</code> — where the edge stores SQLite files.</li>
          <li><code>ZAPDEV_TRUST_PROXY_HEADERS</code> — trust forwarded client IPs.</li>
          <li><code>ZAPDEV_DEBUG</code> — print stack traces on CLI errors.</li>
        </ul>
      </article>
    </section>
  `;
  return htmlResponse(
    page({
      title: "CLI",
      description: "Every command, every flag for the Luminaweb CLI.",
      canonical: "https://luminaweb.app/docs/cli",
      body,
      pathname: "/docs/cli",
    }),
  );
}

async function docsDeploy(_req: Request): Promise<Response> {
  const body = `
    <section class="doc">
      <header class="doc__head">
        <span class="eyebrow">docs · deploy</span>
        <h1>Deploy</h1>
        <p class="doc__lede">Push the bundle. Claim for env. Ship.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose">
        <h2>Build</h2>
        <pre><code>luminaweb build --target edge --out dist
# dist/server.mjs
# dist/client/bundle.js
# dist/client/index.html
# dist/manifest.json</code></pre>
        <h2>Deploy</h2>
        <pre><code>luminaweb deploy</code></pre>
        <p>Anonymous deploys work first. The bundle is uploaded to <code>edge.luminaweb.app</code> and served from a fresh subdomain within seconds.</p>
        <h2>Claim</h2>
        <pre><code>export ZAPDEV_TOKEN=...
luminaweb claim</code></pre>
        <p>Claiming enables server-only env (<code>.env.luminaweb.server</code>), outbound <code>fetch</code>, and a stable subdomain.</p>
        <h2>Reserve a subdomain</h2>
        <pre><code>luminaweb domains add my-app.luminaweb.app</code></pre>
        <h2>Inspect</h2>
        <pre><code>luminaweb inspect my-app.luminaweb.app
luminaweb db list my-app.luminaweb.app
luminaweb logs my-app.luminaweb.app</code></pre>
      </article>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Deploy",
      description: "Build, deploy, claim, and inspect a Luminaweb capsule on the edge.",
      canonical: "https://luminaweb.app/docs/deploy",
      body,
      pathname: "/docs/deploy",
    }),
  );
}

async function examples(_req: Request): Promise<Response> {
  const body = `
    <section class="examples">
      <header class="doc__head">
        <span class="eyebrow">examples</span>
        <h1>Cookbook</h1>
        <p class="doc__lede">Each example is a complete capsule. Copy, edit, ship.</p>
      </header>
      <div class="examples__grid">
        <a class="ex" href="/examples/todo">
          <span class="ex__num">01</span>
          <h3>todo</h3>
          <p>Per-user rows, ownership checks, checkbox mutation, clear-completed. The smallest useful Luminaweb app.</p>
          <pre><code>luminaweb new my-app --template todo</code></pre>
        </a>
        <a class="ex" href="/examples/guestbook">
          <span class="ex__num">02</span>
          <h3>guestbook</h3>
          <p>Shared feed, author metadata from auth, bounded text validation. Demonstrates server-set trusted fields.</p>
          <pre><code>luminaweb new my-app --template guestbook</code></pre>
        </a>
        <a class="ex" href="/examples/chat">
          <span class="ex__num">03</span>
          <h3>chat</h3>
          <p>Realtime-feel message feed with <code>useQuery</code> invalidation. End-to-end typed messages.</p>
          <pre><code>luminaweb new my-app --template chat</code></pre>
        </a>
        <a class="ex" href="/examples/counter">
          <span class="ex__num">04</span>
          <h3>counter</h3>
          <p>One button, one number, one mutation. The whole runtime, in 30 lines.</p>
          <pre><code>luminaweb new my-app --template counter</code></pre>
        </a>
        <a class="ex" href="/examples/webhook">
          <span class="ex__num">05</span>
          <h3>webhook</h3>
          <p>Stripe-shaped webhook receiver with shared-secret verification. Demonstrates <code>endpoint()</code> and <code>ctx.env</code>.</p>
          <pre><code>luminaweb new my-app --template webhook</code></pre>
        </a>
        <a class="ex" href="/examples/blank">
          <span class="ex__num">06</span>
          <h3>blank</h3>
          <p>An empty capsule. The smallest possible surface area.</p>
          <pre><code>luminaweb new my-app --template blank</code></pre>
        </a>
      </div>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Examples",
      description: "Cookbook of Luminaweb capsules: todo, guestbook, chat, counter, webhook, blank.",
      canonical: "https://luminaweb.app/examples",
      body,
      pathname: "/examples",
    }),
  );
}

async function playground(_req: Request): Promise<Response> {
  const body = `
    <section class="play">
      <header class="doc__head">
        <span class="eyebrow">playground</span>
        <h1>Try Luminaweb in the browser.</h1>
        <p class="doc__lede">A live capsule. The source is the same source. Reload to reset state.</p>
      </header>
      <div class="play__grid">
        <div class="play__capsule">
          <div class="play__frame">
            <div class="play__titlebar">
              <span class="play__dot play__dot--a"></span>
              <span class="play__dot play__dot--b"></span>
              <span class="play__dot play__dot--c"></span>
              <span class="play__url">my-app.luminaweb.app</span>
            </div>
            <div class="play__body" id="play-app">
              <p class="play__loading">loading capsule…</p>
            </div>
          </div>
        </div>
        <aside class="play__src">
          <div class="play__tabs">
            <span class="play__tab play__tab--active">server/index.ts</span>
            <span class="play__tab">client/index.tsx</span>
            <span class="play__tab">shared/todo.ts</span>
          </div>
          <pre class="play__code"><code><span class="kw">import</span> { boolean, capsule, mutation, query, string, table } <span class="kw">from</span> <span class="str">"@luminaweb/runtime/server"</span>;

<span class="kw">export default</span> capsule({
  schema: {
    todos: <span class="fn">table</span>({
      text: string(),
      done: boolean(),
      ownerId: string(),
    }),
  },
  queries: {
    todos: <span class="fn">query</span>((ctx) =&gt;
      ctx.db.todos.where(<span class="str">"ownerId"</span>, ctx.auth.userId).all(),
    ),
  },
  mutations: {
    addTodo: <span class="fn">mutation</span>((ctx, text: <span class="typ">string</span>) =&gt; {
      ctx.db.todos.insert({ text, done: <span class="kw">false</span>, ownerId: ctx.auth.userId });
    }),
  },
});</code></pre>
        </aside>
      </div>
    </section>
  `;
  return htmlResponse(
    page({
      title: "Playground",
      description: "A live Luminaweb capsule running in your browser.",
      canonical: "https://luminaweb.app/playground",
      body,
      pathname: "/playground",
    }),
  );
}

/* ------------------------------------------------------------------ */
/*  Machine-readable                                                   */
/* ------------------------------------------------------------------ */

async function manifest(_req: Request): Promise<Response> {
  return jsonResponse({
    name: "Luminaweb",
    url: "https://luminaweb.app",
    description: "Luminaweb is an alpha-stage agent-native CLI and runtime for full-stack TypeScript apps.",
    sourceRepository: "https://github.com/luminaweb/luminaweb",
    agentEntrypoints: {
      manifest: "/docs.json",
      llms: "/llms.txt",
      llmsFull: "/llms-full.txt",
    },
    pages: [
      { title: "Luminaweb Docs", section: "Docs", url: "/docs" },
      { title: "Quickstart", section: "Docs", url: "/docs/quickstart" },
      { title: "Reference", section: "Docs", url: "/docs/reference" },
      { title: "Capsule API", section: "Docs", url: "/docs/capsule-api" },
      { title: "CLI", section: "Docs", url: "/docs/cli" },
      { title: "Deploy", section: "Docs", url: "/docs/deploy" },
      { title: "Examples", section: "Examples", url: "/examples" },
    ],
  });
}

async function docsJson(_req: Request): Promise<Response> {
  return jsonResponse({
    name: "Luminaweb Docs",
    url: "https://luminaweb.app/docs",
    description: "Public alpha documentation for Luminaweb, an agent-native CLI and runtime for full-stack TypeScript apps.",
    sourceRepository: "https://github.com/luminaweb/luminaweb",
    agentEntrypoints: { manifest: "/docs.json", llms: "/llms.txt", llmsFull: "/llms-full.txt" },
    pages: [
      { title: "Luminaweb Docs", url: "/docs" },
      { title: "Quickstart", url: "/docs/quickstart" },
      { title: "Reference", url: "/docs/reference" },
      { title: "Capsule API", url: "/docs/capsule-api" },
      { title: "CLI", url: "/docs/cli" },
      { title: "Deploy", url: "/docs/deploy" },
    ],
  });
}

async function llms(_req: Request): Promise<Response> {
  return textResponse(`# Luminaweb

> Luminaweb is an alpha-stage agent-native CLI and runtime for full-stack TypeScript apps.

## Docs

- [Luminaweb Docs](https://luminaweb.app/docs)
- [Quickstart](https://luminaweb.app/docs/quickstart)
- [Reference](https://luminaweb.app/docs/reference)
- [Capsule API](https://luminaweb.app/docs/capsule-api)
- [CLI](https://luminaweb.app/docs/cli)
- [Deploy](https://luminaweb.app/docs/deploy)

## Machine-readable

- [docs.json](https://luminaweb.app/docs.json)
- [llms-full.txt](https://luminaweb.app/llms-full.txt)
`);
}

async function llmsFull(_req: Request): Promise<Response> {
  // Concatenate the local doc pages into a single LLM-friendly dump.
  // Uses the same generators as the live routes so the content always
  // matches what humans see.
  const pages = [
    docs,
    docsQuickstart,
    docsReference,
    docsCapsuleApi,
    docsCli,
    docsDeploy,
  ];
  const blocks: string[] = [];
  for (const page of pages) {
    try {
      const res = await page(new Request("http://localhost/"));
      const text = await res.text();
      blocks.push(stripHtml(text));
    } catch {
      blocks.push("(unavailable)");
    }
  }
  return textResponse(`# Luminaweb — full text

${blocks.join("\n\n---\n\n")}
`);
}

async function securityTxt(_req: Request): Promise<Response> {
  return textResponse("Contact: mailto:security@luminaweb.app\nExpires: 2027-01-01T00:00:00.000Z\n");
}

async function styleCss(_req: Request): Promise<Response> {
  const css = readPublic("style.css");
  if (!css) return textResponse("/* not found */", 404);
  return new Response(css, { headers: { "content-type": "text/css; charset=utf-8" } });
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
