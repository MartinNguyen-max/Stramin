# 0003 – Drizzle ORM for database access

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
We want type-safe database access, a schema defined in code, versioned migrations, and RLS still enforced for user requests.

## Options
- **Drizzle ORM** – TypeScript-first, SQL-like API, lightweight, works on serverless, built-in support for RLS policies and Supabase.
- **Prisma** – popular and mature, but heavier, with its own schema language and weaker RLS support.
- **Supabase client (supabase-js) + SQL migrations** – RLS works automatically, but the query builder is less expressive for complex aggregations, and types are generated rather than defined.

## Decision
**Drizzle ORM** for the schema, migrations (drizzle-kit) and queries.
User-facing queries run inside a transaction with the user's JWT claims and the `authenticated` role, so **RLS is enforced**. A privileged connection is used only for the job runner and webhooks.

## Consequences
- One source of truth for the schema, in TypeScript.
- Complex SQL (window functions, weekly aggregation) is easy to write.
- We must always use the RLS-aware client for user requests. A small wrapper in `src/lib/db/` makes this the default.
