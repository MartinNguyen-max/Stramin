# Research – Garmin Connect Developer Program

> **Date:** 2026-11-09
> **Source:** [Program overview](https://developer.garmin.com/gc-developer-program/overview/). The FAQ, API and tier detail pages could not be read (404 or JavaScript-only), so the details below are incomplete.

## Tiers

| Tier | For | Delivery | History | Fit for Stramin |
|---|---|---|---|---|
| **Personal** | An individual reading **their own** data with a personal API key | Pull | ? | ✅ For the author's own use and development |
| **Starter** (Business) | "Individual developers and startups" building multi-user apps. You apply via [a form](https://www.garmin.com/en-US/forms/StarterGarminConnectDeveloperAccess/). | Push only | **Not included** | ✅ For other users, but only activities recorded after connecting |
| **Enterprise** | Companies at scale | Push or pull | 1 month+ | ❌ Not relevant |

Starter includes the **Activity API** (JSON and `.FIT` files) and the **Health API**.

## Status (2026-11-09)

✅ **Accepted into the program, Starter tier.** Confirmed in the developer portal:
- Activity API (JSON and `.FIT`), Health, Women's Health, Training and Courses APIs
- **Push only**, **no historical data**, **up to 1,000 connected users**
- Still to verify in the API license agreement: the rules on **storing data** and **attribution** ("Works with Garmin"). Strava's policy also says apps showing Garmin-sourced data must credit Garmin.

## Key points

- **Individuals can now apply.** The program is no longer for businesses only.
- **No history on Starter.** Past activities would have to come from a **file import** (Garmin's data export / `.FIT` files).
- **Unknown:** cost, approval time, and the rules on data storage and analytics. These must be read in the terms we get when applying and in Garmin's [Terms of Use](https://www.garmin.com/en-US/legal/terms-of-use/).
