# Stramin – Vision

> **Status:** Draft v0.3 (2026-11-09)
> **Working name:** *Stramin* (Strava + Garmin). The final name is decided later.

## In one sentence

Stramin is a free web app that shows triathletes their own Strava and Garmin training data in a clearer way than those apps do: how much they train, what they spend the time on, where their level is, and how far they are from their next goal.

## The problem

Strava and Garmin Connect collect a lot of data but answer simple questions poorly:

- *How many hours did I train this week, and how were they split between swim, bike, run and strength?*
- *How does this week compare to last week and the weeks before?*
- *What is my typical weekly volume per sport?*
- *What are my best efforts, and what pace should my workouts be at?*
- *How many days until my goal race, and am I on track?*

## Who it is for

- **Primary user:** a triathlete (swim, bike, run) who also does strength training and records everything on Strava and/or Garmin.
- **Also served:** single-sport runners, cyclists and swimmers.
- **First user:** the author.

## Principles

1. **Intuitive at a glance.** Open the app and understand your training immediately. No digging through menus.
2. **Your data stays yours.** Only you see your data. Export or delete it at any time. No ads, no selling, no AI training on user data.
3. **Free and open to everyone.** A hobby project, built out of interest.
4. **Mobile first, web first.** A PWA that installs from the browser on iPhone/Android and also works on desktop.

## User flow

1. Sign up / log in to Stramin.
2. Connect Strava and/or Garmin. This is done once.
3. The full activity history is imported.
4. Land on the **Home** screen.

## First release

| Area | What it does |
|---|---|
| **Accounts & connections** | Stramin account. Connect Strava and/or Garmin. Sync new activities automatically, plus a manual **Refresh** button. |
| **Home: weekly overview** | Training hours this week, split by sport. Compare to last week and earlier weeks. |
| **Home: average volume** | Average weekly volume per sport over a period the user chooses (e.g. 6 months). Distance for swim/bike/run, hours for strength. |
| **Home: event countdowns** | Countdowns to the user's events (e.g. "Ironman in 100 days"), each with an image. |
| **Best efforts** | Personal bests per sport and distance (and bike power), computed from the user's history. Indoor/outdoor can be filtered. |
| **Goals** | Performance targets (e.g. "5 km in 15:00") on their own page, with the gap to the current best and feedback on what to work on. |
| **Training library** | ~10 predefined running workouts. Each shows its structure and **personal target paces** based on the user's best efforts. |
| **Privacy** | Export all your data. Delete your account and all stored data. |

## Future (after the first release)

- Workouts for cycling, swimming and strength.
- App Store version (e.g. Capacitor, possibly with Apple Health).

## Non-goals

- Social features: feeds, kudos, followers, leaderboards, segments.
- Recording activities. Stramin only reads data.
- Route planning and maps.
- Copying Strava's own app. Stramin is an *analysis layer* on top of it.

## Constraints

- **Strava user limit:** 1 user by default, 10 after a self-service upgrade. More requires Strava's review.
- **Strava terms:** data is shown only to its owner and cached for at most 7 days. See [research](research/strava-api-terms.md).
- **Garmin access:** requires an approved application (Starter tier). New activities only, no history.
- **Strava rate limits:** activities are stored in our database and updated when Strava notifies us of new ones, instead of being fetched on every page view.
- **GDPR:** health data is sensitive and must be protected and deletable.
- **Budget:** free tiers only.

## Details

The detailed requirements are in [REQUIREMENTS.md](REQUIREMENTS.md).
