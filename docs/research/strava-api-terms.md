# Research – Strava API terms

> **Date:** 2026-11-09
> **Sources:** [API Agreement](https://www.strava.com/legal/api) and [API Policy](https://www.strava.com/legal/api_policy) (both effective 2026-06-01), [Brand Guidelines](https://developers.strava.com/guidelines/) (rev. 2025-09-29), [Getting started](https://developers.strava.com/docs/getting-started/), [Rate limits](https://developers.strava.com/docs/rate-limits/), [Webhooks](https://developers.strava.com/docs/webhooks/).
> This is our reading of the terms, not legal advice. Strava decides compliance "in its sole discretion".

## Summary

Strava's current terms **conflict with Stramin's core design**: storing a user's full history and computing analytics on it.

## Findings

### Blockers 🔴
| Rule | Source | Impact on Stramin |
|---|---|---|
| Strava data may not be cached for **more than 7 days**, and there may be no persistent index. | Policy 5.5, 6.2 | We cannot keep a user's activity history in our database. |
| No processing of Strava data "for the purposes of **analytics, analyses**, customer insight generation…", including output generated using Strava data. | Policy 5.4 | Read literally, this covers weekly stats, best efforts and paces. It may be aimed at developer-side analytics, but that is unclear. |
| No use that is "**competitive** to Strava". | Policy 5.2 | Training insights overlap with Strava's subscription features. |
| No storing of **location data**. | Policy 5.7 | We must not store GPS streams (we don't need them anyway). |

### Limits 🟡
| Rule | Source |
|---|---|
| Creating an API app requires a **Strava subscription** (the developer's). | Getting started |
| A new app = 1 athlete. A self-service upgrade raises it to **10**. Beyond 10 needs a review, and access is "not a guarantee". | Getting started, Rate limits |
| Standard-tier apps may require the developer or end users to have a Strava subscription. | Policy 3.3 |
| Rate limits (default): 200 req / 15 min, 2,000 / day overall. Reads: 100 / 15 min, 1,000 / day. Doubled after the upgrade to 10 athletes. | Rate limits |
| No AI/ML use of Strava data, including feeding it into an LLM context. | Policy 5.3 |

### Fine ✅
| Rule | Source |
|---|---|
| Data may be shown only to its owner. This matches our design. | Policy 2.3 |
| Free apps are fine. A paid tier may not duplicate Strava features. | Policy 5.8 |
| "Strava" must not be in the app name. "Stramin" is probably fine, but has to be checked. | Brand Guidelines 4 |
| Deleted activities must be removed within 48 h. Data must be deleted within 30 days after the user disconnects. | Policy 6.3, 7.4 |
| Webhooks: create/update/delete and deauthorization events. Strava requires an answer within 2 s. | Webhooks |

## Not verified

- Whether the detailed activity includes `best_efforts`, and the exact list of stream keys (the API reference was only partly read).
- How strictly Strava interprets Policy 5.4 for single-user, owner-only analytics. **Only Strava can answer this.**
