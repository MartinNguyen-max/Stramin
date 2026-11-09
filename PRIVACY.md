# Stramin Privacy Policy

**Last updated:** November 9, 2026

Stramin is a free, non-commercial training dashboard. This policy explains what data Stramin collects, why, and what rights you have. Stramin is currently in development. This policy describes how data is and will be handled.

## Who is responsible

Stramin is a personal project run by **Martin Nguyen**, Denmark, who is the data controller under the GDPR.
Contact: **martintn09@gmail.com**

## What data we collect

| Data                | Example                                                            | Why                                                |
| ------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| **Account data**    | Email address, name (if you sign in with Google)                   | To create and secure your account                  |
| **Connection data** | Access tokens for Garmin and/or Strava                             | To fetch your activities on your behalf            |
| **Activity data**   | Sport type, date, duration, distance, heart rate, power, elevation | To show your statistics, best efforts and progress |
| **Content you add** | Goals, events, event images, settings                              | To provide those features                          |

We do **not** store GPS location or route data. We never ask for or store your Garmin or Strava password.

## How we use your data

Your data is used **only** to show **you** your own training statistics. It is:

- **never** shown to other users;
- **never** sold, rented or shared for advertising;
- **never** used to train AI or machine-learning models;
- **never** used for analytics across users.

**No AI processing.** No AI system processes your data, including data from Garmin and Strava. All statistics (weekly totals, best efforts, paces) are calculated with plain, deterministic formulas. If this ever changes, we will ask for your explicit consent first, and you can withdraw it at any time.

## Legal basis

We process your data based on your **consent** (GDPR Art. 6(1)(a)). Activity data such as heart rate is health data, so we ask for your **explicit consent** (GDPR Art. 9(2)(a)) when you connect Garmin or Strava. You can withdraw your consent at any time by disconnecting a service or deleting your account.

## Where data is stored

Data is stored with these processors:

| Processor | Purpose                                       | Location                 |
| --------- | --------------------------------------------- | ------------------------ |
| Supabase  | Database, login, file storage                 | EU                       |
| Vercel    | Hosting the app                               | EU / global edge network |
| Google    | "Sign in with Google" (only if you choose it) | Global                   |

Data is encrypted in transit (HTTPS). Access tokens are encrypted at rest. Database rules ensure each user can only access their own data.

## How long we keep data

- **Strava data** is refreshed or deleted within **7 days**, as Strava's API terms require.
- **When you disconnect a service**, all data from that service is deleted.
- **When you delete your account**, all your data is permanently deleted.
- Activities you delete in Garmin or Strava are removed from Stramin within **48 hours**.

## Your rights

Under the GDPR you have the right to:

- **access** and **export** your data (available in Settings);
- **correct** your data;
- **delete** your data and account (available in Settings);
- **withdraw consent** at any time;
- **complain** to the Danish Data Protection Agency ([Datatilsynet](https://www.datatilsynet.dk)).

To exercise a right, use the options in the app or contact us at the email above.

## Children

Stramin is not intended for children under 16.

## Changes

If this policy changes, the date at the top will be updated. Significant changes will be announced in the app.

## Third-party services

Stramin is an independent project and is not affiliated with Garmin or Strava. Their own privacy policies apply to data in their services.
