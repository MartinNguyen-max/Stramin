/**
 * Privacy policy text (PRIV-5). Kept in sync with PRIVACY.md in the repo root.
 * Long legal text lives in components rather than translation files, so it stays readable.
 */

const CONTACT_NAME = "Martin Nguyen";
const CONTACT_EMAIL = "martintn09@gmail.com";
export const PRIVACY_LAST_UPDATED = "2026-11-09";

export function PrivacyEn() {
  return (
    <>
      <p>
        Stramin is a free, non-commercial training dashboard. This policy
        explains what data Stramin collects, why, and what rights you have.
        Stramin is currently in development. This policy describes how data is
        and will be handled.
      </p>

      <h2>Who is responsible</h2>
      <p>
        Stramin is a personal project run by <strong>{CONTACT_NAME}</strong>,
        Denmark, who is the data controller under the GDPR. Contact:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>What data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address and name (if you sign in
          with Google), to create and secure your account.
        </li>
        <li>
          <strong>Connection data:</strong> access tokens for Garmin and/or
          Strava, to fetch your activities on your behalf.
        </li>
        <li>
          <strong>Activity data:</strong> sport type, date, duration, distance,
          heart rate, power and elevation, to show your statistics, best efforts
          and progress.
        </li>
        <li>
          <strong>Content you add:</strong> goals, events, event images and
          settings, to provide those features.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> store GPS location or route data. We never
        ask for or store your Garmin or Strava password.
      </p>

      <h2>How we use your data</h2>
      <p>
        Your data is used <strong>only</strong> to show <strong>you</strong>{" "}
        your own training statistics. It is never shown to other users, never
        sold, rented or shared for advertising, never used to train AI or
        machine-learning models, and never used for analytics across users.
      </p>

      <h2>Legal basis</h2>
      <p>
        We process your data based on your <strong>consent</strong> (GDPR Art.
        6(1)(a)). Activity data such as heart rate is health data, so we ask for
        your <strong>explicit consent</strong> (GDPR Art. 9(2)(a)) when you
        connect Garmin or Strava. You can withdraw your consent at any time by
        disconnecting a service or deleting your account.
      </p>

      <h2>Where data is stored</h2>
      <ul>
        <li>
          <strong>Supabase</strong> (database, login, file storage), EU.
        </li>
        <li>
          <strong>Vercel</strong> (hosting the app), EU / global edge network.
        </li>
        <li>
          <strong>Google</strong> ("Sign in with Google", only if you choose
          it).
        </li>
      </ul>
      <p>
        Data is encrypted in transit (HTTPS). Access tokens are encrypted at
        rest. Database rules ensure each user can only access their own data.
      </p>

      <h2>How long we keep data</h2>
      <ul>
        <li>
          Strava data is refreshed or deleted within 7 days, as Strava's API
          terms require.
        </li>
        <li>
          When you disconnect a service, all data from that service is deleted.
        </li>
        <li>
          When you delete your account, all your data is permanently deleted.
        </li>
        <li>
          Activities you delete in Garmin or Strava are removed from Stramin
          within 48 hours.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Under the GDPR you have the right to access and export your data,
        correct it, delete your data and account, withdraw consent at any time,
        and complain to the Danish Data Protection Agency (
        <a href="https://www.datatilsynet.dk">Datatilsynet</a>). To exercise a
        right, use the options in the app or contact us at the email above.
      </p>

      <h2>Children</h2>
      <p>Stramin is not intended for children under 16.</p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date at the top will be updated. Significant
        changes will be announced in the app.
      </p>

      <h2>Third-party services</h2>
      <p>
        Stramin is an independent project and is not affiliated with Garmin or
        Strava. Their own privacy policies apply to data in their services.
      </p>
    </>
  );
}

export function PrivacyDa() {
  return (
    <>
      <p>
        Stramin er et gratis, ikke-kommercielt træningsoverblik. Denne politik
        forklarer, hvilke data Stramin indsamler, hvorfor, og hvilke rettigheder
        du har. Stramin er under udvikling. Politikken beskriver, hvordan data
        håndteres nu og fremover.
      </p>

      <h2>Dataansvarlig</h2>
      <p>
        Stramin er et personligt projekt drevet af{" "}
        <strong>{CONTACT_NAME}</strong>, Danmark, som er dataansvarlig efter
        GDPR. Kontakt: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>Hvilke data vi indsamler</h2>
      <ul>
        <li>
          <strong>Kontodata:</strong> e-mailadresse og navn (hvis du logger ind
          med Google), for at oprette og beskytte din konto.
        </li>
        <li>
          <strong>Forbindelsesdata:</strong> adgangsnøgler (tokens) til Garmin
          og/eller Strava, for at hente dine aktiviteter på dine vegne.
        </li>
        <li>
          <strong>Aktivitetsdata:</strong> sportstype, dato, varighed, distance,
          puls, watt og højdemeter, for at vise din statistik, dine bedste
          præstationer og din udvikling.
        </li>
        <li>
          <strong>Indhold du tilføjer:</strong> mål, begivenheder, billeder og
          indstillinger, for at levere de funktioner.
        </li>
      </ul>
      <p>
        Vi gemmer <strong>ikke</strong> GPS-positioner eller ruter. Vi beder
        aldrig om og gemmer aldrig din adgangskode til Garmin eller Strava.
      </p>

      <h2>Hvordan vi bruger dine data</h2>
      <p>
        Dine data bruges <strong>kun</strong> til at vise <strong>dig</strong>{" "}
        din egen træningsstatistik. De vises aldrig for andre brugere, sælges,
        udlejes eller deles aldrig til reklame, bruges aldrig til at træne AI-
        eller machine learning-modeller, og bruges aldrig til analyser på tværs
        af brugere.
      </p>

      <h2>Retsgrundlag</h2>
      <p>
        Vi behandler dine data på grundlag af dit <strong>samtykke</strong>{" "}
        (GDPR art. 6, stk. 1, litra a). Aktivitetsdata som puls er
        helbredsoplysninger, så vi beder om dit{" "}
        <strong>udtrykkelige samtykke</strong> (GDPR art. 9, stk. 2, litra a),
        når du forbinder Garmin eller Strava. Du kan til enhver tid trække dit
        samtykke tilbage ved at afbryde en forbindelse eller slette din konto.
      </p>

      <h2>Hvor data opbevares</h2>
      <ul>
        <li>
          <strong>Supabase</strong> (database, login, fillagring), EU.
        </li>
        <li>
          <strong>Vercel</strong> (hosting af appen), EU / globalt netværk.
        </li>
        <li>
          <strong>Google</strong> ("Log ind med Google", kun hvis du vælger
          det).
        </li>
      </ul>
      <p>
        Data krypteres under overførsel (HTTPS). Adgangsnøgler krypteres, når de
        gemmes. Databaseregler sikrer, at hver bruger kun har adgang til sine
        egne data.
      </p>

      <h2>Hvor længe vi gemmer data</h2>
      <ul>
        <li>
          Data fra Strava opdateres eller slettes inden for 7 dage, som Stravas
          API-vilkår kræver.
        </li>
        <li>
          Når du afbryder en forbindelse, slettes alle data fra den tjeneste.
        </li>
        <li>Når du sletter din konto, slettes alle dine data permanent.</li>
        <li>
          Aktiviteter, du sletter i Garmin eller Strava, fjernes fra Stramin
          inden for 48 timer.
        </li>
      </ul>

      <h2>Dine rettigheder</h2>
      <p>
        Efter GDPR har du ret til indsigt i og eksport af dine data, til at få
        dem rettet, til at få dine data og din konto slettet, til at trække dit
        samtykke tilbage når som helst, og til at klage til{" "}
        <a href="https://www.datatilsynet.dk">Datatilsynet</a>. Brug
        mulighederne i appen eller kontakt os på e-mailen ovenfor.
      </p>

      <h2>Børn</h2>
      <p>Stramin er ikke beregnet til børn under 16 år.</p>

      <h2>Ændringer</h2>
      <p>
        Hvis politikken ændres, opdateres datoen øverst. Væsentlige ændringer
        annonceres i appen.
      </p>

      <h2>Tredjepartstjenester</h2>
      <p>
        Stramin er et uafhængigt projekt og er ikke tilknyttet Garmin eller
        Strava. Deres egne privatlivspolitikker gælder for data i deres
        tjenester.
      </p>
    </>
  );
}
