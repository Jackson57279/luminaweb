# chat capsule

A shared room where every signed-in visitor posts messages. New messages
appear automatically because the client invalidates matching queries on
every mutation.

## Run

```sh
zapdev dev
```

Open `http://localhost:3000` in two browsers (or two `?zapdev_guest=`
tabs) and watch the room fill up live.

## What it shows

- `messages` table with `body`, `authorId`, `authorName`, `authorPicture`
- `messages` query with `orderBy("createdAt", "desc").limit(100)`
- `send` mutation that uses `ctx.auth.*` for author metadata
- client-side auto-invalidation across tabs via the runtime's query cache
