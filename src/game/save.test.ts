import { describe, expect, it } from "vitest";
import { applyCommand, createGame } from "./engine";
import { parseSave, serializeSave } from "./save";
import { finish, investigate, profile } from "./testHelpers";

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
