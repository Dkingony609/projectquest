import type { Npc, Source, SourceId } from "./types";
import type { ScheduleInput } from "./schedule";
export type ScheduleOption = "wait" | "extra_team" | "bypass" | "original_date";
export const DAY2 = {
  id: "CONST-I02" as const,
  title: "The Slipping Milestone",
  briefing:
    "Yesterday’s outcome is part of this project. Today a setting-out survey is taking longer than planned. Find the work it blocks, verify the remaining duration with Sam and the acceptance gates with Taylor, then record a source-backed schedule and recommendation. I retain approval of cost and baseline changes.",
  checkpoint: "11:00",
  tasks: [
    {
      id: "setting_out",
      title: "Setting-out survey",
      durationDays: 1,
      dependencies: [],
      owner: "Sam",
      acceptance: "Survey control points checked and released",
    },
    {
      id: "safety_inspection",
      title: "Safety inspection",
      durationDays: 1,
      dependencies: ["setting_out"],
      owner: "Sam",
      acceptance: "Taylor signs safe access and inspection",
    },
    {
      id: "formwork_preparation",
      title: "Off-site formwork preparation",
      durationDays: 2,
      dependencies: ["setting_out"],
      owner: "Sam",
      acceptance: "Forms assembled off-site against released survey data",
    },
    {
      id: "foundation_pour",
      title: "Foundation pour",
      durationDays: 1,
      dependencies: ["safety_inspection", "formwork_preparation"],
      owner: "Sam",
      acceptance: "Both predecessors accepted; pour slot approved",
    },
  ],
  sources: {
    schedule: {
      id: "schedule",
      title: "Two-successor dependency schedule",
      provenance: "Approved coordination plan · revision 4",
      detail: [
        "The setting-out survey was planned for 1 working day. Sam must verify the remaining duration.",
        "Survey release gates BOTH the safety inspection and off-site formwork preparation. Neither can be treated as independent of the survey.",
        "The foundation pour requires BOTH inspection sign-off and finished formwork preparation. Off-site preparation is separate from the inspection zone.",
        "Baseline durations: survey 1, inspection 1, off-site formwork 2, pour 1. The baseline chain is 4 working days. Extra survey-team support would cost 1,200 fictional credits, subject to approval.",
      ],
    },
    lead: {
      id: "lead",
      title: "Sam’s verified survey and crew update",
      provenance: "Sam · delivery lead · Day 2 work-package review",
      detail: [
        "Survey checks need 2 working days, not the 1 day in the baseline. The setting-out work is not complete.",
        "Its release is needed by BOTH the safety inspector and the off-site formwork team; the longer formwork branch then gates the pour.",
        "I will own the follow-up at 11:00. A second survey team can recover 1 day if Alex approves 1,200 credits and we verify capacity.",
      ],
    },
    safety: {
      id: "safety",
      title: "Taylor’s acceptance and dependency gates",
      provenance: "Taylor · safety/quality coordinator · release checklist",
      detail: [
        "Inspection uses the released survey points. It cannot be removed to protect a milestone.",
        "The pour needs inspection acceptance AND completed off-site formwork. Preparing forms off-site does not waive the site inspection.",
        "At 11:00 I can verify acceptance gates and Sam can verify survey-team capacity. Only Alex can approve the added cost.",
      ],
    },
    supplier: {
      id: "supplier",
      title: "Morgan’s survey support availability",
      provenance: "Morgan · coordination desk · capacity estimate",
      detail: [
        "A second survey crew has provisionally reserved capacity for this project.",
        "The provisional reservation is not an approved order. Alex must authorise 1,200 credits; Sam verifies the slot at 11:00.",
      ],
    },
  } satisfies Record<SourceId, Source>,
  npcs: {
    lead: {
      id: "lead",
      name: "Sam",
      role: "Delivery lead",
      greeting:
        "The survey looks small on the board, but two teams are waiting for its release.",
      facts:
        "I verified 2 working days remain for setting-out. It blocks the safety inspection AND off-site formwork preparation. Both branches gate the pour. I own the 11:00 follow-up.",
      pressure:
        "A fixed deadline does not shorten the verified survey. We still need 2 days unless Alex approves a second team.",
    },
    safety: {
      id: "safety",
      name: "Taylor",
      role: "Safety & quality coordinator",
      greeting:
        "Trace the dependencies before you move a date. Every acceptance gate still applies.",
      facts:
        "Survey release comes before inspection and off-site formwork. The pour requires both accepted predecessors. I can check the gates at 11:00; approval stays with Alex.",
      pressure:
        "I cannot remove inspection or approve an unsafe overlap. Record the full dependency chain and escalate honestly.",
    },
    supplier: {
      id: "supplier",
      name: "Morgan",
      role: "Coordination desk",
      greeting:
        "I have a provisional extra survey-team slot, subject to approval.",
      facts:
        "Extra support can recover 1 day for 1,200 credits if Alex approves and Sam verifies the crew slot at 11:00.",
      pressure:
        "Provisional capacity is not permission to place an order. Ask Alex and keep the commitment conditional.",
    },
  } satisfies Record<string, Npc>,
  options: {
    wait: {
      label: "Accept the revised sequence",
      description:
        "Keep the verified two-day survey, notify both waiting teams and retain every acceptance gate. One additional working day; no extra spend.",
    },
    extra_team: {
      label: "Request a second survey team",
      description:
        "Ask Alex to authorise 1,200 credits, conditional on capacity and acceptance checks. Recover the additional day without removing dependencies.",
    },
    bypass: {
      label: "Propose skipping the inspection",
      description:
        "Try to protect the date by removing an acceptance gate. Taylor retains authority over the safety release.",
    },
    original_date: {
      label: "Promise the original forecast",
      description:
        "Keep the original date in your message despite the verified longer survey and its dependent teams.",
    },
  } satisfies Record<ScheduleOption, { label: string; description: string }>,
};
export const baselineSchedule = (): ScheduleInput[] =>
  DAY2.tasks.map(({ id, durationDays, dependencies }) => ({
    id,
    durationDays,
    dependencies: [...dependencies],
  }));
