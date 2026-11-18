# Stramin

**Your training, finally clear.**

A free, privacy-first training dashboard for triathletes. See your swim, bike, run and strength training on one screen: weekly totals, averages and days until race day.

<img width="713" height="543" alt="image" src="https://github.com/user-attachments/assets/c60ffafa-26f3-4a49-b82b-082e6d46a8fd" />


**🔗 [stramin.vercel.app](https://stramin.vercel.app)**

---

## Tech

- **App:** Next.js (App Router) and TypeScript, installable as a PWA, hosted on Vercel
- **Data:** Supabase Postgres with row-level security, Drizzle ORM and Supabase Auth
- **Integrations:** Strava (OAuth and webhooks, encrypted tokens) and Garmin Connect (in progress). Requires a Strava API app and Garmin Developer Program access.
- **Quality:** Biome, Vitest, Playwright

Design decisions are recorded in [docs/decisions/](docs/decisions/).

---

*Stramin is an independent project and is not affiliated with Strava or Garmin.*
