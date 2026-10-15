import { describe, expect, it } from "vitest";
import { calculateSchedule } from "./schedule";
import type { ScheduleInput } from "./schedule";

const workPackages: ScheduleInput[] = [
  { id: "survey", durationDays: 2, dependencies: [] },
  { id: "permits", durationDays: 4, dependencies: [] },
  { id: "excavation", durationDays: 3, dependencies: ["survey"] },
  { id: "materials", durationDays: 2, dependencies: ["survey"] },
  {
    id: "foundation",
    durationDays: 4,
    dependencies: ["excavation", "permits", "materials"],
  },
  { id: "framing", durationDays: 3, dependencies: ["foundation"] },
  { id: "inspection", durationDays: 2, dependencies: ["permits"] },
];

describe("finish-to-start schedule calculation", () => {
  it("waits for every predecessor and calculates late dates and float against the project finish", () => {
    const schedule = calculateSchedule(workPackages);
    expect(schedule.finishDay).toBe(12);
    expect(schedule.tasks).toEqual({
      survey: {
        earlyStart: 0,
        earlyFinish: 2,
        lateStart: 0,
        lateFinish: 2,
        totalFloat: 0,
        critical: true,
      },
      permits: {
        earlyStart: 0,
        earlyFinish: 4,
        lateStart: 1,
        lateFinish: 5,
        totalFloat: 1,
        critical: false,
      },
      excavation: {
        earlyStart: 2,
        earlyFinish: 5,
        lateStart: 2,
        lateFinish: 5,
        totalFloat: 0,
        critical: true,
      },
      materials: {
        earlyStart: 2,
        earlyFinish: 4,
        lateStart: 3,
        lateFinish: 5,
        totalFloat: 1,
        critical: false,
      },
      foundation: {
        earlyStart: 5,
        earlyFinish: 9,
        lateStart: 5,
        lateFinish: 9,
        totalFloat: 0,
        critical: true,
      },
      framing: {
        earlyStart: 9,
        earlyFinish: 12,
        lateStart: 9,
        lateFinish: 12,
        totalFloat: 0,
        critical: true,
      },
      inspection: {
        earlyStart: 4,
        earlyFinish: 6,
        lateStart: 10,
        lateFinish: 12,
        totalFloat: 6,
        critical: false,
      },
    });
    expect(schedule.criticalPath).toEqual([
      "survey",
      "excavation",
      "foundation",
      "framing",
    ]);
  });

  it("accepts successors before predecessors and shifts dates without changing float or input", () => {
    const shuffled = [6, 5, 4, 3, 2, 1, 0].map((index) =>
      structuredClone(workPackages[index]),
    );
    const original = structuredClone(shuffled);
    const baseline = calculateSchedule(workPackages);
    expect(calculateSchedule(shuffled)).toEqual(baseline);
    const shifted = calculateSchedule(shuffled, 7);
    expect(shifted.finishDay).toBe(19);
    expect(shifted.criticalPath).toEqual(baseline.criticalPath);
    for (const [id, timing] of Object.entries(baseline.tasks)) {
      expect(shifted.tasks[id]).toEqual({
        earlyStart: timing.earlyStart + 7,
        earlyFinish: timing.earlyFinish + 7,
        lateStart: timing.lateStart + 7,
        lateFinish: timing.lateFinish + 7,
        totalFloat: timing.totalFloat,
        critical: timing.critical,
      });
    }
    expect(shuffled).toEqual(original);
  });

  it("identifies every activity on parallel equally critical paths", () => {
    const schedule = calculateSchedule([
      { id: "start", durationDays: 1, dependencies: [] },
      { id: "long", durationDays: 4, dependencies: ["start"] },
      { id: "first", durationDays: 2, dependencies: ["start"] },
      { id: "second", durationDays: 2, dependencies: ["first"] },
      { id: "short", durationDays: 1, dependencies: ["start"] },
      {
        id: "finish",
        durationDays: 1,
        dependencies: ["long", "second", "short"],
      },
    ]);
    expect(schedule.finishDay).toBe(6);
    expect(schedule.criticalPath).toEqual([
      "start",
      "long",
      "first",
      "second",
      "finish",
    ]);
    for (const id of schedule.criticalPath) {
      expect(schedule.tasks[id].critical).toBe(true);
      expect(schedule.tasks[id].totalFloat).toBe(0);
    }
    expect(schedule.tasks.short).toMatchObject({
      earlyStart: 1,
      earlyFinish: 2,
      lateStart: 4,
      lateFinish: 5,
      totalFloat: 3,
      critical: false,
    });
  });

  it.each([
    {
      name: "cycle spanning several work packages",
      tasks: [
        { id: "a", durationDays: 1, dependencies: ["c"] },
        { id: "b", durationDays: 1, dependencies: ["a"] },
        { id: "c", durationDays: 1, dependencies: ["b"] },
      ],
      error: /cycle/i,
    },
    {
      name: "self dependency",
      tasks: [{ id: "a", durationDays: 1, dependencies: ["a"] }],
      error: /cycle/i,
    },
    {
      name: "missing predecessor",
      tasks: [{ id: "a", durationDays: 1, dependencies: ["missing"] }],
      error: /unknown predecessor.*missing/i,
    },
    {
      name: "duplicate work package IDs",
      tasks: [
        { id: "a", durationDays: 1, dependencies: [] },
        { id: "a", durationDays: 2, dependencies: [] },
      ],
      error: /unique/i,
    },
    {
      name: "duplicate dependencies",
      tasks: [
        { id: "a", durationDays: 1, dependencies: [] },
        { id: "b", durationDays: 1, dependencies: ["a", "a"] },
      ],
      error: /only.*once/i,
    },
  ])("rejects a $name", ({ tasks, error }) => {
    expect(() => calculateSchedule(tasks)).toThrow(error);
  });

  it("requires one to one hundred work packages", () => {
    expect(() => calculateSchedule([])).toThrow(/1–100/);
    const tasks = Array.from({ length: 100 }, (_, index) => ({
      id: `task-${index}`,
      durationDays: 1,
      dependencies: [],
    }));
    expect(calculateSchedule(tasks).finishDay).toBe(1);
    expect(() =>
      calculateSchedule([
        ...tasks,
        { id: "one-too-many", durationDays: 1, dependencies: [] },
      ]),
    ).toThrow(/1–100/);
  });

  it.each([0, -1, 1.5, 61, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid duration of %s days",
    (durationDays) => {
      expect(() =>
        calculateSchedule([{ id: "a", durationDays, dependencies: [] }]),
      ).toThrow(/whole working days from 1 to 60/i);
    },
  );

  it.each([Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY])(
    "rejects a nonfinite start day of %s",
    (startDay) => {
      expect(() => calculateSchedule(workPackages, startDay)).toThrow(
        /finite start day/i,
      );
    },
  );
});
