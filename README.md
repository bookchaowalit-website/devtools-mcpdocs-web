# MCP Docs (Schema / Log)

A small browser-local register for MCP tools and schemas: add a record (name, details, lifecycle Draft / Active /
Done), search it, filter by lifecycle and delete records. Records stay in this browser (localStorage); there is one
seed record. A stateless `/api/mcp` route serves a few short, authored MCP reference notes.

Live: https://mcpdocs.bookchaowalit.com (deployed by Vercel CLI; it can lag `main`, see `PRODUCT.md`).

## What it does not do

- No hosted registry, account, sync or sharing. Nothing leaves the browser.
- No docs generated from MCP schemas, no MDX, no 100+ tool server.
- The `/api/mcp` notes are one-line summaries, not the official MCP specification, and the route cannot see the
  records a visitor keeps in their browser.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: register logic, local store, MCP route, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (lint, typecheck, tests with a line-coverage gate,
build) and the shared security scan on every push and PR to `main`.

## Code map

- `lib/mcpdocs.ts`: lifecycles, seed record, filter/search, add/remove, and localStorage parse/serialize.
- `lib/local-store.ts`: a small `useSyncExternalStore` store over localStorage (server and hydration see the seed,
  storage failures fall back to memory).
- `lib/reference.ts` + `app/api/mcp/route.ts`: JSON-RPC endpoint with `get_protocol_docs`, `get_integration_guide`
  and `search_docs` over the authored notes; unknown tools, sections and methods return JSON-RPC errors.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
- `app/more-projects/page.tsx`: shared portfolio link page (copied per repository, not a package).
