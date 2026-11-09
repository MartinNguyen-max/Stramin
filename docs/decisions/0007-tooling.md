# 0007 – Tooling

- **Status:** Accepted
- **Date:** 2026-11-09

## Decision

| Need | Choice | Alternatives considered | Why |
|---|---|---|---|
| Package manager | **pnpm** | npm, Bun | Fast, disk-efficient, strict dependency handling. Bun is faster but less proven with Next.js tooling. |
| Lint + format | **Biome** | ESLint + Prettier | One fast tool instead of two, with almost no config. ESLint has more plugins, but we don't need them. |
| Unit tests | **Vitest** | Jest | Faster, native TypeScript/ESM support, Jest-compatible API. |
| End-to-end tests | **Playwright** | Cypress | Multiple browsers incl. WebKit (Safari/iPhone), faster, the current standard. |
| Translations | **next-intl** | i18next, Lingui | Built for the Next.js App Router and Server Components. |
| PWA / service worker | **Serwist** | next-pwa (unmaintained), hand-written SW | Maintained successor of next-pwa, made for the App Router. |

## Consequences
- A small, modern toolchain with few config files.
- Biome must be set up in the editor (VS Code extension) for format-on-save.
