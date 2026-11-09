# CLAUDE.md

Guidance for Claude (and any contributor) working on Stramin.

@AGENTS.md

## How we work

- **Short and clear.** Keep answers concise and easy to follow. The owner asks for more detail when needed.
- **Never assume silently.** When something is unclear or a choice has to be made, raise it and discuss it. Explain *why*, not just *what*.
- **Show alternatives.** For every meaningful choice (library, pattern, structure), name the realistic options and recommend one.
- **Modern and conventional.** Use current, up-to-date tools and follow the established conventions of each tool and framework.
- **Clean code and best practices.** Readable, well-structured code over clever shortcuts.
- **Docs before code.** Big decisions are written down in `docs/` before they are implemented.
- **Keep docs in sync.** When a decision is made or changed, update the affected docs in the same step and mention it.
- **Keep the owner on track.** Every update says what was just done, what comes next, and where we are in `docs/PLAN.md`.
- **Ask before running commands.** List the exact commands and run them only after a "yes".
- **Language:** all code and docs are in English. Conversation may be in Danish or English.

## Project docs

| File | Purpose |
|---|---|
| `docs/VISION.md` | What Stramin is, who it is for, scope |
| `docs/REQUIREMENTS.md` | What the first release must do (requirement IDs) |
| `docs/UI_SPEC.md` | Screens and navigation |
| `docs/ARCHITECTURE.md` | Tech stack and system design |
| `docs/decisions/` | Architecture Decision Records (ADRs) |
| `docs/research/` | Research notes (Strava terms, Garmin API) |
| `docs/PLAN.md` | Milestones and tasks |

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server on http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm lint` | Biome check (lint + format) |
| `pnpm format` | Format all files with Biome |
| `pnpm typecheck` | TypeScript type check |
| `pnpm test` | Unit tests (Vitest, once) · `pnpm test:watch` to watch |
| `pnpm test:e2e` | End-to-end tests (Playwright, desktop + iPhone) |

| `pnpm db:start` / `db:stop` | Start/stop local Supabase (Docker Desktop must run). Studio: http://127.0.0.1:55323 |
| `pnpm db:generate` | Generate a SQL migration from the Drizzle schema into `supabase/migrations/` |
| `pnpm db:reset` | Recreate the local database and apply all migrations (deletes local data) |

**Local Supabase** uses ports **553xx** (not the default 543xx), so it can run next to other local Supabase projects. Run Supabase CLI commands from PowerShell. In Git Bash they fail on the temp folder.

**Tests:** unit tests sit next to the code (`foo.ts` → `foo.test.ts`). E2E tests live in `tests/e2e/`.

## Git

- Commits are authored as **Martin Nguyen**, never a uni or work account. Check `git config user.email` before committing.
- Conventional Commits, kept short (e.g. `docs: add plan`).
- One branch + pull request per task. `main` is always deployable.
