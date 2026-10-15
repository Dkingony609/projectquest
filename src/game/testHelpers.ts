import { expect } from "vitest";
import { applyCommand, createGame } from "./engine";
import type { Command, GameState, Profile, ProposalOption } from "./types";

export const profile: Profile = {
  name: "Ari",
  industry: "construction",
  appearance: { skin: "#c89168", shirt: "#305f8c", hair: "#2d211a" },
  assistance: "guided",
};
export function run(state: GameState, command: Command): GameState {
  const result = applyCommand(state, command);
  expect(result.error).toBeUndefined();
  return result.state;
}
export function investigate(safety = true): GameState {
  let state = run(createGame(profile), { type: "brief" });
  state = run(state, { type: "inspect", source: "schedule" });
  state = run(state, { type: "ask", npc: "lead", choice: "facts" });
  state = run(state, { type: "ask", npc: "supplier", choice: "facts" });
  if (safety)
    state = run(state, { type: "ask", npc: "safety", choice: "facts" });
  state = run(state, {
    type: "updateTask",
    taskId: "delivery",
    status: "blocked",
    owner: "Morgan",
    dueDay: 1,
    blocker: "Truck fault; no receipt",
    evidence: ["schedule", "supplier"],
  });
  return run(state, {
    type: "logIssue",
    issue: {
      title: "Concrete delivery not confirmed",
      owner: "Sam",
      severity: "high",
      dueDay: 1,
      evidence: ["schedule", "lead", "supplier"],
      impact: "foundation",
      uncertainty: "estimate",
      nextCheck: "10:30",
    },
  });
}
export function finish(
  option: ProposalOption = "wait",
  safety = true,
): GameState {
  let state = investigate(safety);
  state = run(state, {
    type: "submitRecommendation",
    comparison: {
      waitFinishDay: 13,
      waitCost: 400,
      alternateFinishDay: 12,
      alternateCost: 2000,
    },
    option,
    confidence: option === "promise" ? "guaranteed" : "estimate",
    impact: "foundation",
    nextCheck: "10:30",
  });
  state = run(state, {
    type: "answerReview",
    answer: option === "promise" ? "guarantee" : "conditional",
  });
  return run(state, { type: "advanceTime" });
}
