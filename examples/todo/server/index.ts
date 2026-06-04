import { boolean, capsule, mutation, query, string, table } from "luminaweb-runtime/server";

/**
 * A per-user todo capsule. Demonstrates:
 *  - server-authoritative filtering by ctx.auth.userId
 *  - ownership re-check inside mutations
 *  - a clean shared helper for input validation
 */

import { cleanTodoText } from "../shared/todo.js";

export default capsule({
  schema: {
    todos: table({
      text: string(),
      done: boolean(),
      ownerId: string(),
    }),
  },

  queries: {
    todos: query((ctx) =>
      ctx.db
        .table("todos")
        .where("ownerId", ctx.auth.userId)
        .orderBy("createdAt", "desc")
        .all(),
    ),
  },

  mutations: {
    addTodo: mutation((ctx, text: string) => {
      const cleaned = cleanTodoText(text);
      if (!cleaned) return;
      ctx.db.table("todos").insert({
        text: cleaned,
        done: false,
        ownerId: ctx.auth.userId,
      });
    }),

    setTodoDone: mutation((ctx, id: string, done: boolean) => {
      const todo = ctx.db.table("todos").get(id);
      if (!todo || todo.ownerId !== ctx.auth.userId) return;
      ctx.db.table("todos").update(id, { done });
    }),

    clearDone: mutation((ctx) => {
      const completed = ctx.db
        .table("todos")
        .where("ownerId", ctx.auth.userId)
        .all()
        .filter((t) => t.done);
      for (const t of completed) {
        ctx.db.table("todos").delete(t.id);
      }
    }),
  },
});
