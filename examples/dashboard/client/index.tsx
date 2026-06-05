import { render } from "luminaweb-runtime/client";
import { useMutation, useQuery, useState } from "luminaweb-runtime/client";

type DocumentRow = {
  id: string;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

type Stats = {
  total: number;
  done: number;
  inProcess: number;
  reviewers: number;
  types: number;
  completion: number;
  trend: "up" | "down";
};

type VisitorPoint = { date: string; desktop: number; mobile: number };

type Range = "7d" | "30d" | "90d";

const NAV = [
  { label: "Dashboard", icon: "grid" },
  { label: "Documents", icon: "file" },
  { label: "Analytics", icon: "chart" },
  { label: "Team", icon: "users" },
  { label: "Settings", icon: "gear" },
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
    file: "M6 2h7l5 5v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm7 1.5V8h4.5",
    chart: "M4 19V9m6 10V5m6 14v-8m6 8V11",
    users: "M16 11a4 4 0 10-8 0m12 8a6 6 0 00-12 0",
    gear: "M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm8.5-3.5l2 1.2-1.2 2.1-2.3-.4-.9 2.1-2.3-1.3.9-2.1-2.3-.4 1.2-2.1 2.3.4.9-2.1 2.3 1.3-.9 2.1 2.3.4-1.2 2.1-2-.4z",
    menu: "M4 7h16M4 12h16M4 17h16",
    trendUp: "M4 14l5-5 4 4 7-9",
    trendDown: "M4 10l5 5 4-4 7 9",
    search: "M11 17a6 6 0 100-12 6 6 0 000 12zm8 3l-4-4",
  };
  return (
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d={paths[name] ?? paths.grid} stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

function Badge({ status }: { status: string }) {
  const done = status === "Done";
  return <span class={`badge ${done ? "badge-done" : "badge-progress"}`}>{status}</span>;
}

function Skeleton({ class: className = "" }: { class?: string }) {
  return <span class={`skeleton ${className}`} aria-hidden="true" />;
}

function AreaChart({ points, range }: { points: VisitorPoint[]; range: Range }) {
  if (!points.length) return <div class="chart-empty">Loading chart…</div>;
  const w = 640;
  const h = 200;
  const pad = { t: 12, r: 12, b: 28, l: 12 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(...points.flatMap((p) => [p.desktop, p.mobile]), 1);
  const step = innerW / Math.max(points.length - 1, 1);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const x = (i: number) => pad.l + i * step;
  const line = (key: "desktop" | "mobile") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const area = (key: "desktop" | "mobile") => {
    const top = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
    const base = `L${x(points.length - 1).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${x(0).toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;
    return `${top} ${base}`;
  };
  const labels =
    range === "7d"
      ? points.map((p) => p.date.slice(5))
      : points.filter((_, i) => i % Math.ceil(points.length / 8) === 0).map((p) => p.date.slice(5));

  return (
    <div class="chart-svg-wrap">
      <svg class="chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="fill-desktop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--chart-1)" stop-opacity="0.35" />
            <stop offset="100%" stop-color="var(--chart-1)" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="fill-mobile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--chart-2)" stop-opacity="0.3" />
            <stop offset="100%" stop-color="var(--chart-2)" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area("desktop")} fill="url(#fill-desktop)" />
        <path d={area("mobile")} fill="url(#fill-mobile)" />
        <path d={line("desktop")} fill="none" stroke="var(--chart-1)" stroke-width="2" />
        <path d={line("mobile")} fill="none" stroke="var(--chart-2)" stroke-width="2" stroke-dasharray="4 3" />
      </svg>
      <div class="chart-legend">
        <span><i class="dot dot-a" /> Desktop</span>
        <span><i class="dot dot-b" /> Mobile</span>
      </div>
      <div class="chart-labels">
        {labels.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [range, setRange] = useState<Range>("90d");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Done" | "In Process">("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const documents = useQuery<DocumentRow[]>("documents");
  const stats = useQuery<Stats>("stats");
  const visitors = useQuery<VisitorPoint[]>("visitors", [range]);
  const setStatus = useMutation<[id: string, status: "Done" | "In Process"], void>("setStatus");

  const loading = !documents || !stats;
  const filtered = (documents ?? []).filter((row) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      row.header.toLowerCase().includes(q) ||
      row.type.toLowerCase().includes(q) ||
      row.reviewer.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div class="shell">
      <div class={`sidebar-backdrop ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside class={`sidebar ${menuOpen ? "open" : ""}`}>
        <div class="brand">
          <span class="brand-mark">LW</span>
          <div>
            <span class="brand-title">Acme Inc</span>
            <span class="brand-sub">Enterprise</span>
          </div>
        </div>
        <nav class="nav">
          {NAV.map((item, i) => (
            <a key={item.label} href="#" class={i === 0 ? "active" : ""}>
              <Icon name={item.icon} />
              {item.label}
            </a>
          ))}
        </nav>
        <p class="footer-note">
          shadcn <code>dashboard-01</code>
          <br />
          deployed on <a href="https://www.luminaweb.app" target="_blank" rel="noreferrer">Luminaweb</a>
        </p>
      </aside>

      <div class="main">
        <header class="header">
          <button type="button" class="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
          <div>
            <h1>Documents</h1>
            <p class="header-meta">Proposal outline · live queries &amp; mutations</p>
          </div>
          <div class="header-actions">
            <a class="ghost-link" href="https://ui.shadcn.com/blocks/dashboard-01" target="_blank" rel="noreferrer">
              shadcn source
            </a>
            <a class="ghost-link primary" href="https://www.luminaweb.app/docs/quickstart" target="_blank" rel="noreferrer">
              Build yours
            </a>
          </div>
        </header>

        <div class="content">
          <section class="cards">
            <article class="card">
              <div class="card-top">
                <p class="card-label">Total sections</p>
                {stats ? (
                  <span class={`trend ${stats.trend}`}>
                    <Icon name={stats.trend === "up" ? "trendUp" : "trendDown"} />
                    {stats.completion}%
                  </span>
                ) : null}
              </div>
              <p class="card-value">{loading ? <Skeleton class="sk-value" /> : stats?.total}</p>
              <p class="card-foot">{stats ? `${stats.types} document types` : "—"}</p>
            </article>
            <article class="card">
              <div class="card-top">
                <p class="card-label">Completed</p>
              </div>
              <p class="card-value">{loading ? <Skeleton class="sk-value" /> : stats?.done}</p>
              <p class="card-foot">{stats ? `${stats.completion}% of pipeline` : "—"}</p>
            </article>
            <article class="card">
              <div class="card-top">
                <p class="card-label">In process</p>
              </div>
              <p class="card-value">{loading ? <Skeleton class="sk-value" /> : stats?.inProcess}</p>
              <p class="card-foot">Click status badges to toggle</p>
            </article>
            <article class="card">
              <div class="card-top">
                <p class="card-label">Reviewers</p>
              </div>
              <p class="card-value">{loading ? <Skeleton class="sk-value" /> : stats?.reviewers}</p>
              <p class="card-foot">Assigned across sections</p>
            </article>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Total visitors</h2>
                <p>Area chart · desktop vs mobile</p>
              </div>
              <div class="toggle-group" role="group" aria-label="Time range">
                {(["7d", "30d", "90d"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    class={range === r ? "active" : ""}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div class="chart">
              <AreaChart points={visitors ?? []} range={range} />
            </div>
          </section>

          <section class="panel">
            <div class="panel-head stack">
              <div>
                <h2>Outline</h2>
                <p>{filtered.length} of {(documents ?? []).length} sections</p>
              </div>
              <div class="table-tools">
                <label class="search">
                  <Icon name="search" />
                  <input
                    type="search"
                    placeholder="Filter sections…"
                    value={query}
                    onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                  />
                </label>
                <div class="toggle-group compact" role="group" aria-label="Status filter">
                  {(["all", "Done", "In Process"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      class={statusFilter === s ? "active" : ""}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Header</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Target</th>
                    <th>Limit</th>
                    <th>Reviewer</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} class="row-skeleton">
                          <td><Skeleton /></td>
                          <td><Skeleton /></td>
                          <td><Skeleton class="sk-badge" /></td>
                          <td><Skeleton /></td>
                          <td><Skeleton /></td>
                          <td><Skeleton /></td>
                        </tr>
                      ))
                    : filtered.map((row) => (
                        <tr key={row.id}>
                          <td>{row.header}</td>
                          <td><span class="type-pill">{row.type}</span></td>
                          <td>
                            <button
                              type="button"
                              class="status-btn"
                              onClick={() =>
                                void setStatus(row.id, row.status === "Done" ? "In Process" : "Done")
                              }
                            >
                              <Badge status={row.status} />
                            </button>
                          </td>
                          <td class="tabular">{row.target}</td>
                          <td class="tabular">{row.limit}</td>
                          <td>{row.reviewer}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
