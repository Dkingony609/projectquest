import { createGame, replaySavedCommand } from "./engine";
import { isCommand, isProfile, isRecord } from "./validation";
import type { GameState, Position } from "./types";

export const STORAGE_KEY = "projectquest.save.v1";
const FORMAT = "projectquest.save";
const MAX_SAVE_LENGTH = 1_000_000;

export function serializeSave(state: GameState): string {
  return JSON.stringify({ format: FORMAT, schemaVersion: 1, snapshot: state });
}

function validPosition(value: unknown): value is Position {
  if (!isRecord(value)) return false;
  return (
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    Math.abs(value.x) <= 100 &&
    typeof value.z === "number" &&
    Number.isFinite(value.z) &&
    Math.abs(value.z) <= 100 &&
    typeof value.yaw === "number" &&
    Number.isFinite(value.yaw) &&
    Math.abs(value.yaw) <= 10_000
  );
}

/** Object-key order has no semantic meaning in a JSON snapshot. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isRecord(value))
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

/** Saves are locally owned snapshots, but every canonical project value is replay-validated. */
export function parseSave(input: string): {
  state: GameState | null;
  error?: string;
} {
  if (input.length > MAX_SAVE_LENGTH)
    return {
      state: null,
      error: "This save is too large. Choose a ProjectQuest save under 1 MB.",
    };
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return {
      state: null,
      error:
        "This file is not valid JSON. Your existing game has not been changed.",
    };
  }
  if (!isRecord(parsed) || parsed.format !== FORMAT)
    return { state: null, error: "This is not a ProjectQuest save file." };
  if (parsed.schemaVersion !== 1)
    return {
      state: null,
      error:
        "This save version is not supported. Keep the file for a future migration.",
    };
  const snapshot = parsed.snapshot;
  if (
    !isRecord(snapshot) ||
    snapshot.version !== 1 ||
    snapshot.missionId !== "CONST-I01"
  )
    return {
      state: null,
      error: "The mission snapshot is missing or incompatible.",
    };
  if (!isProfile(snapshot.profile) || !validPosition(snapshot.position))
    return { state: null, error: "The player profile or position is invalid." };
  if (!Array.isArray(snapshot.journal) || snapshot.journal.length > 300)
    return {
      state: null,
      error: "The action journal is missing or too large.",
    };
  let restored = createGame(snapshot.profile);
  // An imported legacy journal may acquire new commands after resuming. Preserve
  // its prefix; enforce firm choices once the first new-style action appears.
  const firstFirmChoice = snapshot.journal.findIndex(
    (command) =>
      isRecord(command) &&
      (command.type === "followUp" || command.type === "chooseRecommendation"),
  );
  for (let index = 0; index < snapshot.journal.length; index += 1) {
    const command: unknown = snapshot.journal[index];
    if (!isCommand(command))
      return {
        state: null,
        error: `Action ${index + 1} is invalid. The save has not been loaded.`,
      };
    const result = replaySavedCommand(
      restored,
      command,
      firstFirmChoice === -1 || index < firstFirmChoice,
    );
    if (result.error || result.state === restored)
      return {
        state: null,
        error: `Action ${index + 1} cannot be replayed: ${result.error ?? "duplicate or out-of-order action"}.`,
      };
    restored = result.state;
  }
  restored.position = {
    x: snapshot.position.x,
    z: snapshot.position.z,
    yaw: snapshot.position.yaw,
  };
  if (canonical(restored) !== canonical(snapshot))
    return {
      state: null,
      error:
        "The saved project does not match its action journal. Scores, outcomes or mission data may be damaged or edited.",
    };
  return { state: restored };
}
