# 0004 – Google + email & password login

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
Users need a Stramin account that is separate from Strava/Garmin, because one account can connect to several providers (CON-6).

## Options
- **Google** – fast, familiar, and no password to remember.
- **Email & password** – works for everyone, with no third-party account needed. Requires email verification and password reset.
- **Email magic link** – no password, but slower (open the mail app every time), especially awkward in an installed PWA.
- **Apple** – not wanted now. Note: Apple requires it only if the app is ever published in the App Store with other social logins.
- **Passkeys** – the most modern option, but support in Supabase Auth must be confirmed.

## Decision
**Google** and **email & password** (with email verification and password reset), using Supabase Auth.

## Consequences
- Simple setup for the first release.
- No Apple login. It would only become relevant for a future App Store release.
- Passkeys can be added later without changing the account model.
