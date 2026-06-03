import { capsule, mutation, number, query, string, table } from "@zapdev/runtime/server";

/**
 * A single global counter. No auth, no per-user filtering.
 * Demonstrates the smallest possible capsule: one table, one query,
 * three mutations.
 */

const COUNTER_ID = "global";

export default capsule({
  schema: {
    counters: table({
      label: string(),
      value: number(),
    }),
  },

  queries: {
    count: query((ctx) => {
      const row = ctx.db.table("counters").get(COUNTER_ID);
      if (row) return { value: row.value, updatedAt: row.updatedAt };
      ctx.db.table("counters").insert({ id: COUNTER_ID, label: "global", value: 0 });
      const fresh = ctx.db.table("counters").get(COUNTER_ID);
      return { value: fresh?.value ?? 0, updatedAt: fresh?.updatedAt ?? new Date().toISOString() };
    }),
  },

  mutations: {
    increment: mutation((ctx, by = 1) => {
      const row =
        ctx.db.table("counters").get(COUNTER_ID) ??
        ctx.db.table("counters").insert({ id: COUNTER_ID, label: "global", value: 0 });
      ctx.db.table("counters").update(row.id, { value: (row.value as number) + by });
    }),
    decrement: mutation((ctx, by = 1) => {
      const row =
        ctx.db.table("counters").get(COUNTER_ID) ??
        ctx.db.table("counters").insert({ id: COUNTER_ID, label: "global", value: 0 });
      ctx.db.table("counters").update(row.id, { value: (row.value as number) - by });
    }),
    reset: mutation((ctx) => {
      const row =
        ctx.db.table("counters").get(COUNTER_ID) ??
        ctx.db.table("counters").insert({ id: COUNTER_ID, label: "global", value: 0 });
      ctx.db.table("counters").update(row.id, { value: 0 });
    }),
  },
});
