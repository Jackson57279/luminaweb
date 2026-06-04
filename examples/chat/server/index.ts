import { capsule, mutation, query, string, table } from "luminaweb-runtime/server";

/**
 * A shared chat room. Demonstrates:
 *  - shared reads (no per-user filter) ordered by recency
 *  - server-set author fields (not accepted from the client)
 *  - bounded input validation in a shared helper
 */

import { cleanMessage } from "../shared/chat.js";

export default capsule({
  schema: {
    messages: table({
      body: string(),
      authorId: string(),
      authorName: string(),
      authorPicture: string(),
    }),
  },

  queries: {
    messages: query((ctx) =>
      ctx.db
        .table("messages")
        .orderBy("createdAt", "desc")
        .limit(100)
        .all()
        .reverse(),
    ),
  },

  mutations: {
    send: mutation((ctx, raw: string) => {
      const body = cleanMessage(raw);
      if (!body) return;
      ctx.db.table("messages").insert({
        body,
        authorId: ctx.auth.userId,
        authorName: ctx.auth.displayName,
        authorPicture: ctx.auth.picture ?? "",
      });
    }),
    deleteOwn: mutation((ctx, id: string) => {
      const row = ctx.db.table("messages").get(id);
      if (!row) return;
      if (row.authorId !== ctx.auth.userId) return;
      ctx.db.table("messages").delete(id);
    }),
  },
});
