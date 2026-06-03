# counter capsule

The smallest possible Zapdev app. One table, one query, two mutations.

## Run

```sh
zapdev dev
```

## What it shows

- `count` table with a single `value` number
- `count` query that returns `{ value }` for the current row
- `increment` and `decrement` mutations
- the absolute minimum server + client contract
