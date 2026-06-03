# todo capsule

A per-user todo app built with Zapdev.

## Run

```sh
zapdev dev
```

Open `http://localhost:3000` and try `?zapdev_guest=alice` in another tab.

## What it shows

- `todos` table with `text`, `done`, `ownerId`
- `todos` query filtered by `ctx.auth.userId`
- `addTodo` mutation that cleans input
- `setTodoDone` mutation that re-checks ownership
- `clearDone` mutation that deletes only the current user's completed rows
