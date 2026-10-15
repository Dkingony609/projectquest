import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createGame,
  getConversationChoice,
  getRecommendationChoice,
} from "./engine";
import { getPack } from "./content";
import { parseSave, serializeSave } from "./save";
import { finish, investigate, profile, run } from "./testHelpers";

describe("versioned and replay-validated local saves", () => {
  it("round-trips arrival, mid-mission and debrief state including appearance and position", () => {
    for (const state of [
      createGame(profile),
      investigate(),
      finish("alternate"),
    ]) {
      state.position = { x: 3.4, z: -2.2, yaw: 1.1 };
      expect(parseSave(serializeSave(state))).toEqual({ state });
    }
  });
  it("persists both human body types while keeping legacy profiles unchanged", () => {
    const legacy = createGame(profile);
    expect(legacy.profile.appearance.body).toBeUndefined();
    expect(parseSave(serializeSave(legacy)).state?.profile).toEqual(profile);
    for (const body of ["male", "female"] as const) {
      const state = createGame({
        ...profile,
        appearance: { ...profile.appearance, body },
      });
      expect(parseSave(serializeSave(state))).toEqual({ state });
      expect(state.profile.appearance.body).toBe(body);
    }
  });
  it("rejects unsupported body types without modifying valid saved progress", () => {
    const state = createGame(profile);
    const save = JSON.parse(serializeSave(state));
    save.snapshot.profile.appearance.body = "unsupported";
    expect(parseSave(JSON.stringify(save)).error).toMatch(/profile/);
    expect(parseSave(serializeSave(state))).toEqual({ state });
  });
  it("resumes mid-mission without duplicate events or XP", () => {
    const state = investigate();
    const restored = parseSave(serializeSave(state)).state!;
    const inspected = applyCommand(restored, {
      type: "inspect",
      source: "schedule",
    });
    expect(inspected.state).toBe(restored);
    expect(restored.events).toHaveLength(state.events.length);
    expect(restored.career.xp).toBe(0);
  });
  it("persists the original conversation approach and factual follow-up without restoring lost trust", () => {
    let state = run(createGame(profile), { type: "brief" });
    state = run(state, { type: "ask", npc: "supplier", choice: "pressure" });
    for (const followedUp of [false, true]) {
      if (followedUp) state = run(state, { type: "followUp", npc: "supplier" });
      const parsed = parseSave(serializeSave(state));
      expect(parsed.error).toBeUndefined();
      expect(parsed.state).toEqual(state);
      const restored = parsed.state!;
      expect(getConversationChoice(restored, "supplier")).toBe("pressure");
      expect(restored.relationships.Morgan).toBe(56);
      expect(restored.evidence.includes("supplier")).toBe(followedUp);
      const switched = applyCommand(restored, {
        type: "ask",
        npc: "supplier",
        choice: "facts",
      });
      expect(switched.error).toBeTruthy();
      expect(switched.state).toBe(restored);
      if (followedUp)
        expect(
          applyCommand(restored, { type: "followUp", npc: "supplier" }).state,
        ).toBe(restored);
    }
  });
  it("persists a recommendation before submission and keeps it after failed submission", () => {
    const chosen = run(investigate(), {
      type: "chooseRecommendation",
      option: "alternate",
    });
    const parsed = parseSave(serializeSave(chosen));
    expect(parsed.error).toBeUndefined();
    expect(parsed.state).toEqual(chosen);
    const restored = parsed.state!;
    expect(getRecommendationChoice(restored)).toBe("alternate");
    expect(restored.proposal).toBeNull();
    const changed = applyCommand(restored, {
      type: "chooseRecommendation",
      option: "wait",
    });
    expect(changed.error).toBeTruthy();
    expect(changed.state).toBe(restored);
    const failed = applyCommand(restored, {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    expect(failed.error).toBeTruthy();
    expect(failed.state).toBe(restored);
    const resumed = parseSave(serializeSave(failed.state)).state!;
    expect(getRecommendationChoice(resumed)).toBe("alternate");
    let state = run(resumed, {
      type: "submitRecommendation",
      option: "alternate",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    state = run(state, { type: "answerReview", answer: "conditional" });
    state = run(state, { type: "advanceTime" });
    expect(parseSave(serializeSave(state))).toEqual({ state });
  });
  it("keeps a submitted recommendation and mentor answer fixed after restoring", () => {
    let state = run(investigate(), {
      type: "chooseRecommendation",
      option: "wait",
    });
    state = run(state, {
      type: "submitRecommendation",
      option: "wait",
      confidence: "estimate",
      impact: "foundation",
      nextCheck: "10:30",
    });
    state = run(state, { type: "answerReview", answer: "conditional" });
    const parsed = parseSave(serializeSave(state));
    expect(parsed.error).toBeUndefined();
    const restored = parsed.state!;
    expect(getRecommendationChoice(restored)).toBe("wait");
    const changed = applyCommand(restored, {
      type: "answerReview",
      answer: "guarantee",
    });
    expect(changed.error).toBeTruthy();
    expect(changed.state).toBe(restored);
    expect(restored.reviewAnswer).toBe("conditional");
    expect(restored.proposal?.approval).toBe("approved");
  });
  it("round-trips legacy saves that submitted a recommendation without a separate choice", () => {
    for (const state of [finish("wait"), finish("alternate")]) {
      expect(
        state.journal.some(
          (command) => command.type === "chooseRecommendation",
        ),
      ).toBe(false);
      const parsed = parseSave(serializeSave(state));
      expect(parsed.error).toBeUndefined();
      expect(parsed.state).toEqual(state);
      expect(getRecommendationChoice(parsed.state!)).toBe(
        state.proposal!.option,
      );
    }
  });
  it("loads a legacy pressure-then-facts journal while retaining the first approach for future commands", () => {
    const oldState = structuredClone(
      run(run(createGame(profile), { type: "brief" }), {
        type: "ask",
        npc: "supplier",
        choice: "pressure",
      }),
    );
    // Before firm choices, asking for facts after pressure added evidence and +3 trust.
    oldState.evidence.push("supplier");
    oldState.relationships.Morgan += 3;
    oldState.events.push({
      seq: oldState.events.length + 1,
      type: "question_asked",
      summary: `Asked Morgan for evidence. ${getPack().npcs.supplier.facts}`,
      day: oldState.day,
      minutes: oldState.minutes,
    });
    oldState.journal.push({ type: "ask", npc: "supplier", choice: "facts" });
    const parsed = parseSave(serializeSave(oldState));
    expect(parsed.error).toBeUndefined();
    expect(parsed.state).toEqual(oldState);
    const restored = parsed.state!;
    expect(getConversationChoice(restored, "supplier")).toBe("pressure");
    expect(restored.relationships.Morgan).toBe(59);
    expect(restored.evidence).toEqual(["supplier"]);
    const switched = applyCommand(restored, {
      type: "ask",
      npc: "supplier",
      choice: "facts",
    });
    expect(switched.error).toBeTruthy();
    expect(switched.state).toBe(restored);
    expect(parseSave(serializeSave(restored))).toEqual({ state: restored });
    let continued = run(restored, {
      type: "ask",
      npc: "lead",
      choice: "pressure",
    });
    continued = run(continued, { type: "followUp", npc: "lead" });
    expect(parseSave(serializeSave(continued))).toEqual({ state: continued });
  });
  it("rejects malformed, incompatible, oversized and invalid-profile inputs clearly", () => {
    expect(parseSave("{bad").error).toMatch(/valid JSON/);
    expect(parseSave("{}").error).toMatch(/not a ProjectQuest/);
    expect(parseSave("x".repeat(1_000_001)).error).toMatch(/too large/);
    const save = JSON.parse(serializeSave(createGame(profile)));
    save.schemaVersion = 99;
    expect(parseSave(JSON.stringify(save)).error).toMatch(/not supported/);
    save.schemaVersion = 1;
    save.snapshot.profile.appearance.skin = "javascript:bad";
    expect(parseSave(JSON.stringify(save)).error).toMatch(/profile/);
  });
  it("rejects edited scores, project metrics, seeds and event history", () => {
    for (const mutate of [
      (snapshot: Record<string, unknown>) => {
        snapshot.seed = 610;
      },
      (snapshot: Record<string, unknown>) => {
        snapshot.events = [];
      },
      (snapshot: Record<string, unknown>) => {
        snapshot.career = { xp: 99999 };
      },
      (snapshot: Record<string, unknown>) => {
        snapshot.project = { actualCost: 0 };
      },
    ]) {
      const save = JSON.parse(serializeSave(finish()));
      mutate(save.snapshot);
      expect(parseSave(JSON.stringify(save)).error).toMatch(/does not match/);
    }
  });
  it("rejects command tampering, invalid position and duplicate action journals", () => {
    const save = JSON.parse(serializeSave(investigate()));
    save.snapshot.journal[1] = { type: "spend", cost: 9999 };
    expect(parseSave(JSON.stringify(save)).error).toMatch(
      /Action 2 is invalid/,
    );
    const duplicate = JSON.parse(serializeSave(investigate()));
    duplicate.snapshot.journal.push({ type: "brief" });
    expect(parseSave(JSON.stringify(duplicate)).error).toMatch(/duplicate/);
    const position = JSON.parse(serializeSave(investigate()));
    position.snapshot.position.x = 1000000;
    expect(parseSave(JSON.stringify(position)).error).toMatch(/position/);
  });
  it("does not depend on JSON object key insertion order", () => {
    const save = JSON.parse(serializeSave(finish()));
    save.snapshot.profile.appearance = {
      hair: "#2d211a",
      skin: "#c89168",
      shirt: "#305f8c",
    };
    expect(parseSave(JSON.stringify(save)).error).toBeUndefined();
  });
});
