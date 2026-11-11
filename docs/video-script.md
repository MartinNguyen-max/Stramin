# Landing page video (L2)

A ~30-second tour of the app for the landing page, under the hero.

- **Silent recording:** `public/video/stramin.webm` (1280 × 720, 32 s), made automatically from the demo by Playwright. The landing page plays it until a voiced version exists.
- **Voiced version:** `public/video/stramin.mp4`. When this file exists, the landing page plays it instead (the browser tries the MP4 first).
- **Poster:** `public/video/stramin-poster.png` (the first screen, shown before playing).

## Voice-over (Danish, about 75 words)

| Time | On screen | Voice |
|---|---|---|
| 0–6 s | Home: countdowns, your average week, this week | "Det her er Stramin. Forbind Strava, og se al din træning samlet: din gennemsnitlige uge, og hvor langt du er med denne uge." |
| 6–11 s | The calendar, then 6 months as month cards | "Kalenderen viser hver træning og ugens total, og månedskort når du kigger længere tilbage." |
| 11–18 s | Goals with short tips | "Sæt et mål for en distance eller en Ironman, og få korte tips ud fra din egen træning." |
| 18–24 s | The pace calculator | "Prøv et tempo i tempoberegneren, og se med det samme, hvordan det står mod din bedste tid." |
| 24–32 s | Profile: predicted times and your progress | "Og på din profil kan du se dine forventede tider, og hvor meget du har udviklet dig. Gratis, og kun for dig." |

*English version:* "This is Stramin. Connect Strava and see all your training in one place: your average week, and how far you are this week. / The calendar shows every workout and the week's total, and month cards when you look further back. / Set a goal for a distance or an Ironman, and get short tips from your own training. / Try a pace in the calculator and see right away how it compares with your best. / And your profile shows your predicted times and how much you've improved. Free, and only for you."

## Adding the voice (owner, about 15 minutes)

1. Open **Clipchamp** (built into Windows 11) → *Create a new video* → drag in `public/video/stramin.webm`.
2. Voice: *Record & create* → **Text to speech**. Pick a Danish voice (e.g. *Christel* or *Jeppe*), paste each line above, and place it at its time. Or record your own voice with *Record & create → Audio*.
3. Optional: add quiet background music from Clipchamp's library (volume about 10 %).
4. **Export** in 1080p → save as `public/video/stramin.mp4` (replace nothing; the webm stays as a fallback).
5. Commit and push. The landing page plays the voiced MP4 from then on.

## Recording it again

When the app changes, the recording can be made again from the demo: build, start on port 3009, then run the Playwright script (`node node_modules/.shot/video.mjs`, kept outside git; ask Claude to recreate it). It clicks Home → 6M → Mål → Tempoberegner → Profil with the same timings as the voice-over above.
