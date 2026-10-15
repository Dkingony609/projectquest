import type {
  Command,
  Issue,
  OptionComparison,
  Profile,
  SourceId,
} from "./types";

export const sourceIds: SourceId[] = ["schedule", "lead", "supplier", "safety"];
const owners = ["Sam", "Morgan", "Alex"];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const oneOf = (value: unknown, values: readonly string[]) =>
  typeof value === "string" && values.includes(value);
const text = (value: unknown, min = 1, max = 200) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.length <= max;
const boundedDay = (value: unknown) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 30;
const sources = (value: unknown) =>
  Array.isArray(value) &&
  value.length <= 4 &&
  value.every((item) => oneOf(item, sourceIds)) &&
  new Set(value).size === value.length;

export function isProfile(value: unknown): value is Profile {
  if (!isRecord(value) || !isRecord(value.appearance)) return false;
  const color = (item: unknown) =>
    typeof item === "string" && /^#[0-9a-f]{6}$/i.test(item);
  return (
    text(value.name, 1, 32) &&
    value.industry === "construction" &&
    oneOf(value.assistance, ["guided", "standard"]) &&
    color(value.appearance.skin) &&
    color(value.appearance.shirt) &&
    color(value.appearance.hair)
  );
}
export function isIssue(value: unknown): value is Issue {
  return (
    isRecord(value) &&
    text(value.title, 5, 160) &&
    oneOf(value.owner, owners) &&
    oneOf(value.severity, ["low", "medium", "high"]) &&
    boundedDay(value.dueDay) &&
    sources(value.evidence) &&
    oneOf(value.impact, ["foundation", "delivery"]) &&
    oneOf(value.uncertainty, ["estimate", "guaranteed"]) &&
    value.nextCheck === "10:30"
  );
}
export function isComparison(value: unknown): value is OptionComparison {
  if (!isRecord(value)) return false;
  const validCost = (cost: unknown) =>
    typeof cost === "number" &&
    Number.isFinite(cost) &&
    cost >= 0 &&
    cost <= 100000;
  return (
    boundedDay(value.waitFinishDay) &&
    boundedDay(value.alternateFinishDay) &&
    validCost(value.waitCost) &&
    validCost(value.alternateCost)
  );
}
export function isCommand(value: unknown): value is Command {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case "brief":
    case "advanceTime":
      return true;
    case "inspect":
      return oneOf(value.source, sourceIds);
    case "ask":
      return (
        oneOf(value.npc, ["lead", "supplier", "safety"]) &&
        oneOf(value.choice, ["facts", "pressure"])
      );
    case "updateTask":
      return (
        text(value.taskId, 1, 30) &&
        oneOf(value.status, ["blocked", "in_progress", "done"]) &&
        oneOf(value.owner, owners) &&
        boundedDay(value.dueDay) &&
        typeof value.blocker === "string" &&
        value.blocker.length <= 200 &&
        sources(value.evidence)
      );
    case "logIssue":
      return isIssue(value.issue);
    case "submitRecommendation":
      return (
        oneOf(value.option, ["wait", "alternate", "promise", "unauthorised"]) &&
        oneOf(value.confidence, ["estimate", "guaranteed"]) &&
        oneOf(value.impact, ["foundation", "delivery"]) &&
        value.nextCheck === "10:30" &&
        (value.comparison === undefined || isComparison(value.comparison))
      );
    case "answerReview":
      return oneOf(value.answer, ["conditional", "guarantee", "defer"]);
    default:
      return false;
  }
}
export function commandError(value: unknown): string {
  if (isRecord(value) && value.type === "logIssue" && isRecord(value.issue)) {
    const issue = value.issue;
    if (!text(issue.title, 5, 160))
      return "Give the issue a descriptive title of 5–160 characters.";
    if (!oneOf(issue.owner, owners))
      return "Assign an issue owner: Sam, Morgan or Alex.";
    if (!oneOf(issue.severity, ["low", "medium", "high"]))
      return "Choose the issue severity: low, medium or high.";
    if (!boundedDay(issue.dueDay))
      return "Set a valid follow-up day between 1 and 30.";
    if (!sources(issue.evidence))
      return "Choose known, distinct evidence sources.";
    if (!oneOf(issue.impact, ["foundation", "delivery"]))
      return "Identify the affected delivery or foundation milestone.";
    if (!oneOf(issue.uncertainty, ["estimate", "guaranteed"]))
      return "State whether the delivery is an estimate or guaranteed.";
    if (issue.nextCheck !== "10:30")
      return "Set the next verification checkpoint to 10:30.";
  }
  if (isRecord(value) && value.type === "submitRecommendation") {
    if (!oneOf(value.option, ["wait", "alternate", "promise", "unauthorised"]))
      return "Choose a response option to recommend.";
    if (!oneOf(value.confidence, ["estimate", "guaranteed"]))
      return "Choose confidence wording for the recommendation.";
    if (!oneOf(value.impact, ["foundation", "delivery"]))
      return "Choose the affected milestone for the recommendation.";
    if (value.nextCheck !== "10:30")
      return "Set the recommendation checkpoint to 10:30.";
    if (value.comparison !== undefined && !isComparison(value.comparison))
      return "Enter all four comparison numbers: forecast days 1–30 and extra costs 0–100,000 credits.";
  }
  return "Check required fields: a known owner, valid evidence, Day 1–30 and a 10:30 checkpoint are required.";
}
export { isRecord };
