import { describe, expect, test } from "vitest";
import { nextStep, toActivityValues } from "./sync";

const NOW = new Date("2026-11-10T12:00:00Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3600_000);

describe("toActivityValues", () => {
  test("maps a Strava summary", () => {
    const row = toActivityValues(
      "user-1",
      {
        id: 123,
        name: "Zwift – Watopia",
        sport_type: "VirtualRide",
        start_date: "2026-11-10T06:15:00Z",
        start_date_local: "2026-11-10T07:15:00Z",
        moving_time: 3600.4,
        elapsed_time: 3700,
        distance: 32_000,
        total_elevation_gain: 210,
        trainer: false,
      },
      NOW,
    );
    expect(row).toMatchObject({
      userId: "user-1",
      provider: "strava",
      providerActivityId: "123",
      sport: "bike",
      isIndoor: true,
      startLocal: "2026-11-10T07:15:00Z",
      movingSeconds: 3600,
      distanceM: 32_000,
      fetchedAt: NOW,
    });
    expect(row.startTime).toEqual(new Date("2026-11-10T06:15:00Z"));
  });

  test("keeps a name when Strava gives none", () => {
    const row = toActivityValues(
      "u",
      {
        id: 1,
        name: "",
        sport_type: "WeightTraining",
        start_date: "2026-11-10T06:15:00Z",
        start_date_local: "2026-11-10T07:15:00Z",
        moving_time: 1800,
        elapsed_time: 1800,
        distance: 0,
        trainer: false,
      },
      NOW,
    );
    expect(row.name).toBe("WeightTraining");
    expect(row.sport).toBe("strength");
  });
});

describe("toActivityValues ids", () => {
  const summary = {
    name: "Ride",
    sport_type: "Ride",
    start_date: "2026-11-10T06:15:00Z",
    start_date_local: "2026-11-10T07:15:00Z",
    moving_time: 3600,
    elapsed_time: 3600,
    distance: 30_000,
    trainer: false,
  };

  test("uses id_str exactly, even above 2^53", () => {
    const row = toActivityValues(
      "u",
      { ...summary, id: 1, id_str: "9007199254740993" },
      NOW,
    );
    expect(row.providerActivityId).toBe("9007199254740993");
  });

  test("falls back to id when id_str is missing", () => {
    const row = toActivityValues("u", { ...summary, id: 123 }, NOW);
    expect(row.providerActivityId).toBe("123");
  });
});

describe("nextStep (ADR 0012)", () => {
  test("unfinished imports come first", () => {
    for (const importState of ["pending", "running", "failed"] as const) {
      expect(
        nextStep(
          { importState, lastFullSyncAt: hoursAgo(1), lastSyncAt: hoursAgo(1) },
          NOW,
        ),
      ).toBe("import");
    }
  });

  test("a full refresh once a day, a quick sync every 3 hours", () => {
    expect(
      nextStep(
        {
          importState: "done",
          lastFullSyncAt: hoursAgo(25),
          lastSyncAt: hoursAgo(1),
        },
        NOW,
      ),
    ).toBe("full");
    expect(
      nextStep(
        {
          importState: "done",
          lastFullSyncAt: hoursAgo(5),
          lastSyncAt: hoursAgo(4),
        },
        NOW,
      ),
    ).toBe("quick");
    expect(
      nextStep(
        {
          importState: "done",
          lastFullSyncAt: hoursAgo(5),
          lastSyncAt: hoursAgo(1),
        },
        NOW,
      ),
    ).toBe("none");
  });
});
