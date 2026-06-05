import { capsule, mutation, query, string, table, type Ctx } from "luminaweb-runtime/server/edge";
import { SEED_DOCUMENTS, type DocumentStatus } from "../shared/documents.js";

type DocumentRow = {
  id: string;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
  createdAt: string;
  updatedAt: string;
};

export default capsule({
  schema: {
    documents: table({
      header: string(),
      type: string(),
      status: string(),
      target: string(),
      limit: string(),
      reviewer: string(),
    }),
  },

  queries: {
    documents: query((ctx) => {
      ensureSeed(ctx);
      return ctx.db.table("documents").orderBy("createdAt", "asc").all() as DocumentRow[];
    }),
    stats: query((ctx) => {
      const docs = ensureSeed(ctx);
      const done = docs.filter((d) => d.status === "Done").length;
      const inProcess = docs.filter((d) => d.status === "In Process").length;
      const completion = Math.round((done / Math.max(docs.length, 1)) * 1000) / 10;
      return {
        total: docs.length,
        done,
        inProcess,
        reviewers: new Set(docs.map((d) => d.reviewer)).size,
        types: new Set(docs.map((d) => d.type)).size,
        completion,
        trend: completion >= 70 ? "up" : "down",
      };
    }),
    visitors: query((ctx, range: "7d" | "30d" | "90d" = "90d") => {
      ensureSeed(ctx);
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const out: { date: string; desktop: number; mobile: number }[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toISOString().slice(0, 10);
        const wave = Math.sin(i / 4) * 40 + Math.cos(i / 7) * 25;
        const desktop = Math.round(120 + wave + (i % 5) * 12);
        const mobile = Math.round(80 + wave * 0.7 + (i % 3) * 18);
        out.push({ date: label, desktop, mobile });
      }
      return out;
    }),
  },

  mutations: {
    setStatus: mutation((ctx, id: string, status: DocumentStatus) => {
      ensureSeed(ctx);
      const row = ctx.db.table("documents").get(id);
      if (!row) return;
      ctx.db.table("documents").update(id, { status });
    }),
  },
});

function ensureSeed(ctx: Ctx): DocumentRow[] {
  const existing = ctx.db.table("documents").all() as DocumentRow[];
  if (existing.length > 0) return existing;
  for (const doc of SEED_DOCUMENTS) {
    ctx.db.table("documents").insert({
      header: doc.header,
      type: doc.type,
      status: doc.status,
      target: doc.target,
      limit: doc.limit,
      reviewer: doc.reviewer,
    });
  }
  return ctx.db.table("documents").orderBy("createdAt", "asc").all() as DocumentRow[];
}
