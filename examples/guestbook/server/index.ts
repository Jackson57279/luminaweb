import { capsule, mutation, query, string, table } from "luminaweb-runtime/server";

/**
 * A shared guestbook feed where every signed entry stores author
 * metadata from auth. Demonstrates:
 *  - shared reads (no per-user filter)
 *  - server-set author fields (not accepted from the client)
 *  - bounded text validation
 */

import { cleanEntry } from "../shared/guestbook.js";

export default capsule({
  schema: {
    entries: table({
      body: string(),
      authorId: string(),
      authorName: string(),
      authorPicture: string(),
    }),
  },

  queries: {
    entries: query((ctx) =>
      ctx.db.table("entries").orderBy("createdAt", "desc").limit(50).all(),
    ),
  },

  mutations: {
    sign: mutation((ctx, raw: string) => {
      const body = cleanEntry(raw);
      if (!body) return;
      ctx.db.table("entries").insert({
        body,
        authorId: ctx.auth.userId,
        authorName: ctx.auth.displayName,
        authorPicture: ctx.auth.picture ?? "",
      });
    }),
  },
});
