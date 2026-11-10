/** The activity on Strava (ACT-4). No server-only imports, so client components can use it too. */
export function stravaActivityUrl(id: string): string {
  return `https://www.strava.com/activities/${id}`;
}
