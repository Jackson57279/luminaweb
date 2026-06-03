# webhook capsule

A public HTTP endpoint that records every POST it receives, plus a UI
to inspect the latest hits. Demonstrates `endpoint()` for arbitrary
HTTP routes and a shared-secret gate enforced on the server.

## Run

```sh
zapdev dev
```

The UI lives at `http://localhost:3000`. The endpoint lives at
`http://localhost:3000/hooks/inbound`.

Send a test hit:

```sh
curl -X POST http://localhost:3000/hooks/inbound \
  -H "content-type: application/json" \
  -H "x-webhook-secret: $ZAPDEV_WEBHOOK_SECRET" \
  -d '{"event":"ping","value":42}'
```

A 401 means your secret didn't match.

## What it shows

- `endpoint({ method, path }, handler)` for any HTTP route
- server-side secret check via `ctx.env.ZAPDEV_WEBHOOK_SECRET`
- `hits` table with `source`, `body` (json), `receivedAt`
- `hits` query that lists the most recent deliveries
- `json()` and `text()` response helpers from the runtime
