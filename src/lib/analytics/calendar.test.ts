import { describe, expect, test } from "vitest";
import {
  buildCalendar,
  type CalendarActivity,
  calendarQuery,
  containsToday,
  densityFor,
  parseCalendarRequest,
  resolvePeriod,
  shiftPeriod,
  visibleRange,
  weekNumber,
} from "./calendar";

const TODAY = "2026-11-10";

function activity(
  partial: Partial<CalendarActivity> & { startLocal: string },
): CalendarActivity {
  return {
    id: partial.startLocal,
    name: "Workout",
    sport: "run",
    movingSeconds: 3600,
    distanceMeters: 10_000,
    indoor: false,
    ...partial,
  };
}

describe("resolvePeriod", () => {
  test("1 month defaults to the current month", () => {
    expect(resolvePeriod({ view: "1m" }, TODAY)).toEqual({
      view: "1m",
      from: "2026-11-01",
      to: "2026-11-30",
      endMonth: "2026-11",
    });
  });

  test("3 months end at the chosen month", () => {
    expect(resolvePeriod({ view: "3m", month: "2026-02" }, TODAY)).toEqual({
      view: "3m",
      from: "2025-12-01",
      to: "2026-02-28",
      endMonth: "2026-02",
    });
  });

  test("1 year spans 12 months", () => {
    const period = resolvePeriod({ view: "1y" }, TODAY);
    expect(period.from).toBe("2025-12-01");
    expect(period.to).toBe("2026-11-30");
  });

  test("future and invalid months fall back to the current month", () => {
    expect(
      resolvePeriod({ view: "1m", month: "2027-01" }, TODAY).endMonth,
    ).toBe("2026-11");
    expect(resolvePeriod({ view: "1m", month: "nope" }, TODAY).endMonth).toBe(
      "2026-11",
    );
  });

  test("custom uses the given dates, and falls back when invalid", () => {
    expect(
      resolvePeriod(
        { view: "custom", from: "2026-03-05", to: "2026-04-20" },
        TODAY,
      ),
    ).toEqual({ view: "custom", from: "2026-03-05", to: "2026-04-20" });
    expect(
      resolvePeriod(
        { view: "custom", from: "2026-04-20", to: "2026-03-05" },
        TODAY,
      ).view,
    ).toBe("1m");
    expect(
      resolvePeriod(
        { view: "custom", from: "2026-02-30", to: "2026-03-05" },
        TODAY,
      ).view,
    ).toBe("1m");
  });

  test("all time starts at the first activity", () => {
    expect(resolvePeriod({ view: "all" }, TODAY, "2023-06-04")).toEqual({
      view: "all",
      from: "2023-06-04",
      to: TODAY,
    });
  });
});

describe("shiftPeriod", () => {
  test("moves by the window size and stops at the current month", () => {
    const period = resolvePeriod({ view: "3m", month: "2026-08" }, TODAY);
    expect(shiftPeriod(period, -1, TODAY)).toEqual({
      view: "3m",
      month: "2026-05",
    });
    expect(shiftPeriod(period, 1, TODAY)).toEqual({
      view: "3m",
      month: "2026-11",
    });
    const current = resolvePeriod({ view: "3m" }, TODAY);
    expect(shiftPeriod(current, 1, TODAY)).toBeNull();
  });

  test("custom and all time can't move", () => {
    expect(
      shiftPeriod(resolvePeriod({ view: "all" }, TODAY), -1, TODAY),
    ).toBeNull();
  });

  test("containsToday", () => {
    expect(containsToday(resolvePeriod({ view: "1m" }, TODAY), TODAY)).toBe(
      true,
    );
    expect(
      containsToday(
        resolvePeriod({ view: "1m", month: "2026-10" }, TODAY),
        TODAY,
      ),
    ).toBe(false);
  });
});

describe("weekNumber", () => {
  test("ISO week numbers with a Monday start", () => {
    expect(weekNumber("2026-11-09", "monday")).toBe(46);
    expect(weekNumber("2025-12-29", "monday")).toBe(1);
    expect(weekNumber("2026-12-28", "monday")).toBe(53);
    expect(weekNumber("2027-01-04", "monday")).toBe(1);
  });

  test("US week numbers with a Sunday start", () => {
    expect(weekNumber("2025-12-28", "sunday")).toBe(1);
    expect(weekNumber("2026-01-04", "sunday")).toBe(2);
  });
});

describe("buildCalendar", () => {
  const november = resolvePeriod({ view: "1m" }, TODAY);

  test("pads the month to whole weeks, Monday to Sunday", () => {
    expect(visibleRange(november, "monday")).toEqual({
      from: "2026-10-26",
      to: "2026-12-06",
    });
    const calendar = buildCalendar([], november, "monday", TODAY);
    expect(calendar.weeks).toHaveLength(6);
    expect(calendar.weeks[0].days[0]).toMatchObject({
      date: "2026-10-26",
      inPeriod: false,
    });
    expect(calendar.weeks[0].days[6]).toMatchObject({
      date: "2026-11-01",
      inPeriod: true,
    });
    expect(calendar.weeks[0].months).toEqual(["2026-11"]);
    expect(calendar.density).toBe("detailed");
  });

  test("Sunday start", () => {
    const calendar = buildCalendar([], november, "sunday", TODAY);
    expect(calendar.weeks[0].start).toBe("2026-11-01");
  });

  test("puts workouts on their local day and totals weeks and the period", () => {
    const activities = [
      activity({ startLocal: "2026-10-27T07:00:00Z", sport: "bike" }),
      activity({ startLocal: "2026-11-02T18:00:00Z" }),
      activity({
        startLocal: "2026-11-02T06:00:00Z",
        sport: "swim",
        distanceMeters: 1500,
        movingSeconds: 1800,
      }),
      activity({
        startLocal: "2026-11-04T07:00:00Z",
        sport: "strength",
        distanceMeters: 0,
      }),
      activity({ startLocal: "2026-12-20T07:00:00Z" }),
    ];
    const calendar = buildCalendar(activities, november, "monday", TODAY);

    // 27 Oct is visible (first row) but outside the period.
    expect(calendar.weeks[0].days[1].activities).toHaveLength(1);
    expect(calendar.weeks[0].totals.meters.bike).toBe(10_000);
    expect(calendar.totals.meters.bike).toBe(0);

    // Sorted by start time within the day.
    const monday = calendar.weeks[1].days[0];
    expect(monday.activities.map((a) => a.sport)).toEqual(["swim", "run"]);
    expect(calendar.weeks[1].totals.totalSeconds).toBe(3600 + 1800 + 3600);

    expect(calendar.totals.count).toBe(3);
    expect(calendar.totals.meters.run).toBe(10_000);
    expect(calendar.totals.seconds.strength).toBe(3600);
    expect(calendar.periodWeeks).toBeCloseTo(30 / 7);
  });

  test("marks today and future days", () => {
    const calendar = buildCalendar([], november, "monday", TODAY);
    const days = calendar.weeks.flatMap((week) => week.days);
    expect(days.find((day) => day.isToday)?.date).toBe(TODAY);
    expect(days.find((day) => day.date === "2026-11-11")?.isFuture).toBe(true);
  });

  test("labels the weeks where a month starts", () => {
    const period = resolvePeriod({ view: "3m" }, TODAY);
    const calendar = buildCalendar([], period, "monday", TODAY);
    const labels = calendar.weeks.flatMap((week) => week.months);
    expect(labels).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(calendar.density).toBe("compact");
  });
});

describe("densityFor", () => {
  test("more weeks, less detail", () => {
    expect(densityFor(6)).toBe("detailed");
    expect(densityFor(14)).toBe("compact");
    expect(densityFor(27)).toBe("mini");
  });
});

describe("URL params", () => {
  test("parse and build", () => {
    expect(parseCalendarRequest({})).toBeNull();
    expect(parseCalendarRequest({ view: "weird" })).toBeNull();
    const request = parseCalendarRequest({ view: "3m", month: "2026-08" });
    expect(request).toEqual({
      view: "3m",
      month: "2026-08",
      from: undefined,
      to: undefined,
    });
    expect(
      calendarQuery({ view: "custom", from: "2026-01-01", to: "2026-02-01" }),
    ).toEqual({
      view: "custom",
      from: "2026-01-01",
      to: "2026-02-01",
    });
  });
});
