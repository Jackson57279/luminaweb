import { capsule, query } from "@zapdev/runtime/server";

/**
 * The smallest possible capsule. One query, no schema, no mutations.
 * Replace `hello` with whatever you want to build.
 */

export default capsule({
  queries: {
    hello: query((ctx) => ({
      message: `hello from ${ctx.requestId.slice(0, 8)}`,
      at: new Date().toISOString(),
    })),
  },
});
