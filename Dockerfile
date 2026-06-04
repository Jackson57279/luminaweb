# syntax=docker/dockerfile:1.7

# =====================================================================
# Zapdev Edge runtime — Railway Edge deploy image
# ---------------------------------------------------------------------
# Multi-stage build:
#   1. deps     — bun install with the workspace cache
#   2. build    — compile the @zapdev/edge Bun server + a sample capsule
#   3. runtime  — slim prod image that runs the edge server
# =====================================================================

ARG BUN_VERSION=1.3.13

FROM oven/bun:${BUN_VERSION}-alpine AS deps
WORKDIR /repo

COPY package.json bunfig.toml* ./
COPY apps/edge/package.json ./apps/edge/
COPY apps/web/package.json ./apps/web/
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/cli/package.json ./packages/cli/
COPY examples/todo/package.json ./examples/todo/
COPY examples/guestbook/package.json ./examples/guestbook/
COPY examples/chat/package.json ./examples/chat/
COPY examples/counter/package.json ./examples/counter/
COPY examples/webhook/package.json ./examples/webhook/
COPY examples/blank/package.json ./examples/blank/

RUN bun install --frozen-lockfile || bun install

# =====================================================================
FROM deps AS build
WORKDIR /repo

COPY tsconfig.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY examples/ ./examples/

# Compile the edge server to a self-contained JS file at apps/edge/build/.
RUN bun build \
      apps/edge/src/index.ts \
      --target=bun \
      --outdir=apps/edge/build \
      --minify \
      --sourcemap=external \
      --external preact \
      --external preact/hooks \
      --external bun:sqlite \
      --external node:fs \
      --external node:path

# Build the bundled edge app (import.meta.dir relative, runs from /app).
RUN bun build \
      packages/cli/src/index.ts \
      --target=bun \
      --outdir=apps/edge/build/cli \
      --minify \
      --sourcemap=external \
      --external bun:sqlite \
      --external node:fs \
      --external node:path

# Build the default sample capsule (counter) into /repo/dist/ at runtime.
# Bundled directly because the CLI's Bun.build() throws a generic
# "AggregateError: Bundle failed" in the Alpine Bun image (fine locally).
WORKDIR /repo/examples/counter

RUN bun build \
      ./server/index.ts \
      --target=bun \
      --outdir=/repo/dist \
      --minify \
      --sourcemap=external \
      --external preact \
      --external preact/hooks \
      --external bun:sqlite \
      --external node:fs \
      --external node:path && \
    mv /repo/dist/index.js /repo/dist/server.mjs

RUN mkdir -p /repo/dist/client && \
    bun build \
      ./client/index.tsx \
      --target=browser \
      --outdir=/repo/dist/client \
      --minify \
      --sourcemap=external \
      --external preact \
      --external preact/hooks && \
    mv /repo/dist/client/index.js /repo/dist/client/bundle.js

# Client HTML shell — the edge runtime serves this at `/`.
RUN printf '%s\n' \
    '<!doctype html>' \
    '<html lang="en">' \
    '  <head>' \
    '    <meta charset="utf-8" />' \
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />' \
    '    <title>Counter · Zapdev Capsule</title>' \
    '    <link rel="stylesheet" href="/__zap__/client.css" />' \
    '    <style>' \
    '      :root { color-scheme: dark; }' \
    '      html, body { background: #0a0a0a; color: #f5f5f0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; }' \
    '      .__zapdev_loader { position: fixed; inset: 0; display: grid; place-items: center; font-family: ui-monospace, monospace; color: #7a7a75; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; }' \
    '    </style>' \
    '  </head>' \
    '  <body>' \
    '    <div id="app">' \
    '      <div class="__zapdev_loader">zapdev runtime</div>' \
    '    </div>' \
    '    <script type="module" src="/__zap__/client.js"></script>' \
    '  </body>' \
    '</html>' > /repo/dist/client/index.html

# Manifest the edge runtime reads at `/__zap__/manifest`.
RUN printf '%s\n' \
    '{' \
    '  "name": "counter-capsule",' \
    '  "target": "edge",' \
    '  "builtAt": "2026-06-01T00:00:00.000Z",' \
    '  "runtime": "@zapdev/runtime",' \
    '  "version": "0.1.0"' \
    '}' > /repo/dist/manifest.json

# =====================================================================
FROM oven/bun:${BUN_VERSION}-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV ZAPDEV_NAME=counter-capsule
ENV ZAPDEV_VERSION=0.1.0
ENV ZAPDEV_DATA_DIR=/data
ENV ZAPDEV_TRUST_PROXY_HEADERS=1

COPY --from=build /repo/apps/edge/build ./build
COPY --from=build /repo/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/runtime/package.json ./node_modules/@zapdev/runtime/package.json

RUN mkdir -p /data && chown -R bun:bun /data

USER bun
EXPOSE 3000

CMD ["sh", "-c", "if [ -f build/index.js ]; then bun build/index.js; else bun src/index.ts; fi"]

# =====================================================================
# Luminaweb marketing + platform site — Next.js app served under Bun.
FROM build AS web
WORKDIR /repo/apps/web

ENV NODE_ENV=production
ENV PORT=3000
ENV LUMINAWEB_DATA_DIR=/data

# Build the Next.js production bundle. The auth/platform/runtime code uses
# bun:sqlite + Bun.* APIs, so the server is run with `bun --bun next`.
RUN bun --bun next build

RUN mkdir -p /data
EXPOSE 3000
CMD ["bun", "--bun", "next", "start", "--port", "3000"]
