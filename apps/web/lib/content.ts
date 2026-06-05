/* =====================================================================
   Page body markup, ported verbatim from the original Bun server.
   Rendered into the shared shell via dangerouslySetInnerHTML so the
   GUI is byte-for-byte identical to the previous site.
   ===================================================================== */

export type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  pathname: string;
};

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

export const homeBody = `
    <section class="hero">
      <div class="hero__ambient"><div class="hero__blob"></div></div>
      <div class="hero__content">
        <div class="hero__meta reveal">
          <span class="tag tag--green"><span class="tag__dot"></span>alpha · v0.1.0</span>
          <span class="hero__meta-text">built on Bun · deployed on Railway Edge</span>
        </div>
        <h1 class="hero__title reveal reveal-d1">
          Ship the thing.<br/><em>Skip the plumbing.</em>
        </h1>
        <p class="hero__sub reveal reveal-d2">
          Luminaweb is an agent-native runtime for full-stack TypeScript apps called
          <strong>capsules</strong>. One directory, one port, one command.
          <del>No docker.</del> <del>No yaml.</del> <del>No 3am deploys.</del>
        </p>
        <div class="hero__actions reveal reveal-d3">
          <a class="btn btn--primary btn--lg" href="/docs/quickstart">Read the quickstart</a>
          <a class="btn btn--ghost btn--lg" href="/playground">Try the playground</a>
        </div>
        <div class="reveal reveal-d4">
          <div class="terminal" aria-label="Quick start">
            <div class="terminal__bar">
              <span class="terminal__dot"></span>
              <span class="terminal__dot"></span>
              <span class="terminal__dot"></span>
            </div>
            <div class="terminal__body">
              <code><span class="t-prompt">$</span> <span class="t-cmd">npm i -g luminaweb</span>
<span class="t-prompt">$</span> <span class="t-cmd">luminaweb new my-app --template todo</span>
<span class="t-prompt">$</span> <span class="t-cmd">cd my-app &amp;&amp; luminaweb dev</span>
<span class="t-out">▌ ready on http://localhost:3000 · 14ms cold start</span></code>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="band">
      <div class="band__inner">
        <div class="reveal">
          <h2 class="band__title">An agent-native<br/><em>runtime.</em></h2>
        </div>
        <div class="band__body reveal reveal-d1">
          <p>
            You write a <code>capsule()</code> with a schema, queries, mutations, and a Preact UI.
            Luminaweb handles the rest: server authority, routing, persistence, deploys, the boring parts.
          </p>
          <p>
            The runtime is small enough to read in a sitting. It stays out of your way.
            No framework churn, no opinion on your folder structure.
          </p>
        </div>
      </div>
    </section>

    <section class="split">
      <div class="split__copy reveal">
        <h2>Three files.<br/><em>That's the whole app.</em></h2>
        <p>
          The capsule lives in one directory. A server contract, a Preact client, a
          <code>shared/</code> folder for types, and an optional <code>.env.luminaweb.server</code>
          for secrets. No build config. No router config. No bundler config.
        </p>
      </div>
      <div class="reveal reveal-d1">
        <div class="tree"><code>my-app/
├── server/
│   └── index.ts       <span class="dim">// capsule, schema, queries, mutations</span>
├── client/
│   └── index.tsx      <span class="dim">// Preact UI</span>
├── shared/
│   └── todo.ts        <span class="dim">// pure types &amp; helpers</span>
├── .env.luminaweb.server <span class="dim">// server-only secrets</span>
└── package.json</code></div>
      </div>
    </section>

    <div class="code reveal">
      <div class="code__head">
        <div class="code__circles">
          <span class="code__circle"></span>
          <span class="code__circle"></span>
          <span class="code__circle"></span>
        </div>
        <span class="code__file">server/index.ts</span>
        <span class="code__lang">TypeScript</span>
      </div>
      <div class="code__body">
        <code><span class="kw">import</span> { <span class="sym">boolean, capsule, mutation, query, string, table</span> } <span class="kw">from</span> <span class="str">"luminaweb-runtime/server"</span>;

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
});</code>
      </div>
    </div>

    <section class="features">
      <div class="features__intro reveal">
        <p class="features__eyebrow">why it works</p>
        <h2>Built for the agent,<br/><em>not the framework.</em></h2>
      </div>
      <div class="features__grid">
        <article class="feat reveal reveal-d1">
          <p class="feat__num">01</p>
          <h3>Server-authoritative</h3>
          <p>
            Queries and mutations are the source of truth. The client never writes to tables.
            Re-check ownership in every mutation. The runtime preserves ordinary control flow
            in the server sandbox, so the contract stays the contract.
          </p>
        </article>
        <article class="feat reveal reveal-d2">
          <p class="feat__num">02</p>
          <h3>Persistent by default</h3>
          <p>
            Local dev writes to a real SQLite file. Edge deploys get a managed SQLite.
            No in-memory resets. The data outlives the process.
          </p>
        </article>
        <article class="feat reveal reveal-d3">
          <p class="feat__num">03</p>
          <h3>One port, one bundle</h3>
          <p>
            The client, the server, and the static SPA all live on the same origin. One
            deploy artifact, one process, one URL. No CORS archaeology.
          </p>
        </article>
        <article class="feat reveal reveal-d4">
          <p class="feat__num">04</p>
          <h3>Typed through and through</h3>
          <p>
            <code>useQuery&lt;Todo[]&gt;("todos")</code> is end-to-end typed.
            Rename a query and the client errors in the editor, not in production.
          </p>
        </article>
        <article class="feat reveal reveal-d5">
          <p class="feat__num">05</p>
          <h3>Runs on Railway Edge</h3>
          <p>
            <code>luminaweb deploy</code> pushes your capsule to the Luminaweb Edge.
            Anonymous deploys go through in seconds. Claim for stable subdomains.
          </p>
        </article>
        <article class="feat reveal reveal-d6">
          <p class="feat__num">06</p>
          <h3>Inspectable</h3>
          <p>
            <code>luminaweb db dump</code>, <code>luminaweb logs</code>, <code>luminaweb inspect</code>.
            The CLI reads <code>.luminaweb/deploy.json</code> and sends the claim token
            automatically. No portal, no click-ops.
          </p>
        </article>
      </div>
    </section>

    <section class="deploy">
      <div class="deploy__inner">
        <p class="deploy__eyebrow reveal">deploy</p>
        <h2 class="reveal reveal-d1">From <code>my-app/</code><br/>to <em>live</em> in one command.</h2>
        <ol class="deploy__steps">
          <li class="reveal reveal-d2">
            <span class="deploy__num">01</span>
            <span class="deploy__cmd"><code>luminaweb build --target edge</code></span>
            <span class="deploy__note">bundle server.mjs + client/bundle.js</span>
          </li>
          <li class="reveal reveal-d3">
            <span class="deploy__num">02</span>
            <span class="deploy__cmd"><code>luminaweb deploy</code></span>
            <span class="deploy__note">push to edge.luminaweb.app</span>
          </li>
          <li class="reveal reveal-d4">
            <span class="deploy__num">03</span>
            <span class="deploy__cmd"><code>luminaweb claim</code></span>
            <span class="deploy__note">opt in for env, fetch, and subdomains</span>
          </li>
        </ol>
        <div class="deploy__url reveal reveal-d5">
          <span class="deploy__url-label">live url</span>
          <code>https://my-app.luminaweb.app</code>
        </div>
      </div>
    </section>

    <section class="cta">
      <h2 class="reveal">Build the thing.<br/><em>The runtime will keep up.</em></h2>
      <a class="btn btn--primary btn--lg reveal reveal-d1" href="/docs/quickstart">Read the quickstart</a>
    </section>
  `;

export const docsBody = `
    <section class="doc">
      <header class="doc__head reveal">
        <span class="tag tag--blue">docs</span>
        <h1>Luminaweb Docs <span class="nav__tag">alpha</span></h1>
        <p class="doc__lede">
          Luminaweb is an agent-native CLI and runtime for building small full-stack TypeScript
          apps called <strong>capsules</strong>. The capsule directory is the whole app: server
          contract, Preact client, runtime state, deploy URL.
        </p>
      </header>
      ${DOCS_NAV}
      <article class="prose reveal">
        <h2>Start here</h2>
        <p>Create and run a capsule:</p>
        <pre><code>npx luminaweb new my-app --template todo
cd my-app
npx luminaweb dev</code></pre>
        <p>
          <code>npx luminaweb create</code> is an alias for <code>npx luminaweb new</code>. New capsules
          get a git repository and initial commit unless created inside an existing git
          repository or <code>--no-git</code> is passed.
        </p>
        <h2>Capsule shape</h2>
        <pre><code>server/index.ts        # schema, queries, mutations, endpoints
client/index.tsx       # Preact UI
shared/                # pure types &amp; helpers
.env.luminaweb.server  # server-only env</code></pre>
        <h2>Read next</h2>
        <ul>
          <li><a href="/docs/quickstart">Quickstart</a> — the fastest path from <code>npm i</code> to a live URL.</li>
          <li><a href="/docs/capsule-api">Capsule API</a> — the API shape an agent uses.</li>
          <li><a href="/docs/reference">Reference</a> — capsule runtime, data API, CLI, deploy.</li>
          <li><a href="/docs/cli">CLI</a> — every command, every flag.</li>
          <li><a href="/docs/deploy">Deploy</a> — pushing to the Luminaweb Edge.</li>
        </ul>
      </article>
    </section>
  `;

export const docsQuickstartBody = `
    <section class="doc">
      <header class="doc__head reveal">
        <span class="tag tag--blue">docs · quickstart</span>
        <h1>Quickstart</h1>
        <p class="doc__lede">From <code>npm i</code> to a live URL in under a minute.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose reveal">
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

export const docsReferenceBody = `
    <section class="doc">
      <header class="doc__head reveal">
        <span class="tag tag--blue">docs · reference</span>
        <h1>Reference</h1>
        <p class="doc__lede">The full capsule contract: server, data API, client, auth, env, deploy.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose reveal">
        <h2>Capsule</h2>
        <p>A capsule is one complete app: source, server API, client UI, state, auth, logs, and deploy URL.</p>
        <h2>Server API</h2>
        <pre><code>import { boolean, capsule, mutation, query, string, table } from "luminaweb-runtime/server";</code></pre>
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
} from "luminaweb-runtime/client";</code></pre>
        <h2>Auth</h2>
        <p>Every capsule starts with guest auth. <code>ctx.auth.userId</code> is the stable per-user identifier. <code>ctx.auth.provider</code> is <code>"guest"</code> or <code>"google"</code>.</p>
        <h2>Deploy</h2>
        <p>Anonymous deploys are first-class. <code>luminaweb claim</code> upgrades to env + fetch + stable subdomain.</p>
      </article>
    </section>
  `;

export const docsCapsuleApiBody = `
    <section class="doc">
      <header class="doc__head reveal">
        <span class="tag tag--blue">docs · capsule api</span>
        <h1>Capsule API</h1>
        <p class="doc__lede">The shape an agent uses when authoring a capsule.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose reveal">
        <h2>Define the server</h2>
        <pre><code>import { boolean, capsule, mutation, query, string, table } from "luminaweb-runtime/server";

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
        <pre><code>import { useAuth, useMutation, useQuery, SignInWithGoogle, signOut } from "luminaweb-runtime/client";

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

export const docsCliBody = `
    <section class="doc">
      <header class="doc__head reveal">
        <span class="tag tag--blue">docs · cli</span>
        <h1>CLI</h1>
        <p class="doc__lede">Every command, every flag.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose reveal">
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
          <li><code>LUMINAWEB_TOKEN</code> — auth token for claimed deploys.</li>
          <li><code>LUMINAWEB_EDGE_URL</code> — override the edge target (default <code>https://edge.luminaweb.app</code>).</li>
          <li><code>LUMINAWEB_DATA_DIR</code> — where the edge stores SQLite files.</li>
          <li><code>LUMINAWEB_TRUST_PROXY_HEADERS</code> — trust forwarded client IPs.</li>
          <li><code>LUMINAWEB_DEBUG</code> — print stack traces on CLI errors.</li>
        </ul>
      </article>
    </section>
  `;

export const docsDeployBody = `
    <section class="doc">
      <header class="doc__head reveal">
        <span class="tag tag--blue">docs · deploy</span>
        <h1>Deploy</h1>
        <p class="doc__lede">Push the bundle. Claim for env. Ship.</p>
      </header>
      ${DOCS_NAV}
      <article class="prose reveal">
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
        <pre><code>export LUMINAWEB_TOKEN=...
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

export const examplesBody = `
    <section class="examples">
      <header class="doc__head reveal">
        <span class="tag tag--green">examples</span>
        <h1>Cookbook</h1>
        <p class="doc__lede">Each example is a complete capsule. Copy, edit, ship.</p>
      </header>
      <div class="examples__grid">
        <a class="ex reveal reveal-d0" href="https://dashboard.luminaweb.app" style="grid-column: 1 / -1; border-color: color-mix(in oklch, var(--accent) 35%, var(--border));">
          <span class="ex__num">★</span>
          <h3>shadcn dashboard (live edge)</h3>
          <p>Full <code>dashboard-01</code> capsule on the Luminaweb edge runtime — not the marketing site. Sidebar, metrics, chart, searchable table.</p>
          <pre><code>luminaweb new my-app --template dashboard && luminaweb deploy</code></pre>
        </a>
        <a class="ex reveal reveal-d1" href="/examples/todo">
          <span class="ex__num">01</span>
          <h3>todo</h3>
          <p>Per-user rows, ownership checks, checkbox mutation, clear-completed. The smallest useful Luminaweb app.</p>
          <pre><code>luminaweb new my-app --template todo</code></pre>
        </a>
        <a class="ex reveal reveal-d2" href="/examples/guestbook">
          <span class="ex__num">02</span>
          <h3>guestbook</h3>
          <p>Shared feed, author metadata from auth, bounded text validation. Demonstrates server-set trusted fields.</p>
          <pre><code>luminaweb new my-app --template guestbook</code></pre>
        </a>
        <a class="ex reveal reveal-d3" href="/examples/chat">
          <span class="ex__num">03</span>
          <h3>chat</h3>
          <p>Realtime-feel message feed with <code>useQuery</code> invalidation. End-to-end typed messages.</p>
          <pre><code>luminaweb new my-app --template chat</code></pre>
        </a>
        <a class="ex reveal reveal-d4" href="/examples/counter">
          <span class="ex__num">04</span>
          <h3>counter</h3>
          <p>One button, one number, one mutation. The whole runtime, in 30 lines.</p>
          <pre><code>luminaweb new my-app --template counter</code></pre>
        </a>
        <a class="ex reveal reveal-d5" href="/examples/webhook">
          <span class="ex__num">05</span>
          <h3>webhook</h3>
          <p>Stripe-shaped webhook receiver with shared-secret verification. Demonstrates <code>endpoint()</code> and <code>ctx.env</code>.</p>
          <pre><code>luminaweb new my-app --template webhook</code></pre>
        </a>
        <a class="ex reveal reveal-d6" href="/examples/blank">
          <span class="ex__num">06</span>
          <h3>blank</h3>
          <p>An empty capsule. The smallest possible surface area.</p>
          <pre><code>luminaweb new my-app --template blank</code></pre>
        </a>
      </div>
    </section>
  `;

export const playgroundBody = `
    <section class="play">
      <header class="doc__head reveal">
        <span class="tag tag--yellow">playground</span>
        <h1>Try Luminaweb in the browser.</h1>
        <p class="doc__lede">A live capsule. The source is the same source. Reload to reset state.</p>
      </header>
      <div class="play__grid reveal reveal-d1">
        <div class="play__frame">
          <div class="play__titlebar">
            <span class="play__dot play__dot--a"></span>
            <span class="play__dot play__dot--b"></span>
            <span class="play__dot play__dot--c"></span>
            <span class="play__url">my-app.luminaweb.app</span>
          </div>
          <div class="play__body" id="play-app">
            <p class="play__loading">loading capsule</p>
          </div>
        </div>
        <div class="play__src">
          <div class="play__tabs">
            <span class="play__tab play__tab--active">server/index.ts</span>
            <span class="play__tab">client/index.tsx</span>
            <span class="play__tab">shared/todo.ts</span>
          </div>
          <pre class="play__code"><code><span class="kw">import</span> { boolean, capsule, mutation, query, string, table } <span class="kw">from</span> <span class="str">"luminaweb-runtime/server"</span>;

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
        </div>
      </div>
    </section>
  `;
