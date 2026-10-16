import type {
  Command,
  CommandResult,
  Feedback,
  GameState,
  NpcId,
  Objective,
  Scores,
  SourceId,
} from "./types";
import { DAY2, baselineSchedule, type ScheduleOption } from "./day2-content";
import { calculateSchedule } from "./schedule";

const required: SourceId[] = ["schedule", "lead", "safety"];
const completeEvidence = (state: GameState) =>
  required.every((source) => state.evidence.includes(source));
const activeJournal = (state: GameState) =>
  state.journal.slice(
    state.journal.map((c) => c.type).lastIndexOf("startNextMission") + 1,
  );
export function day2ConversationChoice(
  state: GameState,
  npc: NpcId,
): "facts" | "pressure" | null {
  const first = activeJournal(state).find(
    (c) => c.type === "ask" && c.npc === npc,
  );
  return first?.type === "ask" ? first.choice : null;
}
function append(state: GameState, type: string, summary: string) {
  state.events.push({
    seq: state.events.length + 1,
    type,
    summary,
    day: state.day,
    minutes: state.minutes,
  });
}
const fail = (state: GameState, error: string): CommandResult => ({
  state,
  error,
});
const unchanged = (state: GameState, notice: string): CommandResult => ({
  state,
  notice,
});
function comparisonMatches(state: GameState) {
  const c = state.schedule?.proposal?.comparison,
    carried = state.schedule!.carriedForecastDay;
  return (
    c?.waitFinishDay === carried + 1 &&
    c.waitCost === 0 &&
    c.alternateFinishDay === carried &&
    c.alternateCost === 1200
  );
}

export function beginDay2(state: GameState): CommandResult {
  if (
    state.missionId !== "CONST-I01" ||
    state.phase !== "debrief" ||
    !state.career.completedMissionIds.includes("CONST-I01")
  )
    return fail(
      state,
      "Complete the Day 1 debrief before starting the next assignment.",
    );
  const next = structuredClone(state);
  next.missionHistory = [
    {
      missionId: "CONST-I01",
      title: "The Missing Materials",
      day: 1,
      xpEarned: state.career.xp,
      scores: { ...state.career.competencies },
      outcome: state.project.explanation,
      forecastFinishDay: state.project.forecastFinishDay,
      actualCost: state.project.actualCost,
      trust: state.project.stakeholderTrust,
    },
  ];
  next.missionId = "CONST-I02";
  next.day = 2;
  next.minutes = 540;
  next.phase = "arrival";
  next.evidence = [];
  next.issue = null;
  next.proposal = null;
  next.reviewAnswer = null;
  next.position = { x: -2.1, z: 4.6, yaw: Math.PI };
  next.schedule = {
    carriedForecastDay: state.project.forecastFinishDay,
    plan: null,
    choice: null,
    proposal: null,
  };
  next.tasks = DAY2.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    owner: "Sam",
    status: "not_started",
    dueDay: state.project.forecastFinishDay,
    blocker: "Awaiting verified survey sequence",
    evidence: [],
    dependencies: [...task.dependencies],
    acceptance: task.acceptance,
  }));
  next.career.nextAssignment = DAY2.title;
  append(
    next,
    "mission_unlocked",
    `Day 2 unlocked. Carried foundation forecast Day ${state.project.forecastFinishDay}, cost ${state.project.actualCost} and trust ${state.project.stakeholderTrust}; Day 1 evidence is retained in career history.`,
  );
  next.journal.push({ type: "startNextMission" });
  return {
    state: next,
    notice:
      "Day 2 · The Slipping Milestone. Meet Alex for a new scheduling assignment.",
  };
}

export function getScheduleRecommendationError(
  state: GameState,
): string | undefined {
  if (state.missionId !== "CONST-I02" || state.phase !== "investigating")
    return "Receive the Day 2 assignment before preparing a response.";
  if (!completeEvidence(state))
    return "Inspect the schedule and verify both Sam’s duration and Taylor’s acceptance gates.";
  if (!state.schedule?.plan)
    return "Save a verified four-task dependency plan with an owner and 11:00 follow-up first.";
}

export function applyDay2Command(
  state: GameState,
  command: Command,
): CommandResult {
  if (state.phase === "debrief")
    return unchanged(
      state,
      "Day 2 is complete. Review your case study; later campaign days are planned.",
    );
  if (command.type !== "brief" && state.phase === "arrival")
    return fail(state, "Meet Alex for your Day 2 assignment first.");
  const next = structuredClone(state);
  let notice: string;
  const schedule = next.schedule!;
  switch (command.type) {
    case "brief":
      if (state.phase !== "arrival")
        return unchanged(state, "Your Day 2 assignment is already recorded.");
      next.phase = "investigating";
      append(next, "mission_started", DAY2.briefing);
      notice =
        "Trace the survey through BOTH successors. Verify Sam’s duration and Taylor’s acceptance gates.";
      break;
    case "inspect":
      if (state.phase !== "investigating" || command.source !== "schedule")
        return fail(
          state,
          "Inspect the schedule during investigation; speak with the other source owners.",
        );
      if (state.evidence.includes("schedule"))
        return unchanged(state, "This schedule is already in your notebook.");
      next.evidence.push("schedule");
      append(
        next,
        "evidence_inspected",
        "Inspected the four-day baseline: survey → inspection AND off-site formwork → pour; both accepted predecessors gate the pour.",
      );
      notice = "Baseline schedule recorded. Trace both successor branches.";
      break;
    case "ask": {
      if (state.phase !== "investigating")
        return fail(
          state,
          "Your recommendation is under review; evidence choices are now committed.",
        );
      const selected = day2ConversationChoice(state, command.npc);
      if (selected)
        return selected === command.choice
          ? unchanged(state, "This response is already committed.")
          : fail(
              state,
              "That conversation choice is committed. Use a documented follow-up to recover evidence.",
            );
      const npc = DAY2.npcs[command.npc],
        person =
          command.npc === "lead"
            ? "Sam"
            : command.npc === "safety"
              ? "Taylor"
              : "Morgan";
      next.relationships[person] += command.choice === "facts" ? 3 : -4;
      if (command.choice === "facts") next.evidence.push(command.npc);
      append(
        next,
        "question_asked",
        `${npc.name}: ${command.choice === "facts" ? npc.facts : npc.pressure}`,
      );
      notice = command.choice === "facts" ? npc.facts : npc.pressure;
      break;
    }
    case "followUp": {
      if (
        state.phase !== "investigating" ||
        day2ConversationChoice(state, command.npc) !== "pressure"
      )
        return fail(
          state,
          "A documented follow-up is available after a pressured conversation during investigation.",
        );
      if (state.evidence.includes(command.npc))
        return unchanged(
          state,
          "The documented evidence is already recorded; the initial relationship consequence remains.",
        );
      next.evidence.push(command.npc);
      append(
        next,
        "evidence_recovered",
        `Acknowledged the uncertainty with ${DAY2.npcs[command.npc].name} and recorded the verified source. The earlier relationship cost remains.`,
      );
      notice =
        "Source recovered without changing your original answer or erasing its consequence.";
      break;
    }
    case "saveSchedulePlan": {
      if (state.phase !== "investigating" || !completeEvidence(state))
        return fail(
          state,
          "Gather schedule, Sam and Taylor evidence before saving your plan.",
        );
      if (
        command.owner !== "Sam" ||
        command.checkpoint !== "11:00" ||
        !required.every((s) => command.evidence.includes(s)) ||
        command.evidence.some((s) => !state.evidence.includes(s))
      )
        return fail(
          state,
          "Sam owns the 11:00 verification. Cite the inspected schedule, Sam and Taylor.",
        );
      const expected = baselineSchedule();
      if (
        command.tasks.length !== 4 ||
        new Set(command.tasks.map((t) => t.id)).size !== 4
      )
        return fail(state, "Record all four unique work packages.");
      for (const task of expected) {
        const proposed = command.tasks.find((t) => t.id === task.id);
        if (
          !proposed ||
          proposed.durationDays !==
            (task.id === "setting_out" ? 2 : task.durationDays)
        )
          return fail(
            state,
            "Use Sam’s verified survey duration of 2 days and the sourced inspection/formwork/pour durations of 1, 2 and 1.",
          );
        if (
          [...proposed.dependencies].sort().join("|") !==
          [...task.dependencies].sort().join("|")
        )
          return fail(
            state,
            "Survey release gates BOTH inspection and off-site formwork; the pour requires BOTH accepted branches. Keep all four finish-to-start links.",
          );
      }
      let result;
      try {
        result = calculateSchedule(command.tasks);
      } catch (error) {
        return fail(
          state,
          error instanceof Error ? error.message : "Invalid dependency graph.",
        );
      }
      const plan = {
        tasks: expected.map((task) => ({
          id: task.id,
          durationDays: command.tasks.find(
            (proposed) => proposed.id === task.id,
          )!.durationDays,
          dependencies: [...task.dependencies],
        })),
        owner: "Sam" as const,
        checkpoint: "11:00" as const,
        evidence: (
          ["schedule", "lead", "supplier", "safety"] as SourceId[]
        ).filter((source) => command.evidence.includes(source)),
        chainDays: result.finishDay,
        forecastFinishDay:
          schedule.carriedForecastDay +
          result.finishDay -
          calculateSchedule(expected).finishDay,
      };
      if (JSON.stringify(plan) === JSON.stringify(state.schedule?.plan))
        return unchanged(
          state,
          "This verified schedule plan is already recorded.",
        );
      schedule.plan = plan;
      next.project.forecastFinishDay = plan.forecastFinishDay;
      next.project.explanation = `The verified survey increases the dependency chain from 4 to ${result.finishDay} working days. Both successor gates remain, so the carried foundation forecast moves to Day ${plan.forecastFinishDay}. No baseline change or extra spending is authorised.`;
      next.tasks = next.tasks.map((t) => ({
        ...t,
        dependencies: [...plan.tasks.find((p) => p.id === t.id)!.dependencies],
        evidence: [...plan.evidence],
        status: t.id === "setting_out" ? "in_progress" : "blocked",
      }));
      append(
        next,
        "schedule_replanned",
        `Recorded survey 2 days, both successor links and both pour predecessors; chain ${result.finishDay} days, carried forecast ${schedule.carriedForecastDay} → ${plan.forecastFinishDay}; Sam verifies at 11:00.`,
      );
      notice =
        "Working forecast recalculated. The approved baseline is unchanged. Bring your recommendation to Alex.";
      break;
    }
    case "chooseScheduleRecommendation": {
      const error = getScheduleRecommendationError(state);
      if (error) return fail(state, error);
      if (schedule.choice)
        return schedule.choice === command.option
          ? unchanged(state, "This response is already committed.")
          : fail(
              state,
              "Your response is committed. Review its consequences before trying a different approach in a fresh career.",
            );
      schedule.choice = command.option;
      append(
        next,
        "response_committed",
        `Committed response: ${DAY2.options[command.option].label}.`,
      );
      notice =
        "Response committed. Complete the evidence and confidence fields; the other response paths are locked.";
      break;
    }
    case "submitScheduleRecommendation": {
      const error = getScheduleRecommendationError(state);
      if (error) return fail(state, error);
      if (schedule.choice !== command.option)
        return fail(
          state,
          "Choose and commit this response before submitting it.",
        );
      if (command.nextCheck !== "11:00")
        return fail(state, "Use the agreed 11:00 checkpoint.");
      schedule.proposal = {
        option: command.option,
        confidence: command.confidence,
        nextCheck: "11:00",
        comparison: structuredClone(command.comparison),
        approval: "pending",
      };
      next.phase = "review";
      append(
        next,
        "proposal_submitted",
        `Recommended ${DAY2.options[command.option].label}; ${command.confidence}. Compared wait Day ${command.comparison.waitFinishDay} / +${command.comparison.waitCost} with support Day ${command.comparison.alternateFinishDay} / +${command.comparison.alternateCost}; verify at 11:00.`,
      );
      notice =
        "Alex asks who owns approval and whether the verified forecast is a guarantee.";
      break;
    }
    case "answerReview": {
      if (state.phase !== "review" || !schedule.proposal)
        return fail(
          state,
          "Submit the schedule recommendation before the mentor review.",
        );
      if (state.reviewAnswer)
        return unchanged(
          state,
          "Your review answer is committed. Advance to 11:00.",
        );
      next.reviewAnswer = command.answer;
      const good =
        command.answer === "conditional" &&
        schedule.proposal.confidence === "estimate" &&
        ["wait", "extra_team"].includes(schedule.proposal.option);
      schedule.proposal.approval = good
        ? schedule.proposal.option === "extra_team"
          ? "conditional"
          : "approved"
        : "rejected";
      append(
        next,
        "review_answered",
        command.answer === "conditional"
          ? "Explained both successor gates, retained uncertainty and Alex’s approval authority."
          : command.answer === "guarantee"
            ? "Guaranteed a date despite the conditional working forecast."
            : "Deferred the confidence explanation and next-step responsibility to Alex.",
      );
      append(
        next,
        good ? "approval_requested" : "approval_rejected",
        good
          ? schedule.proposal.option === "extra_team"
            ? "Alex conditionally approved 1,200 credits, pending Sam’s crew-capacity check and Taylor’s acceptance gates."
            : "Alex approved the honest revised sequence, both team notifications and Sam’s 11:00 follow-up. No extra spending."
          : "Alex rejected the unsupported assurance or bypass request. No unsafe work or extra spending is authorised.",
      );
      notice = good
        ? "Review recorded. Advance to the 11:00 verification."
        : "Alex challenged the proposal. Advance to see the setback and feedback.";
      break;
    }
    case "advanceTime": {
      if (state.phase !== "review" || !state.reviewAnswer || !schedule.proposal)
        return fail(
          state,
          "Answer Alex’s review question before advancing the checkpoint.",
        );
      next.minutes = 660;
      const p = schedule.proposal,
        good =
          ["wait", "extra_team"].includes(p.option) &&
          p.confidence === "estimate" &&
          next.reviewAnswer === "conditional";
      let extra: number;
      if (good) {
        const accelerated = p.option === "extra_team";
        extra = accelerated ? 1200 : 0;
        p.approval = "approved";
        next.project.forecastFinishDay =
          schedule.carriedForecastDay + (accelerated ? 0 : 1);
        next.project.stakeholderTrust = Math.min(
          100,
          next.project.stakeholderTrust + (accelerated ? 6 : 4),
        );
        next.project.riskExposure = accelerated ? 10 : 15;
        next.project.wellbeing = Math.min(100, next.project.wellbeing + 2);
        append(
          next,
          "approval_verified",
          accelerated
            ? "Sam notified both waiting teams and verified second-team capacity; Taylor retained both acceptance gates before Alex’s approved 1,200-credit commitment."
            : "Sam notified both waiting teams and verified the revised two-day survey sequence at 11:00; no extra expenditure.",
        );
        next.project.explanation = accelerated
          ? `Approved survey support recovered the additional day at +1,200 credits. The forecast returns to carried Day ${schedule.carriedForecastDay}; both inspection and off-site formwork still gate the pour.`
          : `The verified sequence adds one working day: carried Day ${schedule.carriedForecastDay} → Day ${next.project.forecastFinishDay}, with no extra spend. Both waiting teams have an owner and checkpoint; all acceptance gates remain.`;
      } else {
        const breach =
          p.option === "bypass" ||
          p.option === "original_date" ||
          p.confidence === "guaranteed" ||
          next.reviewAnswer === "guarantee";
        if (breach) next.project.governance = "breach";
        extra = p.option === "bypass" ? 500 : breach ? 600 : 300;
        next.project.forecastFinishDay = schedule.carriedForecastDay + 2;
        next.project.stakeholderTrust = Math.max(
          0,
          next.project.stakeholderTrust - (breach ? 12 : 4),
        );
        next.project.riskExposure = 40;
        p.approval = "rejected";
        next.project.explanation =
          p.option === "bypass"
            ? `Taylor blocked the proposed inspection bypass. Unsafe work did not proceed; coordination was lost: carried Day ${schedule.carriedForecastDay} → Day ${next.project.forecastFinishDay}, +500 disruption credits.`
            : breach
              ? `The review audited the unsupported original-date promise against the verified dependency plan. Forecast Day ${next.project.forecastFinishDay}, +600 disruption credits; no acceptance gate was waived.`
              : `The deferred review left the two teams without a clear approved response. The follow-up slip moves the forecast to Day ${next.project.forecastFinishDay}, +300 coordination credits; Alex offers supported recovery.`;
        append(
          next,
          breach ? "governance_audited" : "review_followup",
          next.project.explanation,
        );
      }
      next.project.forecastCost += extra;
      next.project.actualCost += extra;
      append(next, "event_resolved", next.project.explanation);
      next.phase = "debrief";
      const honest =
        p.confidence === "estimate" &&
        next.reviewAnswer === "conditional" &&
        p.option !== "original_date";
      const scores: Scores = {
        accuracy: honest
          ? 3
          : p.confidence === "guaranteed" ||
              p.option === "original_date" ||
              next.reviewAnswer === "guarantee"
            ? 0
            : 2,
        impact: comparisonMatches(next) ? 3 : 2,
        authority: good
          ? 3
          : p.option === "bypass" ||
              p.option === "original_date" ||
              p.confidence === "guaranteed" ||
              next.reviewAnswer === "guarantee"
            ? 0
            : 1,
        followUp: good ? 3 : 2,
      };
      const xp = 50 + Object.values(scores).reduce((sum, n) => sum + n * 5, 0);
      next.career.xp += xp;
      next.career.competencies = scores;
      next.career.reputation = next.project.stakeholderTrust;
      next.career.completedMissionIds.push("CONST-I02");
      next.career.nextAssignment =
        "Day 3 · The Stakeholder Check-in is planned; your two case studies are saved.";
      if (
        scores.impact === 3 &&
        !next.career.achievements.includes("Dependency Detective")
      )
        next.career.achievements.push("Dependency Detective");
      next.missionHistory = [
        ...(next.missionHistory ?? []),
        {
          missionId: "CONST-I02",
          title: DAY2.title,
          day: 2,
          xpEarned: xp,
          scores,
          outcome: next.project.explanation,
          forecastFinishDay: next.project.forecastFinishDay,
          actualCost: next.project.actualCost,
          trust: next.project.stakeholderTrust,
        },
      ];
      append(
        next,
        "mission_completed",
        `Completed CONST-I02; earned ${xp} XP. Earlier XP/costs/consequences retained; role remains Junior PM Intern.`,
      );
      notice =
        "Day 2 reviewed. Your schedule case study and career history are saved.";
      break;
    }
    default:
      return fail(
        state,
        "This tool belongs to the Day 1 assignment. Use the dependency plan for Day 2.",
      );
  }
  next.journal.push(structuredClone(command));
  return { state: next, notice };
}

export function getDay2Objectives(state: GameState): Objective[] {
  return [
    {
      id: "brief",
      label: "Meet Alex and accept the Day 2 assignment",
      complete: state.phase !== "arrival",
    },
    {
      id: "schedule",
      label: "Inspect the two-successor schedule",
      complete: state.evidence.includes("schedule"),
    },
    {
      id: "lead",
      label: "Verify the survey duration with Sam",
      complete: state.evidence.includes("lead"),
    },
    {
      id: "safety",
      label: "Confirm acceptance gates with Taylor",
      complete: state.evidence.includes("safety"),
    },
    {
      id: "plan",
      label: "Record both successor links and recalculate the plan",
      complete: !!state.schedule?.plan,
    },
    {
      id: "choice",
      label: "Commit a source-backed response",
      complete: !!state.schedule?.choice,
    },
    {
      id: "recommend",
      label: "Submit your schedule recommendation",
      complete: !!state.schedule?.proposal,
    },
    {
      id: "review",
      label: "Explain uncertainty and approval authority",
      complete: !!state.reviewAnswer,
    },
    {
      id: "checkpoint",
      label: "Advance to 11:00 and review the outcome",
      complete: state.phase === "debrief",
    },
  ];
}
export function getDay2Feedback(state: GameState): Feedback | null {
  if (state.phase !== "debrief") return null;
  const scores = state.career.competencies,
    current = state.events.filter((e) => e.day === 2),
    history = state.missionHistory?.find((m) => m.missionId === "CONST-I02");
  const criteria = (
    [
      [
        "accuracy",
        "Accuracy",
        "The record distinguishes the verified two-day survey from a guaranteed finish.",
        "Retain the verified duration and make your forecast conditional.",
        ["question_asked", "schedule_replanned", "review_answered"],
      ],
      [
        "impact",
        "Dependency reasoning",
        "Your saved diamond traces BOTH successors and records the correct quantified trade-off.",
        "Both links are recorded. Check the two forecasts and costs in your comparison.",
        ["schedule_replanned", "proposal_submitted"],
      ],
      [
        "authority",
        "Authority",
        "Alex retained approval; Sam and Taylor verified conditions before any spending.",
        "Unsupported promises and acceptance bypasses cannot replace approval.",
        [
          "approval_requested",
          "approval_rejected",
          "approval_verified",
          "governance_audited",
        ],
      ],
      [
        "followUp",
        "Follow-up",
        "Sam owned the 11:00 check, and the two waiting teams received the approved sequence.",
        "The owner and checkpoint were recorded; strengthen the approved response and team follow-through.",
        ["schedule_replanned", "event_resolved"],
      ],
    ] as const
  ).map(([id, label, strong, developing, types]) => ({
    id,
    label,
    score: scores[id],
    detail: scores[id] === 3 ? strong : developing,
    citations: current.filter((e) =>
      (types as readonly string[]).includes(e.type),
    ),
  }));
  return {
    title:
      state.schedule?.proposal?.approval === "approved"
        ? "A schedule built on evidence"
        : "A setback with a traceable cause",
    summary: state.project.explanation,
    criteria,
    xpEarned: history?.xpEarned ?? 0,
    reflection:
      "Which activity looked minor? Why did one delayed release affect two teams, and which branch controlled the pour?",
    next: "Day 3 · The Stakeholder Check-in is planned. Your first two case studies and cumulative career evidence are retained.",
    governancePassed: state.schedule?.proposal?.approval === "approved",
  };
}
export const scheduleOptionIds: ScheduleOption[] = [
  "wait",
  "extra_team",
  "bypass",
  "original_date",
];
