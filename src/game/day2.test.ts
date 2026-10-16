import { describe, expect, it } from "vitest";
import legacyDay1 from "../../tests/fixtures/day1-v1-completed.json";
import {
  applyCommand,
  createGame,
  getConversationChoice,
  getFeedback,
  getObjectives,
  replayMission,
} from "./engine";
import { baselineSchedule, type ScheduleOption } from "./day2-content";
import { getScheduleRecommendationError } from "./day2";
import { parseSave, serializeSave } from "./save";
import { finish, investigate, profile, run } from "./testHelpers";
import type { Command, GameState, ReviewAnswer } from "./types";

type PlanCommand = Extract<Command, { type: "saveSchedulePlan" }>;

function enterDay2(previous = finish()): GameState {
  return run(previous, { type: "startNextMission" });
}

function gatherDay2(previous = finish()): GameState {
  let state = run(enterDay2(previous), { type: "brief" });
  state = run(state, { type: "inspect", source: "schedule" });
  state = run(state, { type: "ask", npc: "lead", choice: "facts" });
  return run(state, { type: "ask", npc: "safety", choice: "facts" });
}

function verifiedPlan(): PlanCommand {
  return {
    type: "saveSchedulePlan",
    tasks: baselineSchedule().map((task) => ({
      ...task,
      durationDays: task.id === "setting_out" ? 2 : task.durationDays,
    })),
    owner: "Sam",
    checkpoint: "11:00",
    evidence: ["schedule", "lead", "safety"],
  };
}

function planDay2(previous = finish()): GameState {
  return run(gatherDay2(previous), verifiedPlan());
}

function recommendation(
  state: GameState,
  option: ScheduleOption = "wait",
  confidence: "estimate" | "guaranteed" = "estimate",
): Extract<Command, { type: "submitScheduleRecommendation" }> {
  const carried = state.schedule!.carriedForecastDay;
  return {
    type: "submitScheduleRecommendation",
    option,
    confidence,
    nextCheck: "11:00",
    comparison: {
      waitFinishDay: carried + 1,
      waitCost: 0,
      alternateFinishDay: carried,
      alternateCost: 1200,
    },
  };
}

function reviewDay2(
  option: ScheduleOption = "wait",
  previous = finish(),
  confidence: "estimate" | "guaranteed" = "estimate",
): GameState {
  let state = planDay2(previous);
  state = run(state, { type: "chooseScheduleRecommendation", option });
  return run(state, recommendation(state, option, confidence));
}

function finishDay2(
  option: ScheduleOption = "wait",
  previous = finish(),
  answer: ReviewAnswer = "conditional",
  confidence: "estimate" | "guaranteed" = "estimate",
): GameState {
  const state = run(reviewDay2(option, previous, confidence), {
    type: "answerReview",
    answer,
  });
  return run(state, { type: "advanceTime" });
}

describe("CONST-I02 campaign and verified dependency planning", () => {
  it("unlocks only from a completed Day 1 checkpoint", () => {
    for (const state of [createGame(profile), investigate()]) {
      const result = applyCommand(state, { type: "startNextMission" });
      expect(result.error).toMatch(/Day 1 debrief/);
      expect(result.state).toBe(state);
      expect(applyCommand(state, verifiedPlan()).error).toMatch(/Day 2/);
    }
    const state = enterDay2();
    expect(state).toMatchObject({
      missionId: "CONST-I02",
      day: 2,
      phase: "arrival",
      minutes: 540,
    });
    expect(applyCommand(state, { type: "startNextMission" }).state).toBe(state);
    expect(
      applyCommand(state, { type: "inspect", source: "schedule" }).error,
    ).toMatch(/Alex/);
  });

  it("carries the actual project and career, retaining the earlier case study while clearing active records", () => {
    for (const option of ["wait", "alternate", "promise"] as const) {
      const previous = finish(option);
      const unchanged = structuredClone(previous);
      const state = enterDay2(previous);
      expect(previous).toEqual(unchanged);
      expect(state.project).toEqual(previous.project);
      expect(state.career.xp).toBe(previous.career.xp);
      expect(state.career.completedMissionIds).toEqual(["CONST-I01"]);
      expect(state.relationships).toEqual(previous.relationships);
      expect(state.profile).toEqual(previous.profile);
      expect(state.schedule).toEqual({
        carriedForecastDay: previous.project.forecastFinishDay,
        plan: null,
        choice: null,
        proposal: null,
      });
      expect(state.missionHistory).toEqual([
        expect.objectContaining({
          missionId: "CONST-I01",
          xpEarned: previous.career.xp,
          scores: previous.career.competencies,
          outcome: previous.project.explanation,
          forecastFinishDay: previous.project.forecastFinishDay,
          actualCost: previous.project.actualCost,
          trust: previous.project.stakeholderTrust,
        }),
      ]);
      expect(state.events.slice(0, previous.events.length)).toEqual(
        previous.events,
      );
      expect(state.journal.slice(0, previous.journal.length)).toEqual(
        previous.journal,
      );
      expect(state.evidence).toEqual([]);
      expect(state.issue).toBeNull();
      expect(state.proposal).toBeNull();
      expect(state.reviewAnswer).toBeNull();
      expect(state.tasks.map((task) => task.id)).toEqual(
        baselineSchedule().map((task) => task.id),
      );
    }
  });

  it("requires the new mission's schedule, Sam and Taylor sources, then a saved plan", () => {
    let state = run(enterDay2(), { type: "brief" });
    expect(getConversationChoice(state, "lead")).toBeNull();
    expect(getScheduleRecommendationError(state)).toMatch(/Sam.*Taylor/);
    expect(applyCommand(state, verifiedPlan()).state).toBe(state);
    state = run(state, { type: "inspect", source: "schedule" });
    state = run(state, { type: "ask", npc: "lead", choice: "facts" });
    state = run(state, { type: "ask", npc: "supplier", choice: "facts" });
    expect(applyCommand(state, verifiedPlan()).error).toBeTruthy();
    state = run(state, { type: "ask", npc: "safety", choice: "facts" });
    expect(getScheduleRecommendationError(state)).toMatch(/plan/);
    const chosen = applyCommand(state, {
      type: "chooseScheduleRecommendation",
      option: "wait",
    });
    expect(chosen.state).toBe(state);
    expect(chosen.error).toMatch(/plan/);
    state = run(state, verifiedPlan());
    expect(getScheduleRecommendationError(state)).toBeUndefined();
  });

  it("rejects unsupported durations, removed gates, bad provenance, cycles and incomplete work packages without mutation", () => {
    const state = gatherDay2();
    const invalid: PlanCommand[] = [
      { ...verifiedPlan(), owner: "Alex" },
      { ...verifiedPlan(), checkpoint: "10:30" },
      { ...verifiedPlan(), evidence: ["schedule", "lead"] },
      {
        ...verifiedPlan(),
        evidence: ["schedule", "lead", "safety", "supplier"],
      },
      { ...verifiedPlan(), tasks: baselineSchedule() },
      { ...verifiedPlan(), tasks: verifiedPlan().tasks.slice(1) },
      {
        ...verifiedPlan(),
        tasks: [...verifiedPlan().tasks.slice(0, 3), verifiedPlan().tasks[0]],
      },
    ];
    for (const id of [
      "safety_inspection",
      "formwork_preparation",
      "foundation_pour",
    ]) {
      invalid.push({
        ...verifiedPlan(),
        tasks: verifiedPlan().tasks.map((task) =>
          task.id === id
            ? { ...task, dependencies: task.dependencies.slice(1) }
            : task,
        ),
      });
    }
    invalid.push({
      ...verifiedPlan(),
      tasks: verifiedPlan().tasks.map((task) =>
        task.id === "setting_out"
          ? { ...task, dependencies: ["foundation_pour"] }
          : task,
      ),
    });
    invalid.push({
      ...verifiedPlan(),
      tasks: verifiedPlan().tasks.map((task) =>
        task.id === "formwork_preparation"
          ? { ...task, durationDays: 1 }
          : task,
      ),
    });
    const original = structuredClone(state);
    for (const command of invalid) {
      const result = applyCommand(state, command);
      expect(result.error).toBeTruthy();
      expect(result.state).toBe(state);
    }
    expect(state).toEqual(original);
    expect(state.schedule?.plan).toBeNull();
  });

  it("recalculates the working forecast from the verified diamond without changing baseline or spending", () => {
    for (const previous of [finish("wait"), finish("alternate")]) {
      const state = planDay2(previous);
      expect(state.schedule?.plan).toMatchObject({
        owner: "Sam",
        checkpoint: "11:00",
        chainDays: 5,
        forecastFinishDay: previous.project.forecastFinishDay + 1,
      });
      expect(state.project.forecastFinishDay).toBe(
        previous.project.forecastFinishDay + 1,
      );
      expect(state.project.baselineFinishDay).toBe(
        previous.project.baselineFinishDay,
      );
      expect(state.project.actualCost).toBe(previous.project.actualCost);
      expect(state.project.forecastCost).toBe(previous.project.forecastCost);
      expect(state.career.xp).toBe(previous.career.xp);
      expect(
        state.tasks.find((task) => task.id === "foundation_pour")?.dependencies,
      ).toEqual(["safety_inspection", "formwork_preparation"]);
      expect(applyCommand(state, verifiedPlan()).state).toBe(state);
    }
  });

  it("normalizes equivalent task, predecessor and evidence order without duplicate replan events", () => {
    const gathered = run(gatherDay2(), {
      type: "ask",
      npc: "supplier",
      choice: "facts",
    });
    const command: PlanCommand = {
      ...verifiedPlan(),
      tasks: verifiedPlan()
        .tasks.reverse()
        .map((task) => ({
          ...task,
          dependencies: [...task.dependencies].reverse(),
        })),
      evidence: ["safety", "supplier", "schedule", "lead"],
    };
    const state = run(gathered, command);
    expect(state.schedule?.plan?.tasks).toEqual(verifiedPlan().tasks);
    expect(state.schedule?.plan?.evidence).toEqual([
      "schedule",
      "lead",
      "supplier",
      "safety",
    ]);
    const repeated = applyCommand(state, {
      ...verifiedPlan(),
      evidence: ["supplier", "lead", "schedule", "safety"],
    });
    expect(repeated.state).toBe(state);
    expect(
      state.events.filter(
        (event) => event.day === 2 && event.type === "schedule_replanned",
      ),
    ).toHaveLength(1);
    expect(parseSave(serializeSave(state))).toEqual({ state });
  });

  it("locks Day 2 conversations independently and recovers pressure evidence without erasing its cost", () => {
    let state = run(enterDay2(), { type: "brief" });
    const trust = state.relationships.Sam;
    state = run(state, { type: "ask", npc: "lead", choice: "pressure" });
    expect(getConversationChoice(state, "lead")).toBe("pressure");
    expect(state.relationships.Sam).toBe(trust - 4);
    expect(state.evidence).not.toContain("lead");
    expect(
      applyCommand(state, { type: "ask", npc: "lead", choice: "facts" }).error,
    ).toBeTruthy();
    expect(
      applyCommand(state, { type: "ask", npc: "lead", choice: "pressure" })
        .state,
    ).toBe(state);
    state = run(state, { type: "followUp", npc: "lead" });
    expect(state.relationships.Sam).toBe(trust - 4);
    expect(state.evidence).toEqual(["lead"]);
    expect(applyCommand(state, { type: "followUp", npc: "lead" }).state).toBe(
      state,
    );
    expect(
      getConversationChoice(parseSave(serializeSave(state)).state!, "lead"),
    ).toBe("pressure");
    state = run(state, { type: "inspect", source: "schedule" });
    state = run(state, { type: "ask", npc: "safety", choice: "facts" });
    expect(
      applyCommand(state, { type: "ask", npc: "safety", choice: "pressure" })
        .state,
    ).toBe(state);
    state = run(state, verifiedPlan());
    expect(getScheduleRecommendationError(state)).toBeUndefined();
  });

  it("persists a committed response and rejects switching or submitting a different response", () => {
    let state = planDay2();
    expect(applyCommand(state, recommendation(state)).error).toMatch(/commit/);
    state = run(state, {
      type: "chooseScheduleRecommendation",
      option: "extra_team",
    });
    const restored = parseSave(serializeSave(state)).state!;
    expect(restored).toEqual(state);
    expect(
      applyCommand(restored, {
        type: "chooseScheduleRecommendation",
        option: "wait",
      }).state,
    ).toBe(restored);
    expect(
      applyCommand(restored, {
        type: "chooseScheduleRecommendation",
        option: "extra_team",
      }).state,
    ).toBe(restored);
    expect(applyCommand(restored, recommendation(restored, "wait")).state).toBe(
      restored,
    );
    const invalid = applyCommand(restored, {
      ...recommendation(restored, "extra_team"),
      nextCheck: "10:30",
    });
    expect(invalid.error).toBeTruthy();
    expect(invalid.state.schedule?.choice).toBe("extra_team");
    const submitted = run(
      invalid.state,
      recommendation(invalid.state, "extra_team"),
    );
    expect(submitted.schedule?.proposal?.option).toBe("extra_team");
    expect(submitted.phase).toBe("review");
  });

  it.each([
    ["wait", 1, 0, 4, "compliant", "approved"],
    ["extra_team", 0, 1200, 6, "compliant", "approved"],
    ["bypass", 2, 500, -12, "breach", "rejected"],
    ["original_date", 2, 600, -12, "breach", "rejected"],
  ] as const)(
    "resolves %s with its own forecast, cost, trust and governance consequences",
    (option, delay, cost, trust, governance, approval) => {
      const previous = finish();
      const state = finishDay2(option, previous);
      expect(state.project.forecastFinishDay).toBe(
        previous.project.forecastFinishDay + delay,
      );
      expect(state.project.actualCost).toBe(previous.project.actualCost + cost);
      expect(state.project.forecastCost).toBe(
        previous.project.forecastCost + cost,
      );
      expect(state.project.stakeholderTrust).toBe(
        previous.project.stakeholderTrust + trust,
      );
      expect(state.project.governance).toBe(governance);
      expect(state.schedule?.proposal?.approval).toBe(approval);
      expect(state.project.quality).toBe(previous.project.quality);
      expect(state.project.baselineFinishDay).toBe(
        previous.project.baselineFinishDay,
      );
      expect(state.career.completedMissionIds).toEqual([
        "CONST-I01",
        "CONST-I02",
      ]);
      expect(state.career.role).toBe("Junior PM Intern");
      expect(state.missionHistory).toHaveLength(2);
      expect(state.missionHistory?.[1].xpEarned).toBe(
        state.career.xp - previous.career.xp,
      );
      expect(
        getObjectives(state).every((objective) => objective.complete),
      ).toBe(true);
      expect(parseSave(serializeSave(state))).toEqual({ state });
    },
  );

  it("verifies capacity and acceptance before approved support costs or XP are applied", () => {
    const previous = finish("alternate");
    let state = reviewDay2("extra_team", previous);
    expect(state.project.actualCost).toBe(previous.project.actualCost);
    expect(state.career.xp).toBe(previous.career.xp);
    state = run(state, { type: "answerReview", answer: "conditional" });
    expect(state.schedule?.proposal?.approval).toBe("conditional");
    expect(state.project.actualCost).toBe(previous.project.actualCost);
    expect(
      applyCommand(state, { type: "answerReview", answer: "guarantee" }).state,
    ).toBe(state);
    state = run(state, { type: "advanceTime" });
    expect(
      state.events.filter(
        (event) => event.day === 2 && event.type === "approval_verified",
      ),
    ).toHaveLength(1);
    expect(state.project.actualCost).toBe(previous.project.actualCost + 1200);
    expect(state.career.xp).toBe(previous.career.xp + 110);
    const feedback = getFeedback(state)!;
    expect(feedback.xpEarned).toBe(110);
    expect(feedback.criteria.map((criterion) => criterion.score)).toEqual([
      3, 3, 3, 3,
    ]);
    expect(
      feedback.criteria.every(
        (criterion) =>
          criterion.citations.length > 0 &&
          criterion.citations.every(
            (event) => event.day === 2 && state.events.includes(event),
          ),
      ),
    ).toBe(true);
  });

  it("distinguishes an honest deferred response from an unsupported guarantee and retains earlier breaches", () => {
    const previous = finish();
    const deferred = finishDay2("wait", previous, "defer");
    expect(deferred.project.governance).toBe("compliant");
    expect(deferred.project.actualCost).toBe(previous.project.actualCost + 300);
    expect(deferred.project.explanation).toMatch(/deferred review/);
    expect(
      deferred.events
        .filter((event) => event.day === 2)
        .some((event) => event.type === "governance_audited"),
    ).toBe(false);
    for (const guaranteed of [
      finishDay2("wait", previous, "guarantee"),
      finishDay2("extra_team", previous, "conditional", "guaranteed"),
    ]) {
      expect(guaranteed.project.governance).toBe("breach");
      expect(guaranteed.project.actualCost).toBe(
        previous.project.actualCost + 600,
      );
      expect(guaranteed.career.competencies.accuracy).toBe(0);
    }
    expect(finishDay2("wait", finish("promise")).project.governance).toBe(
      "breach",
    );
  });

  it("scores the quantified comparison independently from a valid dependency plan", () => {
    let state = planDay2();
    state = run(state, {
      type: "chooseScheduleRecommendation",
      option: "wait",
    });
    const command = recommendation(state);
    state = run(state, {
      ...command,
      comparison: { ...command.comparison, alternateCost: 0 },
    });
    state = run(state, { type: "answerReview", answer: "conditional" });
    state = run(state, { type: "advanceTime" });
    expect(state.career.competencies.impact).toBe(2);
    expect(state.career.competencies.accuracy).toBe(3);
    expect(state.project.governance).toBe("compliant");
    expect(state.schedule?.plan?.chainDays).toBe(5);
  });

  it("cannot resolve early or duplicate rewards, history, charges or checkpoint events", () => {
    const review = reviewDay2();
    expect(applyCommand(review, { type: "advanceTime" }).state).toBe(review);
    const state = finishDay2("extra_team");
    const original = structuredClone(state);
    for (const command of [
      { type: "advanceTime" },
      { type: "startNextMission" },
      { type: "answerReview", answer: "conditional" },
    ] as const) {
      expect(applyCommand(state, command).state).toBe(state);
    }
    expect(state).toEqual(original);
    expect(
      state.events.filter(
        (event) => event.day === 2 && event.type === "mission_completed",
      ),
    ).toHaveLength(1);
    expect(
      state.missionHistory?.filter((entry) => entry.missionId === "CONST-I02"),
    ).toHaveLength(1);
    expect(state.career.completedMissionIds).toEqual([
      "CONST-I01",
      "CONST-I02",
    ]);
    expect(state.minutes).toBe(660);
  });

  it("round-trips each Day 2 stage with exact carried state and rejects edited plan/history/outcomes", () => {
    const stages = [
      enterDay2(),
      gatherDay2(),
      planDay2(),
      reviewDay2(),
      finishDay2(),
    ];
    for (const state of stages) {
      state.position = { x: 2.3, z: -1.4, yaw: 0.8 };
      expect(parseSave(serializeSave(state))).toEqual({ state });
    }
    for (const mutate of [
      (state: GameState) => {
        state.schedule!.plan!.chainDays = 1;
      },
      (state: GameState) => {
        state.schedule!.carriedForecastDay = 1;
      },
      (state: GameState) => {
        state.missionHistory![0].xpEarned = 9999;
      },
      (state: GameState) => {
        state.project.actualCost = 0;
      },
    ]) {
      const state = structuredClone(finishDay2());
      mutate(state);
      expect(parseSave(serializeSave(state)).error).toMatch(/does not match/);
    }
  });

  it("loads the literal schema-1 dual-answer fixture and carries it through Day 2 without rewriting earlier consequences", () => {
    const loaded = parseSave(JSON.stringify(legacyDay1));
    expect(loaded.error).toBeUndefined();
    expect(loaded.state).toEqual(legacyDay1.snapshot);
    const previous = loaded.state!;
    expect(previous.relationships.Sam).toBe(59);
    expect(previous.career.xp).toBe(100);
    const state = finishDay2("extra_team", previous);
    expect(state.relationships.Sam).toBe(62);
    expect(state.events.filter((event) => event.day === 1)).toEqual(
      previous.events,
    );
    expect(state.project.actualCost).toBe(1600);
    expect(state.career.xp).toBe(210);
    expect(parseSave(serializeSave(state))).toEqual({ state });
  });

  it("replays Day 2 from the real Day 1 checkpoint, restoring carried costs, trust, XP and old journal", () => {
    const legacy = parseSave(JSON.stringify(legacyDay1)).state!;
    for (const previous of [finish("wait"), finish("alternate"), legacy]) {
      const completed = finishDay2("bypass", previous);
      const restarted = replayMission(completed);
      expect(restarted).toEqual(enterDay2(previous));
      expect(restarted.project).toEqual(previous.project);
      expect(restarted.career.xp).toBe(previous.career.xp);
      expect(restarted.career.completedMissionIds).toEqual(["CONST-I01"]);
      expect(restarted.missionHistory).toHaveLength(1);
      expect(restarted.phase).toBe("arrival");
      expect(restarted.schedule?.plan).toBeNull();
      expect(restarted.schedule?.choice).toBeNull();
      expect(parseSave(serializeSave(restarted))).toEqual({ state: restarted });
    }
  });
});
