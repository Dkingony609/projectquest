import type { IndustryCard, IndustryPack } from "./types";

/** Authored fictional learning scenario; values are balancing assumptions, not engineering advice. */
export const industries: IndustryCard[] = [
  {
    id: "construction",
    name: "Construction & Infrastructure",
    description:
      "Coordinate people, materials and dependencies at a community-building site.",
    example: "Two-storey community building",
    available: true,
    skills: ["Sequencing", "Site coordination", "Issue management"],
  },
  {
    id: "software",
    name: "Software & Technology",
    description: "Triage releases, quality and technical uncertainty.",
    example: "Appointment booking application",
    available: false,
    skills: ["Backlog", "QA", "Release planning"],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Plan safe adoption and operational readiness.",
    example: "Clinic scheduling-system rollout",
    available: false,
    skills: ["Readiness", "Training", "Approvals"],
  },
  {
    id: "events",
    name: "Events & Entertainment",
    description: "Bring vendors and a live event schedule together.",
    example: "Regional business conference",
    available: false,
    skills: ["Run-of-show", "Contingency", "Vendors"],
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Operations",
    description: "Coordinate installation around a production shutdown.",
    example: "Assembly-line installation",
    available: false,
    skills: ["Capacity", "Procurement", "Commissioning"],
  },
  {
    id: "energy",
    name: "Energy & Sustainability",
    description:
      "Balance permits, equipment lead times and environmental constraints.",
    example: "Community solar installation",
    available: false,
    skills: ["Permits", "Dependencies", "Benefits"],
  },
];

const pack: IndustryPack = {
  id: "construction",
  title: "Riverside Community Build",
  mission: {
    id: "CONST-I01",
    version: 1,
    title: "The Missing Materials",
    setting: "site_office_01",
    roleRequired: "intern",
    prerequisites: [],
    startState: "arrival",
    objectiveIds: [
      "brief",
      "schedule",
      "lead",
      "supplier",
      "board",
      "issue",
      "recommend",
      "review",
      "checkpoint",
    ],
    events: [
      {
        id: "delivery_checkpoint",
        trigger: "advanceTime_after_review",
        minutes: 630,
        priority: 10,
        once: true,
      },
    ],
    allowedActions: [
      "brief",
      "inspect",
      "ask",
      "updateTask",
      "logIssue",
      "submitRecommendation",
      "answerReview",
      "advanceTime",
    ],
    outcomes: [
      "Wait with crew contingency",
      "Authorised alternate with acceptance review",
      "Audited unsupported promise",
      "Blocked unauthorised procurement",
    ],
    recoveryRoutes: [
      "Source-backed reflection and replay of the same assignment",
    ],
    reflections: [
      "What was confirmed before the checkpoint?",
      "How did the delivery dependency change the foundation forecast?",
      "Who could approve additional expenditure?",
    ],
    acceptanceTests: [
      "Three independent sources",
      "Source-backed delivery card",
      "Validated issue owner and checkpoint",
      "Two legitimate response paths",
      "Recoverable governance setback",
      "Four cited rubric criteria",
      "Deterministic save and replay",
    ],
    briefing:
      "The concrete delivery is unconfirmed. Before our coordination meeting, check the schedule, speak to Sam and contact Morgan. Update the delivery card and record an issue with evidence, an owner and a next check. Bring me a recommendation, not an order. You may gather information and escalate; only I can approve procurement.",
    authority: [
      "Inspect project information",
      "Update evidence-backed records",
      "Recommend and escalate to Alex",
    ],
    rubric: ["Accuracy", "Impact", "Authority", "Follow-up"],
    recovery:
      "Review the source-backed debrief and replay the assignment. Poor outcomes do not end your career; promotion still requires evidence across future missions.",
  },
  sources: {
    schedule: {
      id: "schedule",
      title: "Foundation delivery schedule",
      provenance: "Approved baseline · site coordination register · revision 3",
      detail: [
        "Concrete delivery was due at 09:00 on Day 1; no receipt is signed.",
        "Concrete delivery → foundations → framing are finish-to-start dependencies. Foundations have no spare float.",
        "Baseline foundation milestone: Day 12. Waiting with crew contingency forecasts Day 13; an approved alternate forecasts Day 12.",
        "Waiting adds 400 fictional credits in standby costs. An alternate adds 2,000 credits and requires cost and safety approval.",
      ],
    },
    lead: {
      id: "lead",
      title: "Sam’s crew and dependency check",
      provenance: "Sam · delivery lead · coordination conversation",
      detail: [
        "Sam assumed the supplier was on time, but has no signed delivery confirmation.",
        "Two crews cannot start foundation work without the concrete. Framing follows foundations.",
        "If the replacement misses 10:30, resequence preparatory work and notify both crews. Never report delivery complete before receipt.",
      ],
    },
    supplier: {
      id: "supplier",
      title: "Morgan’s delivery estimate",
      provenance: "Morgan · supplier dispatch desk · 09:10 update",
      detail: [
        "The original truck has a mechanical fault. Concrete delivery has not been confirmed.",
        "Replacement arrival around 10:30 has approximately 70% confidence; this is an estimate, not a commitment.",
        "An alternate supplier may be available for an extra 2,000 fictional credits, subject to Alex’s procurement approval and Taylor’s acceptance check.",
      ],
    },
    safety: {
      id: "safety",
      title: "Taylor’s acceptance requirements",
      provenance:
        "Taylor · site safety / quality coordinator · acceptance checklist",
      detail: [
        "An alternate delivery must pass the normal acceptance and safe-access checks.",
        "Only the designated reviewer can release materials for use. An intern cannot waive checks to protect a date.",
        "Taylor can review an approved alternate at the checkpoint; the approval remains conditional until that review passes.",
      ],
    },
  },
  npcs: {
    lead: {
      id: "lead",
      name: "Sam",
      role: "Delivery lead",
      greeting:
        "I thought concrete was on the way. Let’s check what we actually know.",
      facts:
        "Two crews are waiting. No concrete means no foundations, and framing depends on foundations. If it misses 10:30, we can resequence preparatory work.",
      pressure:
        "Asking us to guarantee the date will not move a truck. Check the supplier, and tell us what is confirmed.",
    },
    supplier: {
      id: "supplier",
      name: "Morgan",
      role: "Supplier coordinator",
      greeting:
        "The original truck has broken down. I have an estimate, not a signed commitment.",
      facts:
        "A replacement has a 70% chance of reaching you around 10:30. An alternate costs 2,000 extra credits and needs your PM’s approval. Please check back at 10:30.",
      pressure:
        "I cannot guarantee arrival. A replacement is only an estimate. Please do not tell the team it is confirmed.",
    },
    safety: {
      id: "safety",
      name: "Taylor",
      role: "Safety & quality coordinator",
      greeting:
        "Dates matter. Acceptance checks still apply to every delivery.",
      facts:
        "I can check an approved alternate at 10:30. Alex must approve the extra cost first. You may recommend a review, but cannot waive it.",
      pressure:
        "No. We cannot waive acceptance or safe-access checks to recover a date. Bring the proposal to Alex.",
    },
  },
  options: {
    wait: {
      label: "Wait with a contingency",
      description:
        "Keep the current supplier, notify crews and verify at 10:30. Resequence if delayed: Day 13 forecast, +400 standby credits.",
      forecastDay: 13,
      cost: 400,
    },
    alternate: {
      label: "Request an approved alternate",
      description:
        "Ask Alex to approve +2,000 credits, conditional on Taylor’s acceptance review. Protects Day 12 when approved.",
      forecastDay: 12,
      cost: 2000,
    },
    promise: {
      label: "Promise delivery on time",
      description:
        "Present the unconfirmed estimate as a guarantee. This may reassure the sponsor briefly, but will be audited.",
      forecastDay: 14,
      cost: 1000,
    },
    unauthorised: {
      label: "Attempt to order without approval",
      description:
        "Try to commit an alternate beyond your intern authority. Procurement controls will flag and block it.",
      forecastDay: 14,
      cost: 800,
    },
  },
};

export function getPack(): IndustryPack {
  return structuredClone(pack);
}
