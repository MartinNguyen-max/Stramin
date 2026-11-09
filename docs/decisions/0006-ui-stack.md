# 0006 – Tailwind, shadcn/ui and Recharts for UI

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
We need a fast, consistent and accessible UI with good charts, which work in both dark and light mode.

## Options
- **Styling:** Tailwind CSS (utility-first, the current standard) · CSS Modules · CSS-in-JS (declining with Server Components).
- **Components:** shadcn/ui (accessible components copied into our code, built on Radix, fully customizable) · Mantine / MUI (full libraries, harder to make look unique).
- **Charts:** Recharts (simple, React-native, used by shadcn charts) · visx (low-level, maximum control) · ECharts (powerful, heavier) · Observable Plot (great for exploration, less interactive).

## Decision
**Tailwind CSS** + **shadcn/ui** + **Recharts** (via shadcn's chart components).

## Consequences
- We own the component code, so the look can be fully custom.
- Charts share colors and theme with the rest of the UI.
- If we need very custom visualizations later, visx can be added for those specific charts.
