import { getPack } from "./content";
import {
  applyDay2Command,
  beginDay2,
  day2ConversationChoice,
  getDay2Feedback,
  getDay2Objectives,
} from "./day2";
import { commandError, isCommand, isProfile } from "./validation";
import type {
  Command,
  CommandResult,
  Feedback,
  GameState,
  NpcId,
  Objective,
  OptionComparison,
  Profile,
  ProposalOption,
  RubricFeedback,
  Scores,
  SourceId,
} from "./types";

const requiredSources: SourceId[] = ["schedule", "lead", "supplier"];
const correctComparison = (value: OptionComparison | undefined) =>
  value?.waitFinishDay === 13 &&
  value.waitCost === 400 &&
  value.alternateFinishDay === 12 &&
  value.alternateCost === 2000;
const fullEvidence = (state: GameState) =>
  requiredSources.every((source) => state.evidence.includes(source));
const factSources = (state: GameState, evidence: SourceId[]) =>
  evidence.length > 0 &&
  evidence.every((source) => state.evidence.includes(source));
const alreadyAsked = (
  state: GameState,
  command: Extract<Command, { type: "ask" }>,
) =>
  state.journal.some(
    (item) =>
      item.type === "ask" &&
      item.npc === command.npc &&
      item.choice === command.choice,
  );

/** Decision identity comes from the journal, so closing a panel or reloading cannot reset it. */
export function getConversationChoice(
  state: GameState,
  npc: NpcId,
): "facts" | "pressure" | null {
  if (state.missionId === "CONST-I02")
    return day2ConversationChoice(state, npc);
  const first = state.journal.find(
    (item) => item.type === "ask" && item.npc === npc,
  );
  return first?.type === "ask" ? first.choice : null;
}

export function getRecommendationChoice(
  state: GameState,
): ProposalOption | null {
  const first = state.journal.find(
    (item) =>
      item.type === "chooseRecommendation" ||
      item.type === "submitRecommendation",
  );
  return first?.type === "chooseRecommendation" ||
    first?.type === "submitRecommendation"
    ? first.option
    : null;
}

/** Share readiness with the cards: an unready action never creates a commitment. */
export function getRecommendationError(state: GameState): string | undefined {
  if (state.phase === "arrival") return "Meet Alex for your assignment first.";
  if (state.phase !== "investigating")
    return "A recommendation is already under review.";
  if (!fullEvidence(state))
    return "Check all three independent sources: the schedule, Sam and Morgan.";
  if (!state.issue)
    return "Record an issue with evidence, owner and a checkpoint first.";
  if (state.tasks[0].evidence.length === 0)
    return "Update the delivery card with a source-backed status first.";
  if (
    !requiredSources.every((source) => state.issue?.evidence.includes(source))
  )
    return "Cite schedule, Sam and Morgan in the issue so the reviewer can trace your recommendation.";
}

export function createGame(profile: Profile): GameState {
  if (!isProfile(profile))
    throw new Error(
      "Enter a name, choose construction and use valid avatar colours.",
    );
  return {
    version: 1,
    profile: {
      name: profile.name.trim(),
      industry: "construction",
      appearance: {
        ...(profile.appearance.body ? { body: profile.appearance.body } : {}),
        skin: profile.appearance.skin,
        shirt: profile.appearance.shirt,
        hair: profile.appearance.hair,
      },
      assistance: profile.assistance,
    },
    position: { x: -2.1, z: 4.6, yaw: Math.PI },
    missionId: "CONST-I01",
    seed: 609,
    phase: "arrival",
    day: 1,
    minutes: 540,
    evidence: [],
    issue: null,
    proposal: null,
    reviewAnswer: null,
    tasks: [
      {
        id: "delivery",
        title: "Concrete delivery",
        owner: "Morgan",
        status: "in_progress",
        dueDay: 1,
        blocker: "",
        evidence: [],
        dependencies: [],
        acceptance: "Signed material receipt and acceptance review",
      },
      {
        id: "foundations",
        title: "Foundation works",
        owner: "Sam",
        status: "not_started",
        dueDay: 12,
        blocker: "Awaiting accepted concrete",
        evidence: [],
        dependencies: ["delivery"],
        acceptance: "Foundation inspection signed off",
      },
      {
        id: "framing",
        title: "Structural framing",
        owner: "Sam",
        status: "not_started",
        dueDay: 18,
        blocker: "Foundations predecessor",
        evidence: [],
        dependencies: ["foundations"],
        acceptance: "Structural acceptance signed off",
      },
    ],
    project: {
      name: getPack().title,
      baselineFinishDay: 12,
      forecastFinishDay: 12,
      budgetBaseline: 120000,
      forecastCost: 120000,
      actualCost: 0,
      quality: 100,
      wellbeing: 75,
      stakeholderTrust: 60,
      riskExposure: 35,
      governance: "compliant",
      delivery: "unconfirmed",
      explanation:
        "The Day 12 baseline is unchanged; delivery is not confirmed. Investigate before recommending a forecast.",
    },
    career: {
      role: "Junior PM Intern",
      xp: 0,
      reputation: 60,
      competencies: { accuracy: 0, impact: 0, authority: 0, followUp: 0 },
      achievements: [],
      completedMissionIds: [],
      nextAssignment: null,
    },
    relationships: { Alex: 60, Sam: 60, Morgan: 60, Taylor: 60 },
    events: [],
    journal: [],
  };
}

function event(state: GameState, type: string, summary: string): void {
  state.events.push({
    seq: state.events.length + 1,
    type,
    summary,
    day: state.day,
    minutes: state.minutes,
  });
}
function fail(state: GameState, error: string): CommandResult {
  return { state, error };
}
function unchanged(state: GameState, notice: string): CommandResult {
  return { state, notice };
}

/** Pure, deterministic command boundary: UI never mutates project metrics directly. */
export function applyCommand(
  state: GameState,
  command: Command,
): CommandResult {
  return reduceCommand(state, command, false);
}

/** A fresh Day 2 practice run restores the actual Day 1 checkpoint; rewards never stack. */
export function replayMission(state: GameState): GameState {
  if (state.missionId !== "CONST-I02") return createGame(state.profile);
  const transition = state.journal.findIndex(
    (command) => command.type === "startNextMission",
  );
  if (transition < 0)
    throw new Error("The Day 1 checkpoint is missing from this campaign.");
  let restored = createGame(state.profile);
  const firm = state.journal.findIndex(
    (command) =>
      command.type === "followUp" || command.type === "chooseRecommendation",
  );
  for (let index = 0; index < transition; index++) {
    const result = replaySavedCommand(
      restored,
      state.journal[index],
      firm < 0 || index < firm,
    );
    if (result.error)
      throw new Error("The earlier checkpoint cannot be replayed.");
    restored = result.state;
  }
  const restarted = beginDay2(restored);
  if (restarted.error) throw new Error(restarted.error);
  return restarted.state;
}

/** @internal Replay pre-commitment schema-1 conversations without changing their saved consequences. */
export function replaySavedCommand(
  state: GameState,
  command: Command,
  legacyConversations: boolean,
): CommandResult {
  return reduceCommand(state, command, legacyConversations);
}

function reduceCommand(
  state: GameState,
  command: Command,
  legacyConversations: boolean,
): CommandResult {
  if (!isCommand(command)) return fail(state, commandError(command));
  if (command.type === "startNextMission") return beginDay2(state);
  if (state.missionId === "CONST-I02") return applyDay2Command(state, command);
  if (
    [
      "saveSchedulePlan",
      "chooseScheduleRecommendation",
      "submitScheduleRecommendation",
    ].includes(command.type)
  )
    return fail(
      state,
      "The dependency planning tools unlock in Day 2 after completing your first assignment.",
    );
  if (state.phase === "debrief")
    return unchanged(
      state,
      "This assignment is complete. Review feedback or replay it.",
    );
  if (command.type !== "brief" && state.phase === "arrival")
    return fail(state, "Meet Alex for your assignment first.");
  const next = structuredClone(state);
  let notice = "";
  switch (command.type) {
    case "brief": {
      if (state.phase !== "arrival")
        return unchanged(state, "Your assignment is already in the journal.");
      next.phase = "investigating";
      event(next, "mission_started", getPack().mission.briefing);
      notice = "Assignment received. Check the schedule, Sam and Morgan.";
      break;
    }
    case "inspect": {
      if (state.phase !== "investigating")
        return fail(
          state,
          "Finish the mentor review before inspecting another source.",
        );
      if (command.source !== "schedule")
        return fail(
          state,
          "Speak to the source owner to gather this evidence.",
        );
      if (state.evidence.includes(command.source))
        return unchanged(state, "This source is already recorded.");
      next.evidence.push(command.source);
      event(
        next,
        "evidence_inspected",
        `Inspected ${getPack().sources[command.source].title}: delivery → foundations → framing; baseline Day 12, wait Day 13 (+400), alternate Day 12 (+2,000).`,
      );
      notice =
        "Schedule evidence recorded. Foundations and framing depend on delivery.";
      break;
    }
    case "ask": {
      if (state.phase !== "investigating")
        return fail(
          state,
          "The mentor review is underway; answer Alex’s question next.",
        );
      const committedChoice = getConversationChoice(state, command.npc);
      if (
        !legacyConversations &&
        committedChoice &&
        committedChoice !== command.choice
      )
        return fail(
          state,
          "Your conversation choice is committed. Follow up for documented evidence without changing your original decision.",
        );
      if (alreadyAsked(state, command))
        return unchanged(state, "You have already asked this question.");
      const npc = getPack().npcs[command.npc];
      const key =
        npc.name === "Sam"
          ? "Sam"
          : npc.name === "Morgan"
            ? "Morgan"
            : "Taylor";
      if (command.choice === "facts") {
        if (!next.evidence.includes(command.npc))
          next.evidence.push(command.npc);
        next.relationships[key] = Math.min(100, next.relationships[key] + 3);
        event(
          next,
          "question_asked",
          `Asked ${npc.name} for evidence. ${npc.facts}`,
        );
        notice = npc.facts;
      } else {
        next.relationships[key] = Math.max(0, next.relationships[key] - 4);
        event(
          next,
          "question_asked",
          `Pressed ${npc.name} for an unsupported shortcut. ${npc.pressure}`,
        );
        notice = npc.pressure;
      }
      break;
    }
    case "followUp": {
      if (state.phase !== "investigating")
        return fail(
          state,
          "Evidence follow-up is available during investigation.",
        );
      if (getConversationChoice(state, command.npc) !== "pressure")
        return fail(
          state,
          "A follow-up is available after pressing this person for an unsupported shortcut.",
        );
      if (state.evidence.includes(command.npc))
        return unchanged(state, "The follow-up evidence is already recorded.");
      const npc = getPack().npcs[command.npc];
      next.evidence.push(command.npc);
      event(
        next,
        "evidence_followed_up",
        `Acknowledged the uncertainty and requested documented evidence from ${npc.name}. ${npc.facts} The original pressure and relationship consequence remain recorded.`,
      );
      notice = `${npc.facts} Evidence recovered; your original conversation choice and its relationship consequence remain.`;
      break;
    }
    case "updateTask": {
      if (state.phase !== "investigating")
        return fail(state, "Task edits are available during investigation.");
      if (command.taskId !== "delivery")
        return fail(
          state,
          "Your assignment covers the delivery record. Foundation and framing baselines require PM approval.",
        );
      if (!factSources(state, command.evidence))
        return fail(
          state,
          "Inspect and cite at least one available source before updating the card.",
        );
      if (command.status === "done")
        return fail(
          state,
          "No signed delivery receipt exists. You cannot mark physical delivery complete from a supplier estimate.",
        );
      if (command.status === "blocked" && command.blocker.trim().length < 5)
        return fail(state, "Describe the blocker in at least five characters.");
      if (command.dueDay !== 1)
        return fail(
          state,
          "Delivery was due on Day 1. Report the delay; changing the baseline is outside your authority.",
        );
      const updated = {
        ...next.tasks[0],
        status: command.status,
        owner: command.owner,
        dueDay: command.dueDay,
        blocker: command.blocker.trim(),
        evidence: [...command.evidence],
      };
      if (JSON.stringify(updated) === JSON.stringify(state.tasks[0]))
        return unchanged(state, "The delivery card is already up to date.");
      next.tasks[0] = updated;
      event(
        next,
        "artefact_updated",
        `Updated concrete delivery to ${command.status}; owner ${command.owner}, due Day ${command.dueDay}, blocker “${command.blocker.trim()}”, sources ${command.evidence.join(", ")}.`,
      );
      notice =
        "Delivery card updated. This records status; it does not move the truck.";
      break;
    }
    case "logIssue": {
      if (state.phase !== "investigating")
        return fail(state, "Issue edits are available during investigation.");
      if (!factSources(state, command.issue.evidence))
        return fail(
          state,
          "Choose inspected evidence for this issue; sources must be gathered first.",
        );
      if (command.issue.dueDay !== 1)
        return fail(
          state,
          "This urgent delivery issue needs a Day 1 follow-up.",
        );
      const issue = structuredClone(command.issue);
      issue.title = issue.title.trim();
      if (JSON.stringify(issue) === JSON.stringify(state.issue))
        return unchanged(state, "This issue is already recorded.");
      next.issue = issue;
      event(
        next,
        "issue_logged",
        `Recorded “${issue.title}”: ${issue.severity} severity, ${issue.impact} impact, owner ${issue.owner}, Day ${issue.dueDay} check ${issue.nextCheck}, ${issue.uncertainty}; sources ${issue.evidence.join(", ")}.`,
      );
      notice =
        "Issue saved with source provenance. Bring your recommendation to Alex.";
      break;
    }
    case "chooseRecommendation": {
      const readinessError = getRecommendationError(state);
      if (readinessError) return fail(state, readinessError);
      const chosen = getRecommendationChoice(state);
      if (chosen === command.option)
        return unchanged(
          state,
          "This recommendation choice is already committed.",
        );
      if (chosen)
        return fail(
          state,
          "Your recommendation choice is committed. Complete the supporting fields for the selected response.",
        );
      event(
        next,
        "recommendation_chosen",
        `Committed to ${getPack().options[command.option].label}. Supporting wording can be completed before submission; Alex still owns approval.`,
      );
      notice =
        "Response committed. Complete the supporting fields and submit it to Alex for review.";
      break;
    }
    case "submitRecommendation": {
      const readinessError = getRecommendationError(state);
      if (readinessError) return fail(state, readinessError);
      const chosen = getRecommendationChoice(state);
      if (chosen && chosen !== command.option)
        return fail(
          state,
          "Submit the response you committed to; alternative recommendations are locked.",
        );
      next.proposal = {
        ...(command.comparison
          ? { comparison: structuredClone(command.comparison) }
          : {}),
        option: command.option,
        confidence: command.confidence,
        impact: command.impact,
        nextCheck: command.nextCheck,
        approval: "pending",
      };
      next.phase = "review";
      if (command.option === "promise") {
        next.project.stakeholderTrust += 8;
        next.project.explanation =
          "The sponsor is briefly reassured by your promise. Dispatch still has not confirmed delivery; an audit will compare the claim to facts.";
      }
      if (command.comparison)
        event(
          next,
          "options_compared",
          `Recorded alternative comparison: wait Day ${command.comparison.waitFinishDay} / +${command.comparison.waitCost} credits; alternate Day ${command.comparison.alternateFinishDay} / +${command.comparison.alternateCost} credits.`,
        );
      event(
        next,
        "proposal_submitted",
        `Recommended ${getPack().options[command.option].label} to Alex; ${command.confidence}, ${command.impact} impact, verify at ${command.nextCheck}.`,
      );
      notice =
        "Alex asks: “What is confirmed, what is uncertain, and who can authorise the next step?”";
      break;
    }
    case "answerReview": {
      if (state.phase !== "review" || !state.proposal)
        return fail(state, "Submit a recommendation before the mentor review.");
      if (state.reviewAnswer && state.reviewAnswer !== command.answer)
        return fail(
          state,
          "Your mentor review answer is committed. Advance to the delivery checkpoint.",
        );
      if (state.reviewAnswer)
        return unchanged(
          state,
          "Your review answer is recorded. Advance to the delivery checkpoint.",
        );
      next.reviewAnswer = command.answer;
      const sound =
        command.answer === "conditional" &&
        state.issue?.uncertainty === "estimate" &&
        state.proposal.confidence === "estimate" &&
        state.proposal.option !== "promise" &&
        state.proposal.option !== "unauthorised";
      event(
        next,
        "review_answered",
        command.answer === "conditional"
          ? "Explained that Morgan’s 70% estimate is not confirmation; Alex owns procurement approval and the 10:30 check will verify delivery."
          : command.answer === "guarantee"
            ? "Told Alex delivery is guaranteed despite Morgan’s estimate."
            : "Deferred a clear confidence statement to the mentor without explaining the uncertainty.",
      );
      if (sound && next.proposal) {
        next.proposal.approval =
          state.proposal.option === "alternate" ? "conditional" : "approved";
        event(
          next,
          "approval_requested",
          state.proposal.option === "alternate"
            ? "Alex approved the +2,000-credit alternate conditionally: Sam must coordinate access and Taylor must pass acceptance checks before procurement releases it."
            : "Alex approved waiting with crew contingency and a 10:30 verification; no alternate expenditure is committed.",
        );
        notice =
          "Recommendation accepted with explicit conditions. Advance to the 10:30 checkpoint.";
      } else if (next.proposal) {
        next.proposal.approval = "rejected";
        event(
          next,
          "approval_rejected",
          "Alex challenged the unsupported assurance or authority breach. Procurement remains blocked; the checkpoint will reveal and audit the consequence.",
        );
        notice =
          "Alex challenges the recommendation. Advance to the checkpoint to see the consequences and recovery feedback.";
      }
      break;
    }
    case "advanceTime": {
      if (state.phase !== "review" || !state.reviewAnswer || !state.proposal)
        return fail(
          state,
          "Answer Alex’s probing question before advancing time.",
        );
      next.minutes = 630;
      resolveCheckpoint(next);
      next.phase = "debrief";
      const scores = scoreRubric(next);
      next.career.competencies = scores;
      const earned =
        40 + Object.values(scores).reduce((sum, value) => sum + value * 5, 0);
      next.career.xp += earned;
      next.career.reputation = next.project.stakeholderTrust;
      next.career.completedMissionIds.push("CONST-I01");
      next.career.nextAssignment =
        "Case study recorded: review it or replay a different response. Day 2 campaign content is in development.";
      if (fullEvidence(next)) next.career.achievements.push("Source Checker");
      if (scores.authority >= 2 && scores.followUp >= 2)
        next.career.achievements.push("Early Escalator");
      if (scores.authority === 3 && scores.followUp === 3)
        next.career.achievements.push("Recovery Planner");
      event(
        next,
        "mission_completed",
        `Completed CONST-I01; earned ${earned} XP. Role remains Junior PM Intern; promotion requires further mission evidence and a challenge.`,
      );
      notice =
        "Checkpoint resolved. Review the causal debrief and save your career evidence.";
      break;
    }
  }
  next.journal.push(structuredClone(command));
  return { state: next, notice };
}

function resolveCheckpoint(state: GameState): void {
  const proposal = state.proposal;
  if (!proposal) return;
  const roll = ((state.seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const replacementArrives = roll < 0.7;
  const sound =
    state.issue?.uncertainty === "estimate" &&
    proposal.confidence === "estimate" &&
    state.reviewAnswer === "conditional";
  if (proposal.option === "wait" && sound) {
    state.project.forecastFinishDay = replacementArrives ? 13 : 14;
    state.project.forecastCost += replacementArrives ? 400 : 800;
    state.project.actualCost += replacementArrives ? 400 : 800;
    state.project.stakeholderTrust += 5;
    state.project.wellbeing += 3;
    state.project.riskExposure = replacementArrives ? 15 : 25;
    state.project.delivery = replacementArrives ? "confirmed" : "late";
    state.tasks[0].status = replacementArrives ? "done" : "blocked";
    state.project.explanation = replacementArrives
      ? "Replacement arrived and passed acceptance at 10:30, after the morning pour slot. The crew contingency limited the foundation forecast to Day 13; standby cost +400."
      : "Replacement missed the checkpoint. The agreed contingency resequenced crews, limiting the forecast to Day 14; standby cost +800. Honest early escalation preserved trust.";
    event(state, "event_resolved", state.project.explanation);
  } else if (proposal.option === "alternate" && sound) {
    proposal.approval = "approved";
    event(
      state,
      "approval_verified",
      "At 10:30, Sam verified site access and Taylor passed the alternate’s acceptance review. Alex’s conditional procurement approval became effective before spend.",
    );
    state.project.forecastFinishDay = 12;
    state.project.forecastCost += 2000;
    state.project.actualCost += 2000;
    state.project.stakeholderTrust += 5;
    state.project.riskExposure = 10;
    state.project.delivery = "confirmed";
    state.tasks[0].status = "done";
    state.project.explanation =
      "The authorised alternate protected the Day 12 forecast at +2,000 credits. Normal acceptance checks passed; the intern recommended and Alex authorised the expenditure.";
    event(state, "event_resolved", state.project.explanation);
  } else {
    const breach =
      proposal.option === "unauthorised" ||
      proposal.option === "promise" ||
      proposal.confidence === "guaranteed" ||
      state.issue?.uncertainty === "guaranteed" ||
      state.reviewAnswer === "guarantee";
    state.project.governance = breach ? "breach" : "compliant";
    state.project.forecastFinishDay = 14;
    state.project.forecastCost +=
      proposal.option === "unauthorised" ? 800 : 1000;
    state.project.actualCost += proposal.option === "unauthorised" ? 800 : 1000;
    state.project.stakeholderTrust = proposal.option === "promise" ? 44 : 48;
    state.project.wellbeing -= 8;
    state.project.riskExposure = 55;
    state.project.delivery = "late";
    state.tasks[0].status = "blocked";
    proposal.approval = "rejected";
    state.project.explanation = !breach
      ? "The review ended without an agreed contingency. Crews waited while Alex reassembled a decision: Day 14 forecast, +1,000 disruption credits and lower trust. No false guarantee or unauthorised spending was recorded; make uncertainty and a decision request explicit next time."
      : proposal.option === "unauthorised"
        ? "Procurement blocked the unauthorised order. No alternate cost was committed, but coordination time was lost: Day 14 forecast, +800 standby credits, lower trust. Review authority limits and request approval."
        : "Dispatch audit found no guaranteed arrival. Crews were not given a credible contingency: Day 14 forecast, +1,000 disruption credits, lower trust. Replace the promise with source-backed uncertainty.";
    event(
      state,
      breach ? "governance_audited" : "review_followup",
      state.project.explanation,
    );
    event(
      state,
      "event_resolved",
      "Alex offers a supported replay: gather facts, state uncertainty, assign a verification owner and recommend an authorised path.",
    );
  }
  state.tasks[0].blocker =
    state.project.delivery === "confirmed"
      ? ""
      : "Delivery still unconfirmed at checkpoint";
}

function scoreRubric(state: GameState): Scores {
  const issue = state.issue;
  const proposal = state.proposal;
  const honest =
    issue?.uncertainty === "estimate" &&
    proposal?.confidence === "estimate" &&
    state.reviewAnswer === "conditional" &&
    proposal.option !== "promise";
  const misstatesFacts =
    issue?.uncertainty === "guaranteed" ||
    proposal?.confidence === "guaranteed" ||
    proposal?.option === "promise" ||
    state.reviewAnswer === "guarantee";
  const comparedCorrectly = correctComparison(proposal?.comparison);
  const deliveryUpdate = [...state.journal]
    .reverse()
    .find((item) => item.type === "updateTask");
  const recordedBlocked =
    deliveryUpdate?.type === "updateTask" &&
    deliveryUpdate.status === "blocked";
  return {
    accuracy:
      !issue || misstatesFacts
        ? 0
        : honest && fullEvidence(state) && recordedBlocked
          ? 3
          : fullEvidence(state)
            ? 2
            : 1,
    impact: !issue
      ? 0
      : issue.impact === "foundation" &&
          proposal?.impact === "foundation" &&
          state.evidence.includes("schedule") &&
          comparedCorrectly
        ? 3
        : issue.impact === "foundation" || proposal?.impact === "foundation"
          ? 2
          : 1,
    authority:
      state.project.governance === "breach"
        ? 0
        : proposal?.approval === "approved" &&
            state.reviewAnswer === "conditional"
          ? 3
          : proposal?.approval === "conditional"
            ? 2
            : 1,
    followUp: !issue
      ? 0
      : issue.nextCheck === "10:30" &&
          issue.dueDay === 1 &&
          proposal?.nextCheck === "10:30" &&
          honest &&
          (proposal.option === "wait" ||
            (proposal.option === "alternate" &&
              state.evidence.includes("safety")))
        ? 3
        : issue.owner && issue.nextCheck === "10:30"
          ? 2
          : 1,
  };
}

export function getObjectives(state: GameState): Objective[] {
  if (state.missionId === "CONST-I02") return getDay2Objectives(state);
  return [
    {
      id: "brief",
      label: "Meet Alex and accept your assignment",
      complete: state.phase !== "arrival",
    },
    {
      id: "schedule",
      label: "Inspect the schedule and successors",
      complete: state.evidence.includes("schedule"),
    },
    {
      id: "lead",
      label: "Ask Sam about crew dependencies",
      complete: state.evidence.includes("lead"),
    },
    {
      id: "supplier",
      label: "Check Morgan’s delivery evidence",
      complete: state.evidence.includes("supplier"),
    },
    {
      id: "board",
      label: "Update the source-backed delivery card",
      complete: state.tasks[0].evidence.length > 0,
    },
    {
      id: "issue",
      label: "Record an issue with owner and checkpoint",
      complete: state.issue !== null,
    },
    {
      id: "recommend",
      label: "Present your recommendation to Alex",
      complete: state.proposal !== null,
    },
    {
      id: "review",
      label: "Explain confidence and decision authority",
      complete: state.reviewAnswer !== null,
    },
    {
      id: "checkpoint",
      label: "Advance to the checkpoint and review consequences",
      complete: state.phase === "debrief",
    },
  ];
}

export function getFeedback(state: GameState): Feedback | null {
  if (state.missionId === "CONST-I02") return getDay2Feedback(state);
  if (state.phase !== "debrief") return null;
  const scores = state.career.competencies;
  const cite = (...types: string[]) =>
    state.events.filter((item) => types.includes(item.type));
  const criteria: RubricFeedback[] = [
    {
      id: "accuracy",
      label: "Accuracy",
      score: scores.accuracy,
      detail:
        scores.accuracy === 3
          ? "You checked three independent sources and separated Morgan’s estimate from confirmation."
          : scores.accuracy === 0
            ? "The record or review stated a guarantee unsupported by Morgan’s estimate. Citing a source does not make an altered claim accurate."
            : "Your sources were checked. Keep facts, estimates and guarantees distinct in the issue and mentor review.",
      citations: cite(
        "evidence_inspected",
        "question_asked",
        "evidence_followed_up",
        "issue_logged",
        "review_answered",
      ),
    },
    {
      id: "impact",
      label: "Impact",
      score: scores.impact,
      detail:
        scores.impact === 3
          ? "Your recorded impact linked delivery to foundations and framing, and your comparison correctly contrasted Day 13 / +400 waiting with Day 12 / +2,000 for an approved alternate."
          : correctComparison(state.proposal?.comparison)
            ? "Your comparison quantified both options, but the recorded impact did not consistently trace delivery through foundations and successor framing."
            : state.proposal?.comparison
              ? "Your recorded comparison did not match the source forecasts or costs. Check the schedule: wait Day 13 / +400; approved alternate Day 12 / +2,000."
              : "Your recorded dependency impact is assessed separately from a quantified comparison. Record both forecasts and extra costs to demonstrate stronger comparison evidence.",
      citations: cite(
        "evidence_inspected",
        "issue_logged",
        "options_compared",
        "proposal_submitted",
      ),
    },
    {
      id: "authority",
      label: "Authority",
      score: scores.authority,
      detail:
        scores.authority === 3
          ? state.proposal?.option === "alternate"
            ? "You recommended a defensible response. Alex approved procurement conditionally; Sam and Taylor verified the conditions before spend."
            : "You recommended waiting with a contingency. Alex retained decision authority and no alternate expenditure was committed."
          : state.project.governance === "breach"
            ? "Interns collect, record and recommend. Unsupported assurances or procurement commitments fail the governance gate; ask Alex for approval."
            : "The review did not establish an approved response. Make your recommendation, uncertainty and decision owner explicit.",
      citations: cite(
        "proposal_submitted",
        "review_answered",
        "approval_requested",
        "approval_rejected",
        "approval_verified",
        "governance_audited",
        "review_followup",
      ),
    },
    {
      id: "followUp",
      label: "Follow-up",
      score: scores.followUp,
      detail:
        scores.followUp === 3
          ? state.proposal?.option === "wait"
            ? "You assigned an owner and checkpoint, kept a crew contingency and verified the outcome."
            : "You assigned an owner and checkpoint, checked acceptance requirements and verified the outcome."
          : state.proposal?.option === "alternate" &&
              !state.evidence.includes("safety")
            ? "You recorded a checkpoint and owner. Ask Taylor about acceptance conditions to make the alternate’s follow-up requirements explicit."
            : "You recorded a checkpoint and owner. Keep the confidence statement truthful and make the response conditional on the verification result.",
      citations: cite(
        "issue_logged",
        "question_asked",
        "evidence_followed_up",
        "event_resolved",
      ),
    },
  ];
  return {
    title:
      state.project.governance === "compliant"
        ? "Your first project case study"
        : "A setback you can learn from",
    summary: state.project.explanation,
    criteria,
    xpEarned: state.career.xp,
    reflection:
      "What could you truthfully tell the sponsor before the checkpoint? Which trade-off would change your recommendation?",
    next: "Continue to Day 2: The Slipping Milestone. This assignment records internship evidence and does not grant a promotion.",
    governancePassed: state.project.governance === "compliant",
  };
}
