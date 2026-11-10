import { useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import {
  type BestEffort,
  EFFORT_DISTANCES,
  type EffortSport,
  findEffort,
} from "@/lib/analytics/best-efforts";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { effortDistanceLabel } from "../distance-label";
import { BestEffortRow, type EffortRowData } from "./best-effort-row";

/** Best efforts for one sport (UI_SPEC §6). */
export function BestEffortsCard({
  sport,
  efforts,
  units,
  editable,
}: {
  sport: EffortSport;
  efforts: BestEffort[];
  units: Units;
  editable: boolean;
}) {
  const tSports = useTranslations("Activities.sports");
  const tDistances = useTranslations("Distances");
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };

  return (
    <section className="flex flex-col rounded-2xl border bg-card p-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <span className={cn("size-2.5 rounded-full", SPORT_BG[sport])} />
        {tSports(sport)}
      </h3>
      <ul className="divide-y">
        {EFFORT_DISTANCES[sport].map((distance) => {
          const effort = findEffort(efforts, sport, distance);
          const data: EffortRowData | undefined = effort && {
            seconds: effort.seconds,
            date: effort.date,
            source: effort.source,
            activityId: effort.activityId,
            exact: effort.exact,
            estimateSeconds: effort.estimate?.seconds,
          };
          return (
            <BestEffortRow
              key={distance}
              sport={sport}
              distance={distance}
              label={effortDistanceLabel(sport, distance, locale, names)}
              effort={data}
              units={units}
              editable={editable}
            />
          );
        })}
      </ul>
    </section>
  );
}
