import {
  capsule,
  endpoint,
  jsonResponse,
  query,
  string,
  table,
  textResponse,
  unauthorized,
} from "luminaweb-runtime/server";
import { json as jsonField } from "luminaweb-runtime/shared";

/**
 * A public webhook receiver. Demonstrates:
 *  - endpoint() to attach an arbitrary HTTP route to a capsule
 *  - server-side secret check on headers
 *  - the jsonResponse() and textResponse() helpers
 *  - storing the raw payload as a jsonField() field for later inspection
 */

import { isAuthorized } from "../shared/webhook.js";

export default capsule({
  schema: {
    hits: table({
      source: string(),
      body: jsonField<unknown>(),
    }),
  },

  queries: {
    hits: query((ctx) =>
      ctx.db.table("hits").orderBy("receivedAt", "desc").limit(50).all(),
    ),
  },

  endpoints: {
    inbound: endpoint(
      { method: "POST", path: "/hooks/inbound" },
      async (ctx, req) => {
        const expected = ctx.env.ZAPDEV_WEBHOOK_SECRET;
        if (!isAuthorized(req.headers, expected)) {
          return unauthorized("invalid or missing x-webhook-secret");
        }
        let payload: unknown;
        try {
          payload = await req.json();
        } catch {
          return textResponse("invalid json", { status: 400 });
        }
        const source = req.headers.get("user-agent") ?? "anonymous";
        const receivedAt = new Date().toISOString();
        const row = ctx.db.table("hits").insert({
          source,
          body: payload,
          receivedAt,
        });
        return jsonResponse({ ok: true, id: row.id, receivedAt });
      },
    ),
  },
});
