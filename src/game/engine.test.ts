import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createGame,
  getConversationChoice,
  getFeedback,
  getObjectives,
  getRecommendationChoice,
  getRecommendationError,
  replayMission,
} from "./engine";
import { getPack } from "./content";
import type { Command } from "./types";

import { finish, investigate, profile, run } from "./testHelpers";

describe("CONST-I01 canonical command engine", () => {
  it("requires mentor briefing and three independent sources without changing state on errors", () => {
    const initial = createGame(profile);
    expect(
      applyCommand(initial, { type: "inspect", source: "schedule" }).error,
    ).toMatch(/Alex/);
    const briefed = run(initial, { type: "brief" });
    const result = applyCommand(briefed, {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(result.error).toMatch(/three independent/);
    expect(result.state).toBe(briefed);
    expect(initial.phase).toBe("arrival");
    expect(initial.events).toHaveLength(0);
  });
  it("provides distinct, sourced schedule, crew and supplier information", () => {
    const pack = getPack();
    expect(pack.sources.schedule.detail.join(" ")).toContain("finish-to-start");
    expect(pack.sources.lead.detail.join(" ")).toContain("Two crews");
    expect(pack.sources.supplier.detail.join(" ")).toContain("70%");
    expect(
      new Set(Object.values(pack.sources).map((source) => source.provenance))
        .size,
    ).toBe(4);
    expect(investigate().evidence).toEqual([
      "schedule",
      "lead",
      "supplier",
      "safety",
    ]);
  });
  it("keeps the first conversation choice while a factual follow-up recovers evidence without restoring trust", () => {
    let state = run(createGame(profile), { type: "brief" });
    expect(getConversationChoice(state, "supplier")).toBeNull();
    state = run(state, { type: "ask", npc: "supplier", choice: "pressure" });
    expect(state.evidence).toEqual([]);
    expect(state.relationships.Morgan).toBe(56);
    expect(getConversationChoice(state, "supplier")).toBe("pressure");
    const repeated = applyCommand(state, {
      type: "ask",
      npc: "supplier",
      choice: "pressure",
    });
    expect(repeated.state).toBe(state);
    const switched = applyCommand(state, {
      type: "ask",
      npc: "supplier",
      choice: "facts",
    });
    expect(switched.error).toBeTruthy();
    expect(switched.state).toBe(state);
    state = run(state, { type: "followUp", npc: "supplier" });
    expect(state.evidence).toEqual(["supplier"]);
    expect(state.relationships.Morgan).toBe(56);
    expect(getConversationChoice(state, "supplier")).toBe("pressure");
    expect(state.project.delivery).toBe("unconfirmed");
    expect(
      applyCommand(state, { type: "followUp", npc: "supplier" }).state,
    ).toBe(state);
  });
  it("locks factual conversation answers and rejects a follow-up before pressure", () => {
    for (const npc of ["lead", "supplier", "safety"] as const) {
      const initial = run(createGame(profile), { type: "brief" });
      const premature = applyCommand(initial, { type: "followUp", npc });
      expect(premature.error).toBeTruthy();
      expect(premature.state).toBe(initial);
      const asked = run(initial, { type: "ask", npc, choice: "facts" });
      const snapshot = structuredClone(asked);
      expect(getConversationChoice(asked, npc)).toBe("facts");
      expect(
        applyCommand(asked, { type: "ask", npc, choice: "facts" }).state,
      ).toBe(asked);
      const switched = applyCommand(asked, {
        type: "ask",
        npc,
        choice: "pressure",
      });
      expect(switched.error).toBeTruthy();
      expect(switched.state).toBe(asked);
      const followUp = applyCommand(asked, { type: "followUp", npc });
      expect(followUp.state).toBe(asked);
      expect(asked).toEqual(snapshot);
    }
  });
  it("can complete the assignment after pressured conversations through explicit factual follow-ups", () => {
    let state = run(createGame(profile), { type: "brief" });
    state = run(state, { type: "inspect", source: "schedule" });
    for (const npc of ["lead", "supplier", "safety"] as const) {
      state = run(state, { type: "ask", npc, choice: "pressure" });
      state = run(state, { type: "followUp", npc });
      expect(getConversationChoice(state, npc)).toBe("pressure");
    }
    state = run(state, {
      type: "updateTask",
      taskId: "delivery",
      status: "blocked",
      owner: "Morgan",
      dueDay: 1,
      blocker: "Truck fault; no receipt",
      evidence: ["schedule", "supplier"],
    });
    state = run(state, { type: "logIssue", issue: investigate().issue! });
    state = run(state, { type: "chooseRecommendation", option: "wait" });
    state = run(state, {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    state = run(state, { type: "answerReview", answer: "conditional" });
    state = run(state, { type: "advanceTime" });
    expect(state.phase).toBe("debrief");
    expect(state.project.governance).toBe("compliant");
    expect(state.relationships).toMatchObject({
      Sam: 56,
      Morgan: 56,
      Taylor: 56,
    });
    expect(state.career.completedMissionIds).toEqual(["CONST-I01"]);
  });
  it("requires complete source-backed investigation before committing a recommendation", () => {
    const ready = investigate(false);
    const missingSources = run(createGame(profile), { type: "brief" });
    const missingIssue = structuredClone(ready);
    missingIssue.issue = null;
    const missingCard = structuredClone(ready);
    missingCard.tasks[0].evidence = [];
    const incompleteIssue = structuredClone(ready);
    incompleteIssue.issue!.evidence = ["supplier"];
    for (const state of [
      missingSources,
      missingIssue,
      missingCard,
      incompleteIssue,
    ]) {
      const snapshot = structuredClone(state);
      const result = applyCommand(state, {
        type: "chooseRecommendation",
        option: "wait",
      });
      expect(result.error).toBe(getRecommendationError(state));
      expect(result.error).toBeTruthy();
      expect(result.state).toBe(state);
      expect(getRecommendationChoice(state)).toBeNull();
      expect(state).toEqual(snapshot);
    }
    expect(getRecommendationError(ready)).toBeUndefined();
    expect(getRecommendationChoice(ready)).toBeNull();
  });
  it("commits a recommendation once and preserves it after rejected edits or a failed submission", () => {
    const ready = investigate();
    const state = run(ready, {
      type: "chooseRecommendation",
      option: "alternate",
    });
    expect(getRecommendationChoice(state)).toBe("alternate");
    expect(state.phase).toBe("investigating");
    expect(state.proposal).toBeNull();
    expect(state.project.actualCost).toBe(0);
    const snapshot = structuredClone(state);
    expect(
      applyCommand(state, { type: "chooseRecommendation", option: "alternate" })
        .state,
    ).toBe(state);
    const changed = applyCommand(state, {
      type: "chooseRecommendation",
      option: "wait",
    });
    expect(changed.error).toBeTruthy();
    expect(changed.state).toBe(state);
    const changedSubmission = applyCommand(state, {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(changedSubmission.error).toBeTruthy();
    expect(changedSubmission.state).toBe(state);
    const invalidSubmission = applyCommand(state, {
      type: "submitRecommendation",
      option: "alternate",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "",
    });
    expect(invalidSubmission.error).toBeTruthy();
    expect(invalidSubmission.state).toBe(state);
    expect(getRecommendationChoice(invalidSubmission.state)).toBe("alternate");
    expect(state).toEqual(snapshot);
    const submitted = run(state, {
      type: "submitRecommendation",
      option: "alternate",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(getRecommendationChoice(submitted)).toBe("alternate");
    expect(submitted.proposal?.option).toBe("alternate");
  });
  it("derives a committed recommendation from a legacy direct submission", () => {
    const state = run(investigate(), {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(getRecommendationChoice(state)).toBe("wait");
    expect(
      state.journal.some((command) => command.type === "chooseRecommendation"),
    ).toBe(false);
    const changed = applyCommand(state, {
      type: "chooseRecommendation",
      option: "alternate",
    });
    expect(changed.error).toBeTruthy();
    expect(changed.state).toBe(state);
  });
  it("keeps the first mentor review answer and its consequences", () => {
    let state = run(investigate(), {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    state = run(state, { type: "answerReview", answer: "guarantee" });
    const snapshot = structuredClone(state);
    expect(
      applyCommand(state, { type: "answerReview", answer: "guarantee" }).state,
    ).toBe(state);
    const changed = applyCommand(state, {
      type: "answerReview",
      answer: "conditional",
    });
    expect(changed.error).toBeTruthy();
    expect(changed.state).toBe(state);
    expect(state).toEqual(snapshot);
    const resolved = run(state, { type: "advanceTime" });
    expect(resolved.reviewAnswer).toBe("guarantee");
    expect(resolved.project.governance).toBe("breach");
  });
  it("rejects fabricated completion, baseline changes and unavailable provenance", () => {
    const state = investigate();
    const update: Command = {
      type: "updateTask",
      taskId: "delivery",
      status: "done",
      owner: "Morgan",
      dueDay: 1,
      blocker: "",
      evidence: ["supplier"],
    };
    expect(applyCommand(state, update).error).toMatch(/signed delivery/);
    expect(
      applyCommand(state, {
        ...update,
        status: "blocked",
        dueDay: 2,
        blocker: "Truck fault",
      }).error,
    ).toMatch(/baseline/);
    expect(
      applyCommand(state, { ...update, taskId: "foundations" }).error,
    ).toMatch(/PM approval/);
    const noSources = run(createGame(profile), { type: "brief" });
    expect(
      applyCommand(noSources, {
        ...update,
        status: "blocked",
        blocker: "Truck fault",
      }).error,
    ).toMatch(/available source/);
  });
  it("validates issue fields, checkpoint, required provenance and action dependencies", () => {
    const state = investigate();
    expect(
      applyCommand(state, {
        type: "logIssue",
        issue: { ...state.issue!, title: "" },
      }).error,
    ).toMatch(/title/);
    expect(
      applyCommand(state, {
        type: "logIssue",
        issue: { ...state.issue!, dueDay: 2 },
      }).error,
    ).toMatch(/Day 1/);
    const partial = run(state, {
      type: "logIssue",
      issue: { ...state.issue!, evidence: ["supplier"] },
    });
    expect(
      applyCommand(partial, {
        type: "submitRecommendation",
        option: "wait",
        confidence: "estimate",
        impact: "foundation",
        nextCheck: "10:30",
      }).error,
    ).toMatch(/Cite schedule/);
    expect(applyCommand(state, { type: "advanceTime" }).error).toMatch(
      /probing question/,
    );
  });
  it("offers two legitimate responses with different budget and schedule consequences", () => {
    const wait = finish("wait");
    const alternate = finish("alternate");
    expect(wait.project.forecastFinishDay).toBe(13);
    expect(wait.project.actualCost).toBe(400);
    expect(alternate.project.forecastFinishDay).toBe(12);
    expect(alternate.project.actualCost).toBe(2000);
    expect(wait.project.governance).toBe("compliant");
    expect(alternate.project.governance).toBe("compliant");
    expect(wait.project.quality).toBe(100);
    expect(alternate.project.quality).toBe(100);
    expect(
      alternate.events.some((event) => event.type === "approval_verified"),
    ).toBe(true);
    expect(alternate.tasks[0].status).toBe("done");
    expect(alternate.career.role).toBe("Junior PM Intern");
    expect(
      getObjectives(alternate).every((objective) => objective.complete),
    ).toBe(true);
  });
  it("recognises waiting with a crew contingency as a strong follow-up without unrelated safety investigation", () => {
    expect(finish("wait", false).career.competencies.followUp).toBe(3);
  });
  it("does not spend at submission or conditional approval, and records safety checks before spend", () => {
    let state = run(investigate(false), {
      type: "submitRecommendation",
      option: "alternate",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(state.project.actualCost).toBe(0);
    state = run(state, { type: "answerReview", answer: "conditional" });
    expect(state.proposal?.approval).toBe("conditional");
    expect(state.project.actualCost).toBe(0);
    state = run(state, { type: "advanceTime" });
    expect(state.project.actualCost).toBe(2000);
    expect(
      getFeedback(state)?.criteria.find((item) => item.id === "followUp")
        ?.score,
    ).toBe(2);
  });
  it("audits a false promise after temporary sponsor reassurance", () => {
    let state = run(investigate(), {
      type: "submitRecommendation",
      option: "promise",
      confidence: "guaranteed",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(state.project.stakeholderTrust).toBe(68);
    expect(state.project.delivery).toBe("unconfirmed");
    state = run(state, { type: "answerReview", answer: "guarantee" });
    state = run(state, { type: "advanceTime" });
    expect(state.project.stakeholderTrust).toBe(44);
    expect(state.project.forecastFinishDay).toBe(14);
    expect(state.project.governance).toBe("breach");
    expect(getFeedback(state)?.governancePassed).toBe(false);
    expect(state.career.competencies.accuracy).toBe(0);
  });
  it("blocks unauthorised procurement while preserving a recoverable debrief", () => {
    const state = finish("unauthorised");
    expect(state.project.actualCost).toBe(800);
    expect(state.project.explanation).toContain(
      "No alternate cost was committed",
    );
    expect(state.proposal?.approval).toBe("rejected");
    expect(state.career.competencies.authority).toBe(0);
    expect(state.career.competencies.followUp).toBe(2);
    expect(getFeedback(state)?.next).toContain("The Slipping Milestone");
    const practice = replayMission(state);
    expect(practice.phase).toBe("arrival");
    expect(practice.career.xp).toBe(0);
    expect(practice.profile).toEqual(state.profile);
  });
  it("does not approve an issue that knowingly misstates the supplier estimate as guaranteed", () => {
    let state = investigate();
    state = run(state, {
      type: "logIssue",
      issue: { ...state.issue!, uncertainty: "guaranteed" },
    });
    state = run(state, {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    state = run(state, { type: "answerReview", answer: "conditional" });
    state = run(state, { type: "advanceTime" });
    expect(state.project.governance).toBe("breach");
  });
  it("is reproducible, immutable and idempotent after resolution with no reward farming", () => {
    const first = finish();
    expect(finish()).toEqual(first);
    const original = structuredClone(first);
    const repeated = applyCommand(first, { type: "advanceTime" });
    expect(repeated.state).toBe(first);
    expect(first).toEqual(original);
    expect(
      first.events.filter((event) => event.type === "mission_completed"),
    ).toHaveLength(1);
    expect(first.career.completedMissionIds).toEqual(["CONST-I01"]);
    expect(first.minutes).toBe(630);
  });
  it("compares semantic question identity regardless of object-key order", () => {
    const asked = run(run(createGame(profile), { type: "brief" }), {
      type: "ask",
      npc: "supplier",
      choice: "facts",
    });
    const reordered: Command = {
      choice: "facts",
      npc: "supplier",
      type: "ask",
    };
    expect(applyCommand(asked, reordered).state).toBe(asked);
    expect(asked.relationships.Morgan).toBe(63);
  });
  it("does not invent a false promise when the player defers a source-backed decision", () => {
    let state = run(investigate(), {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    state = run(state, { type: "answerReview", answer: "defer" });
    state = run(state, { type: "advanceTime" });
    expect(state.project.governance).toBe("compliant");
    expect(state.project.explanation).not.toContain("Replace the promise");
    expect(state.project.explanation).toContain(
      "without an agreed contingency",
    );
    expect(
      state.events.some((item) => item.type === "governance_audited"),
    ).toBe(false);
    expect(
      getFeedback(state)?.criteria.find((item) => item.id === "followUp")
        ?.detail,
    ).not.toContain("Taylor");
  });
  it("only awards strong impact for an explicit, correct comparison of both costs and forecasts", () => {
    for (const comparison of [
      undefined,
      {
        waitFinishDay: 12,
        waitCost: 0,
        alternateFinishDay: 11,
        alternateCost: 20,
      },
    ]) {
      let state = run(investigate(), {
        type: "submitRecommendation",
        ...(comparison ? { comparison } : {}),
        option: "wait",
        confidence: "estimate",
        impact: "foundation",
        nextCheck: "10:30",
      });
      if (comparison)
        expect(
          state.events.find((item) => item.type === "options_compared")
            ?.summary,
        ).toContain("wait Day 12 / +0");
      else expect(state.proposal).not.toHaveProperty("comparison");
      state = run(state, { type: "answerReview", answer: "conditional" });
      state = run(state, { type: "advanceTime" });
      expect(state.career.competencies.impact).toBe(2);
      expect(
        getFeedback(state)?.criteria.find((item) => item.id === "impact")
          ?.detail,
      ).not.toContain("correctly contrasted");
    }
    expect(finish().career.competencies.impact).toBe(3);
  });
  it("recognises a correct numerical comparison even when dependency tracing needs improvement", () => {
    let state = investigate();
    state = run(state, {
      type: "logIssue",
      issue: { ...state.issue!, impact: "delivery" },
    });
    state = run(state, {
      type: "submitRecommendation",
      comparison: {
        waitFinishDay: 13,
        waitCost: 400,
        alternateFinishDay: 12,
        alternateCost: 2000,
      },
      option: "wait",
      confidence: "estimate",
      impact: "delivery",
      nextCheck: "10:30",
    });
    state = run(state, { type: "answerReview", answer: "conditional" });
    state = run(state, { type: "advanceTime" });
    const impact = getFeedback(state)?.criteria.find(
      (item) => item.id === "impact",
    );
    expect(impact?.score).toBe(1);
    expect(impact?.detail).toContain("quantified both options");
    expect(impact?.detail).not.toContain("did not match");
  });
  it("rejects malformed comparison values without fabricating an artefact", () => {
    const state = investigate();
    const result = applyCommand(state, {
      type: "submitRecommendation",
      comparison: {
        waitFinishDay: 13,
        waitCost: Number.NaN,
        alternateFinishDay: 12,
        alternateCost: 2000,
      },
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(result.error).toContain("all four comparison numbers");
    expect(result.state).toBe(state);
  });
  it("returns four evidence-based rubric criteria with citations to actual actions only", () => {
    const state = finish("alternate");
    const feedback = getFeedback(state)!;
    expect(feedback.criteria).toHaveLength(4);
    expect(feedback.criteria.map((criterion) => criterion.score)).toEqual([
      3, 3, 3, 3,
    ]);
    for (const criterion of feedback.criteria) {
      expect(criterion.citations.length).toBeGreaterThan(0);
      for (const citation of criterion.citations)
        expect(state.events).toContainEqual(citation);
    }
    expect(getFeedback(createGame(profile))).toBeNull();
  });
});
