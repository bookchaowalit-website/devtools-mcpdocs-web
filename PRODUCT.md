# MCP Docs — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `mcpdocs`, evidence Prototype) on 2026-10-23.

## What it is

A client-side register for writing down MCP tools and schemas, kept in the visitor's browser, plus a stateless
JSON-RPC route with a few authored MCP reference notes.

## Who it is for

A portfolio visitor (or the owner) who wants a quick scratch register for tool names, what they accept and return,
and where each one is in its lifecycle.

## What works today

1. Add a record with a name, details and lifecycle (Draft, Active or Done); a blank name is refused.
2. Search name, details and lifecycle (case-insensitive), filter by lifecycle, delete a record.
3. Records persist in localStorage (`mcpdocs-v2`) in this browser only. One seed record (`search_docs`, Active).
4. `/api/mcp` answers JSON-RPC `initialize`, `tools/list` and `tools/call` with `get_protocol_docs`,
   `get_integration_guide` and `search_docs` over the notes in `lib/reference.ts`. It echoes the request id and returns
   JSON-RPC errors for unknown methods, tools, sections or platforms.
5. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No 100+ tool MCP server, no docs auto-generated from MCP schemas, no MDX, no onboarding-time outcome (claims removed
  from the portfolio card in the 2026-10 review).
- No hosted registry, account, sync, export or sharing; clearing site data loses the records.
- The MCP route cannot read the browser register. Its notes are short summaries, not the specification.
  The old `get_examples` (placeholder one-liners) and `get_servers` (stale `*.vercel.app` links with made-up endpoint
  counts) tools were removed on 2026-10-23.

## Live URL and deploy state

- Live: https://mcpdocs.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-mcpdocs-frontend` is deployed only by CLI. Last production deploy:
  2026-10-23 12:10, CLI, commit db240d8 (the CVE patch). Its Git link names the old repository
  `bookchaowalit/bookchaowalit-mcpdocs-frontend`, so a push to `main` does not deploy: the L2 commits (tests, truthful
  MCP route, Sentry, lint fixes) stay undeployed until the owner reconnects Vercel Git to
  `bookchaowalit-website/devtools-mcpdocs-web` (owner action D9).
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `devtools-mcpdocs-web`, org `personal-yu0`).

## Boundaries

- Browser-only apart from the stateless `/api/mcp` route. No personal data is collected.
