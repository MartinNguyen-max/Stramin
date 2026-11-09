# 0006 – Tailwind, shadcn/ui and Recharts for UI

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
We need a fast, consistent and accessible UI with good charts, which work in both dark and light mode.

## Options
- **Styling:** Tailwind CSS (utility-first, the current standard) · CSS Modules · CSS-in-JS (declining with Server Components).
- **Components:** shadcn/ui (accessible components copied into our code, fully customizable) · Mantine / MUI (full libraries, harder to make look unique).
- **shadcn base:** Radix UI (mature, development has slowed) · **Base UI** (newer, actively developed, by the creators of Radix and Material UI).
- **Charts:** Recharts (simple, React-native, used by shadcn charts) · visx (low-level, maximum control) · ECharts (powerful, heavier) · Observable Plot (great for exploration, less interactive).

## Decision
**Tailwind CSS** + **shadcn/ui** (style "Nova", on **Base UI**) + **Recharts** (via shadcn's chart components).
Light/dark mode with **next-themes**, following the system setting by default.

## Consequences
- We own the component code, so the look can be fully custom.
- Charts share colors and theme with the rest of the UI.
- If we need very custom visualizations later, visx can be added for those specific charts.
