# 0001 – Next.js as framework

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
Stramin is a data-heavy, mobile-first PWA with server-side integrations (OAuth, webhooks, background jobs). We want a modern, well-supported TypeScript framework that handles both UI and server code in one codebase.

## Options
- **Next.js (React)** – the most used React framework. Server Components, Server Actions and route handlers. Best integration with Vercel and a huge ecosystem. Some complexity (caching rules, many features).
- **TanStack Start (React)** – newer and lighter, with type-safe routing. Smaller ecosystem, and fewer examples with Supabase.
- **React Router v7 (formerly Remix)** – mature, web-standards focused. Fewer integrations than Next.js.
- **SvelteKit (Svelte 5)** – very modern, fast and simple. Not React, so a smaller UI/chart ecosystem (no shadcn/ui).
- **Nuxt (Vue)** – solid full-stack framework. Smaller ecosystem than React.
- **Angular** – complete, enterprise-oriented framework. Heavier, and less common for new small web apps.

Note: React itself is a UI library, not a full framework. Next.js, TanStack Start and React Router are frameworks built *on* React.

## Decision
**Next.js** with the App Router, TypeScript in strict mode.

## Consequences
- One codebase for UI, API routes, webhooks and the job runner.
- Access to shadcn/ui, Recharts, next-intl and many examples.
- Must learn and respect the Server/Client Component boundary.
