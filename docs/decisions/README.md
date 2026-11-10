# Architecture Decision Records (ADRs)

An ADR is a short note that records **one** important decision: the context, the options considered, what was chosen and why.
ADRs are never rewritten. If a decision changes, write a new ADR that *supersedes* the old one and update the old one's status.

| # | Decision | Status |
|---|---|---|
| [0001](0001-framework-nextjs.md) | Next.js as framework | Accepted |
| [0002](0002-backend-supabase.md) | Supabase as backend platform | Accepted |
| [0003](0003-orm-drizzle.md) | Drizzle ORM for database access | Accepted |
| [0004](0004-authentication.md) | Google + email & password login | Accepted |
| [0005](0005-background-sync.md) | Supabase Queues + Cron for background sync | Accepted |
| [0006](0006-ui-stack.md) | Tailwind, shadcn/ui and Recharts for UI | Accepted |
| [0007](0007-tooling.md) | Tooling: pnpm, Biome, Vitest, Playwright, next-intl, Serwist | Accepted |
| [0008](0008-stream-storage.md) | Activity streams as compressed files in object storage | Accepted |
| [0009](0009-strava-rolling-cache.md) | Strava data as a rolling 7-day cache | Accepted |
| [0010](0010-pace-model-vdot.md) | VDOT as the running pace model | Accepted (to review) |
| [0011](0011-best-efforts-v1.md) | Best efforts v1: estimated from activity summaries, plus manual values | Accepted (to review) |

## Template

```markdown
# NNNN – Title

- **Status:** Proposed | Accepted | Superseded by NNNN
- **Date:** YYYY-MM-DD

## Context
What problem or need forces a decision?

## Options
- **A** – pros / cons
- **B** – pros / cons

## Decision
What we chose.

## Consequences
What becomes easier, what becomes harder.
```
