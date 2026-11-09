# Stramin

**Your training, finally clear.**

Stramin is a free, privacy-first training dashboard for triathletes. Connect your Garmin or Strava account and see your swim, bike, run and strength training the way it should be shown: how much you train, what the time goes to, where your level is right now, and how many days are left until race day.

> 🚧 **Status: in design.** Stramin is being planned and built in the open. See the [docs](docs/) for the full vision, requirements and architecture.

---

## Why Stramin?

Garmin Connect and Strava record everything, but answering simple questions still takes too many taps:

- *How many hours did I train this week, and how was it split across sports?*
- *How does this week compare to the last ones?*
- *What does my typical training week look like over the last months, or all time?*
- *What are my best efforts, and what pace should my intervals be at?*
- *How many days until my Ironman?*

Stramin answers them on one screen.

## Features (planned)

- 📊 **Weekly overview:** training hours split by swim, bike, run and strength, compared week by week.
- 📈 **Average volume:** your typical week per sport over any period, from 4 weeks to all time.
- 🏆 **Best efforts:** fastest 5 km, 10 km, half and full marathon. Bike records by distance and power. Swim records. Indoor and outdoor, together or separately.
- 🎯 **Goals:** set a target like *"5 km in 15:00"* and see how far you are and what to work on.
- ⏳ **Event countdowns:** your next race, always one glance away.
- 🏃 **Training library:** structured running workouts with target paces calculated from your own performances.
- 📅 **Activity log:** every session, grouped by week.
- 🌍 **English and Danish**, metric or imperial.
- 📱 **Installable on your phone:** a Progressive Web App, no app store required.

## Privacy first

Your health data belongs to you.

- Only **you** can see your data. There are no feeds, leaderboards or public profiles.
- No ads, no data selling, and no AI training on your data.
- Export or permanently delete everything at any time.
- Data is protected with row-level security, and access tokens are encrypted.

Read the full [Privacy Policy](PRIVACY.md).

## Data sources

| Source | How |
|---|---|
| **Garmin Connect** | Garmin Connect Developer Program (Activity API) |
| **Strava** | Strava API (OAuth). Compatible with Strava. |

Stramin follows each provider's API terms and brand guidelines.

## Tech stack

| | |
|---|---|
| **App** | [Next.js](https://nextjs.org) + TypeScript, installable as a PWA |
| **UI** | Tailwind CSS · shadcn/ui · Recharts |
| **Backend** | [Supabase](https://supabase.com) (Postgres, Auth, Storage, Queues) · Drizzle ORM |
| **Hosting** | Vercel (EU data region on Supabase) |

Every technical choice is documented as an [Architecture Decision Record](docs/decisions/).

## Documentation

| Document | What it covers |
|---|---|
| [Vision](docs/VISION.md) | What Stramin is, who it is for and why |
| [Requirements](docs/REQUIREMENTS.md) | What the first release must do |
| [UI spec](docs/UI_SPEC.md) | Screens and navigation |
| [Architecture](docs/ARCHITECTURE.md) | System design, data model and security |
| [Decisions](docs/decisions/) | The reasoning behind each technical choice |
| [Plan](docs/PLAN.md) | Milestones and tasks |

## Roadmap

1. ✅ Vision, requirements and architecture
2. ⬜ Project setup, landing page and privacy policy
3. ⬜ Accounts and Strava connection
4. ⬜ Activity sync and activity log
5. ⬜ Home: weekly overview and averages
6. ⬜ Best efforts and records
7. ⬜ Events, goals and feedback
8. ⬜ Training library with personal paces
9. ⬜ Garmin connection
10. ⬜ Privacy tools, PWA install and public release

See the full [plan](docs/PLAN.md).

## About

Stramin is a personal, non-commercial project built by a software engineer and triathlete, out of a love for training and good data.

*Stramin is an independent project and is not affiliated with, endorsed by or sponsored by Garmin or Strava.*
