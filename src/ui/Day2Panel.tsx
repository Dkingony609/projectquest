import { useState, type FormEvent } from "react";
import {
  DAY2,
  baselineSchedule,
  calculateSchedule,
  getConversationChoice,
  getFeedback,
  getObjectives,
  getScheduleRecommendationError,
  type Command,
  type GameState,
  type NpcId,
  type ScheduleInput,
  type ScheduleOption,
  type SourceId,
} from "../game";
import Dialog from "./Dialog";
import MissionJournal from "./MissionJournal";
import type { GamePanelProps } from "./GamePanel";
import "./day2.css";

type Interaction = {
  state: GameState;
  dispatch: (command: Command) => void;
  onClose: () => void;
};
const money = (n: number) => `${n.toLocaleString("en-US")} cr`;
const options: ScheduleOption[] = [
  "wait",
  "extra_team",
  "bypass",
  "original_date",
];

function Source({ id }: { id: SourceId }) {
  const source = DAY2.sources[id];
  return (
    <article className="pq-source">
      <h3>Source record · {source.title}</h3>
      <ul>
        {source.detail.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <small>{source.provenance}</small>
    </article>
  );
}
function Mentor({ state, dispatch, onClose }: Interaction) {
  if (state.phase === "review")
    return <Review state={state} dispatch={dispatch} onClose={onClose} />;
  return (
    <>
      <div className="pq-person">
        <span className="pq-person-avatar" aria-hidden="true">
          A
        </span>
        <div>
          <strong>Alex Chen</strong>
          <small>Senior PM · Day 2 mentor</small>
        </div>
      </div>
      <blockquote className="pq-speech">
        {state.phase === "arrival"
          ? `Welcome back, ${state.profile.name}. A small-looking survey is holding up two teams. Show me the chain before you promise a date.`
          : "A working forecast reflects dependencies. It does not change the approved baseline or give you authority to commit extra cost."}
      </blockquote>
      <p>{DAY2.briefing}</p>
      <div className="pq-help">
        Yesterday’s forecast, cost, trust and career evidence are carried
        forward. You are still a Junior PM Intern.
      </div>
      {state.phase === "arrival" ? (
        <button className="primary" onClick={() => dispatch({ type: "brief" })}>
          Accept the scheduling assignment <span aria-hidden="true">↗</span>
        </button>
      ) : (
        <>
          <ul className="pq-list">
            {getObjectives(state)
              .filter((o) => !o.complete)
              .slice(0, 3)
              .map((o) => (
                <li className="pq-objective" key={o.id}>
                  {o.label}
                </li>
              ))}
          </ul>
          <button className="secondary" onClick={onClose}>
            Return to workplace
          </button>
        </>
      )}
    </>
  );
}
function Conversation({
  state,
  dispatch,
  onClose,
  npc,
}: { npc: NpcId } & Interaction) {
  const selected = getConversationChoice(state, npc),
    source = state.evidence.includes(npc),
    person = DAY2.npcs[npc];
  const labels = {
    lead: [
      "Ask about survey duration and both successor teams",
      "Ask Sam to keep the original date",
    ],
    safety: [
      "Ask about inspection and pour acceptance gates",
      "Ask Taylor to remove the inspection gate",
    ],
    supplier: [
      "Ask about second-team capacity",
      "Ask Morgan to book support without approval",
    ],
  };
  return (
    <>
      <div className="pq-person">
        <span className="pq-person-avatar" aria-hidden="true">
          {person.name[0]}
        </span>
        <div>
          <strong>{person.name}</strong>
          <small>{person.role}</small>
        </div>
      </div>
      <blockquote className="pq-speech">
        {selected === "facts"
          ? person.facts
          : selected === "pressure"
            ? person.pressure
            : person.greeting}
      </blockquote>
      <p className="pq-commitment">
        {selected
          ? "Your answer is committed; the alternatives stay locked."
          : "Choose deliberately. Selecting an answer commits it and locks the alternative."}
      </p>
      <div className="pq-choice-grid">
        {(["facts", "pressure"] as const).map((choice, i) => (
          <button
            className="pq-choice"
            key={choice}
            aria-label={labels[npc][i]}
            aria-pressed={selected === choice}
            disabled={state.phase !== "investigating" || selected !== null}
            onClick={() => dispatch({ type: "ask", npc, choice })}
          >
            {selected === choice && (
              <span className="pq-choice-status">Selected · committed</span>
            )}
            <strong>{labels[npc][i]}</strong>
            <span>
              {choice === "facts"
                ? "Record a traceable source and its uncertainty."
                : "Press for the original date or a shortcut."}
            </span>
          </button>
        ))}
      </div>
      {selected === "pressure" &&
        !source &&
        state.phase === "investigating" && (
          <div className="pq-help">
            <p>
              The original response cost trust. You can request evidence as a
              separate follow-up; it will not erase that consequence.
            </p>
            <button
              className="secondary"
              onClick={() => dispatch({ type: "followUp", npc })}
            >
              Acknowledge the concern and request the verified record
            </button>
          </div>
        )}
      {source && <Source id={npc} />}
      <button className="secondary" onClick={onClose}>
        Return to workplace
      </button>
    </>
  );
}
function DependencyDiagram() {
  return (
    <div
      className="dependency-diamond"
      aria-label="Survey release blocks two activities; the pour requires both"
    >
      <div className="diamond-start">
        <strong>Setting-out survey</strong>
        <small>Verified release</small>
      </div>
      <div className="diamond-branches">
        <div>
          <span aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 4L6 18M6 10v8h8" />
            </svg>
          </span>
          <strong>Safety inspection</strong>
          <small>1 day · acceptance retained</small>
        </div>
        <div>
          <span aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4l12 14M10 18h8v-8" />
            </svg>
          </span>
          <strong>Off-site formwork</strong>
          <small>2 days · separate work zone</small>
        </div>
      </div>
      <div className="diamond-end">
        <span aria-hidden="true">
          <svg
            width="64"
            height="24"
            viewBox="0 0 64 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4l18 14M14 18h8v-8M60 4L42 18M42 10v8h8" />
          </svg>
        </span>
        <strong>Foundation pour</strong>
        <small>Both accepted predecessors required</small>
      </div>
    </div>
  );
}
function PlanningTool({
  state,
  dispatch,
}: Pick<Interaction, "state" | "dispatch">) {
  const saved = state.schedule!.plan;
  const [tasks, setTasks] = useState<ScheduleInput[]>(() =>
    saved
      ? structuredClone(saved.tasks)
      : baselineSchedule().map((task) => ({ ...task, dependencies: [] })),
  );
  const [owner, setOwner] = useState(saved?.owner ?? ""),
    [checkpoint, setCheckpoint] = useState(saved?.checkpoint ?? ""),
    [error, setError] = useState("");
  let draft;
  try {
    draft = calculateSchedule(tasks);
  } catch {
    draft = null;
  }
  const carried = state.schedule!.carriedForecastDay,
    editable = state.phase === "investigating";
  const allSources = ["schedule", "lead", "safety"].every((id) =>
    state.evidence.includes(id as SourceId),
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!owner || !checkpoint) {
      setError("Assign a plan owner and the agreed follow-up check.");
      return;
    }
    setError("");
    dispatch({
      type: "saveSchedulePlan",
      tasks,
      owner: owner as "Sam" | "Morgan" | "Alex",
      checkpoint,
      evidence: state.evidence,
    });
  }
  return (
    <>
      <div className="pq-help">
        Trace the two blocked teams in a working plan, using Sam’s verified
        duration. This updates a forecast; the approved baseline stays
        unchanged.
      </div>
      <DependencyDiagram />
      <div className="pq-schedule-summary">
        <div className="pq-stat">
          <small>Yesterday’s carried forecast</small>
          <strong>Day {carried}</strong>
          <span>Earlier delay and cost retained</span>
        </div>
        <div className="pq-stat">
          <small>Approved dependency chain</small>
          <strong>4 days</strong>
          <span>Survey 1 → longer branch 2 → pour 1</span>
        </div>
        <div className="pq-stat">
          <small>Draft chain · unverified</small>
          <strong>{draft?.finishDay ?? "—"} days</strong>
          <span>Validate sources and all links before relying on it</span>
        </div>
      </div>
      {saved && (
        <article className="pq-register">
          <h3>Verified schedule plan recorded</h3>
          <p>
            Chain {saved.chainDays} days · forecast Day{" "}
            {saved.forecastFinishDay} · {saved.owner} verifies at{" "}
            {saved.checkpoint}. No extra spend authorised.
          </p>
        </article>
      )}
      <form className="day2-plan" onSubmit={submit} noValidate>
        <fieldset disabled={!editable}>
          <legend>Trace the verified work packages</legend>
          {tasks.map((task, index) => (
            <article className="plan-work-package" key={task.id}>
              <div>
                <span className="pq-task-step">WORK PACKAGE 0{index + 1}</span>
                <h3>{DAY2.tasks.find((t) => t.id === task.id)!.title}</h3>
                <label>
                  Duration (working days)
                  <input
                    aria-label={`${DAY2.tasks[index].title} duration (days)`}
                    type="number"
                    min="1"
                    max="60"
                    value={task.durationDays}
                    onChange={(event) =>
                      setTasks((current) =>
                        current.map((t) =>
                          t.id === task.id
                            ? { ...t, durationDays: Number(event.target.value) }
                            : t,
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <div>
                <strong className="dependency-label">
                  Verified predecessors
                </strong>
                {task.id === "setting_out" ? (
                  <p>No predecessor within this work package.</p>
                ) : (
                  DAY2.tasks
                    .filter((candidate) => candidate.id !== task.id)
                    .map((candidate) => (
                      <label className="dependency-checkbox" key={candidate.id}>
                        <input
                          type="checkbox"
                          aria-label={`${DAY2.tasks[index].title} depends on ${candidate.title}`}
                          checked={task.dependencies.includes(candidate.id)}
                          onChange={(event) =>
                            setTasks((current) =>
                              current.map((t) =>
                                t.id === task.id
                                  ? {
                                      ...t,
                                      dependencies: event.target.checked
                                        ? [...t.dependencies, candidate.id]
                                        : t.dependencies.filter(
                                            (id) => id !== candidate.id,
                                          ),
                                    }
                                  : t,
                              ),
                            )
                          }
                        />
                        {candidate.title}
                      </label>
                    ))
                )}
              </div>
              {draft && (
                <small>
                  Draft relative days {draft.tasks[task.id].earlyStart} →{" "}
                  {draft.tasks[task.id].earlyFinish}
                  {draft.tasks[task.id].critical
                    ? " · on draft critical chain"
                    : ""}
                </small>
              )}
            </article>
          ))}
          <div className="pq-form">
            <label className="pq-field">
              Plan owner
              <select
                aria-label="Plan owner"
                value={owner}
                onChange={(event) =>
                  setOwner(event.target.value as typeof owner)
                }
              >
                <option value="">Assign follow-up</option>
                <option value="Sam">Sam · delivery lead</option>
                <option value="Alex">Alex · project manager</option>
                <option value="Morgan">Morgan · coordination desk</option>
              </select>
            </label>
            <label className="pq-field">
              Follow-up check
              <input
                aria-label="Follow-up check"
                type="time"
                value={checkpoint}
                onChange={(event) =>
                  setCheckpoint(event.target.value as typeof checkpoint)
                }
              />
            </label>
          </div>
          <p className="quiet">
            Source provenance:{" "}
            {state.evidence.map((id) => DAY2.sources[id].title).join(" · ") ||
              "No inspected sources yet"}
            .
          </p>
          {!allSources && (
            <p className="pq-help">
              Inspect the schedule, Sam and Taylor before recording the verified
              plan.
            </p>
          )}
          {error && (
            <p role="alert" className="pq-errors">
              {error}
            </p>
          )}
          <button
            className="primary"
            type="submit"
            disabled={!allSources || !editable}
          >
            Save schedule plan <span aria-hidden="true">↗</span>
          </button>
        </fieldset>
      </form>
    </>
  );
}
function Board({ state, dispatch }: Pick<Interaction, "state" | "dispatch">) {
  const [tab, setTab] = useState<"sources" | "plan">("sources");
  return (
    <>
      <div className="pq-tabs" role="tablist" aria-label="Day 2 project tools">
        {(["sources", "plan"] as const).map((id) => (
          <button
            role="tab"
            key={id}
            id={`day2-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="day2-tool-panel"
            tabIndex={tab === id ? 0 : -1}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "sources"
                  : event.key === "End"
                    ? "plan"
                    : tab === "sources"
                      ? "plan"
                      : "sources";
              setTab(next);
              document.getElementById(`day2-tab-${next}`)?.focus();
            }}
            onClick={() => setTab(id)}
          >
            {id === "sources" ? "Schedule & sources" : "Dependency plan"}
          </button>
        ))}
      </div>
      <section
        id="day2-tool-panel"
        role="tabpanel"
        aria-labelledby={`day2-tab-${tab}`}
        tabIndex={0}
      >
        {tab === "sources" ? (
          <>
            <div className="pq-help">
              The survey was planned at 1 day. Verify its remaining duration and
              which TWO teams depend on its release.
            </div>
            <DependencyDiagram />
            {state.evidence.includes("schedule") ? (
              <Source id="schedule" />
            ) : (
              <button
                className="primary"
                disabled={state.phase !== "investigating"}
                onClick={() =>
                  dispatch({ type: "inspect", source: "schedule" })
                }
              >
                Inspect dependency schedule <span aria-hidden="true">↗</span>
              </button>
            )}
            <table className="pq-table">
              <thead>
                <tr>
                  <th>Response estimate</th>
                  <th>Foundation forecast</th>
                  <th>Additional cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Verified revised sequence</td>
                  <td>Day {state.schedule!.carriedForecastDay + 1}</td>
                  <td>0 cr</td>
                </tr>
                <tr>
                  <td>Approved extra survey team</td>
                  <td>Day {state.schedule!.carriedForecastDay}</td>
                  <td>1,200 cr</td>
                </tr>
              </tbody>
            </table>
            <p className="quiet">
              These are fictional planning assumptions. Extra support requires
              Alex’s approval, Sam’s capacity verification and Taylor’s
              acceptance conditions.
            </p>
          </>
        ) : (
          <PlanningTool state={state} dispatch={dispatch} />
        )}
      </section>
    </>
  );
}
function Recommendation({ state, dispatch, onClose }: Interaction) {
  const [confidence, setConfidence] = useState<"estimate" | "guaranteed" | "">(
      "",
    ),
    [nextCheck, setNextCheck] = useState(""),
    [error, setError] = useState("");
  const [comparison, setComparison] = useState({
    waitFinishDay: "",
    waitCost: "",
    alternateFinishDay: "",
    alternateCost: "",
  });
  if (state.phase === "review")
    return <Review state={state} dispatch={dispatch} onClose={onClose} />;
  const ready = getScheduleRecommendationError(state),
    choice = state.schedule!.choice;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !choice ||
      !confidence ||
      !nextCheck ||
      Object.values(comparison).some(
        (v) => v.trim() === "" || !Number.isFinite(Number(v)) || Number(v) < 0,
      )
    ) {
      setError(
        "Complete your confidence, checkpoint, both forecast days and both costs.",
      );
      return;
    }
    setError("");
    dispatch({
      type: "submitScheduleRecommendation",
      option: choice,
      confidence,
      nextCheck,
      comparison: {
        waitFinishDay: Number(comparison.waitFinishDay),
        waitCost: Number(comparison.waitCost),
        alternateFinishDay: Number(comparison.alternateFinishDay),
        alternateCost: Number(comparison.alternateCost),
      },
    });
  }
  return (
    <>
      <p>
        Your verified survey plan affects two teams and the pour. Present a
        recommendation with a forecast, cost and decision owner.
      </p>
      {ready && <div className="pq-help">{ready}</div>}
      <p className="pq-commitment">
        {choice
          ? "Your response is committed. Complete the supporting record before submitting."
          : "Selecting a response commits it and greys out the alternatives for this assignment."}
      </p>
      <div className="pq-choice-grid">
        {options.map((id, index) => (
          <button
            key={id}
            className="pq-choice"
            aria-label={DAY2.options[id].label}
            aria-pressed={choice === id}
            disabled={!!ready || choice !== null}
            onClick={() =>
              dispatch({ type: "chooseScheduleRecommendation", option: id })
            }
          >
            {choice === id && (
              <span className="pq-choice-status">Selected · committed</span>
            )}
            <span className="pq-choice-index">RESPONSE 0{index + 1}</span>
            <strong>{DAY2.options[id].label}</strong>
            <span>{DAY2.options[id].description}</span>
          </button>
        ))}
      </div>
      <form className="pq-form" noValidate onSubmit={submit}>
        <label className="pq-field">
          Forecast confidence
          <select
            aria-label="Day 2 forecast confidence"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as typeof confidence)}
          >
            <option value="">Separate forecast from guarantee</option>
            <option value="estimate">Conditional working forecast</option>
            <option value="guaranteed">Guaranteed finish date</option>
          </select>
        </label>
        <label className="pq-field">
          Verification checkpoint
          <input
            aria-label="Day 2 verification checkpoint"
            type="time"
            value={nextCheck}
            onChange={(e) => setNextCheck(e.target.value)}
          />
        </label>
        {(
          [
            ["waitFinishDay", "Revised-sequence forecast day"],
            ["waitCost", "Revised-sequence extra cost"],
            ["alternateFinishDay", "Extra-team forecast day"],
            ["alternateCost", "Extra-team extra cost"],
          ] as const
        ).map(([key, label]) => (
          <label className="pq-field" key={key}>
            {label}
            <input
              aria-label={label}
              type="number"
              min={key.endsWith("Day") ? 1 : 0}
              value={comparison[key]}
              onChange={(e) =>
                setComparison((c) => ({ ...c, [key]: e.target.value }))
              }
            />
          </label>
        ))}
        <p className="quiet pq-full">
          Use the response estimates in your inspected schedule. Record both
          alternatives so Alex can assess the trade-off.
        </p>
        {error && (
          <div role="alert" className="pq-errors pq-full">
            {error}
          </div>
        )}
        <div className="pq-actions pq-full">
          <button
            className="primary"
            disabled={!!ready || !choice}
            type="submit"
          >
            Submit schedule recommendation <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </>
  );
}
function Review({ state, dispatch, onClose }: Interaction) {
  const proposal = state.schedule!.proposal;
  if (!proposal) return null;
  const answers = [
    [
      "conditional",
      "Keep the forecast conditional and request Alex’s approval",
      "Sam verifies capacity and Taylor retains acceptance gates at 11:00.",
    ],
    [
      "guarantee",
      "Guarantee the date without conditions",
      "Give certainty despite the remaining planning and approval conditions.",
    ],
    [
      "defer",
      "Leave the confidence explanation to Alex",
      "Defer responsibility for explaining the forecast and follow-up.",
    ],
  ] as const;
  return (
    <>
      <blockquote className="pq-speech">
        “Why does this survey affect two teams, how confident is this forecast,
        and who may approve the added cost?”
      </blockquote>
      <article className="pq-register">
        <h3>{DAY2.options[proposal.option].label}</h3>
        <p>
          Revised sequence: Day {proposal.comparison.waitFinishDay} /{" "}
          {money(proposal.comparison.waitCost)}. Support: Day{" "}
          {proposal.comparison.alternateFinishDay} /{" "}
          {money(proposal.comparison.alternateCost)}.
        </p>
        <p>
          Confidence: {proposal.confidence}. Next check: {proposal.nextCheck}.
        </p>
      </article>
      <p className="pq-commitment">
        {state.reviewAnswer
          ? "Your answer is committed."
          : "Selecting your answer commits it; the alternatives lock."}
      </p>
      <div className="pq-choice-grid">
        {answers.map(([answer, label, description]) => (
          <button
            className="pq-choice"
            key={answer}
            aria-label={label}
            aria-pressed={state.reviewAnswer === answer}
            disabled={state.reviewAnswer !== null}
            onClick={() => dispatch({ type: "answerReview", answer })}
          >
            {state.reviewAnswer === answer && (
              <span className="pq-choice-status">Selected · committed</span>
            )}
            <strong>{label}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
      {state.reviewAnswer && (
        <>
          <div className="pq-help">
            {proposal.approval === "conditional"
              ? "Alex conditionally approved support; capacity and acceptance must be verified before spending."
              : proposal.approval === "approved"
                ? "Alex approved the revised sequence and team follow-up."
                : "Alex rejected the unsupported assurance or bypass. Advance to see the consequence."}
          </div>
          <button
            className="primary"
            onClick={() => dispatch({ type: "advanceTime" })}
          >
            Advance to 11:00 <span aria-hidden="true">→</span>
          </button>
        </>
      )}
      <button className="secondary" onClick={onClose}>
        Return to workplace
      </button>
    </>
  );
}
function Debrief({
  state,
  onClose,
  onReplay,
  onMenu,
}: Pick<GamePanelProps, "state" | "onClose" | "onReplay" | "onMenu">) {
  const feedback = getFeedback(state);
  if (!feedback)
    return <p>Complete the review and checkpoint to see your case study.</p>;
  return (
    <>
      <article className="pq-outcome">
        <p className="pq-step">DAY 2 · CASE STUDY RECORDED</p>
        <h3>{feedback.title}</h3>
        <p>{feedback.summary}</p>
      </article>
      <div className="pq-metrics">
        <div className="pq-stat">
          <small>Carried → current forecast</small>
          <strong>
            {state.schedule!.carriedForecastDay} →{" "}
            {state.project.forecastFinishDay}
          </strong>
          <span>Day 1 impact retained</span>
        </div>
        <div className="pq-stat">
          <small>Cumulative actual cost</small>
          <strong>{money(state.project.actualCost)}</strong>
          <span>Both assignments</span>
        </div>
        <div className="pq-stat">
          <small>Stakeholder trust</small>
          <strong>{state.project.stakeholderTrust} / 100</strong>
          <span>Consequences carry forward</span>
        </div>
        <div className="pq-stat">
          <small>Mission / career XP</small>
          <strong>
            +{feedback.xpEarned} / {state.career.xp}
          </strong>
          <span>Intern role retained</span>
        </div>
      </div>
      <div className="pq-rubric">
        {feedback.criteria.map((c) => (
          <article key={c.id}>
            <header>
              <h3>{c.label}</h3>
              <strong>
                {c.score}
                <small> / 3</small>
              </strong>
            </header>
            <p>{c.detail}</p>
            <ul className="pq-citations">
              {c.citations.map((e) => (
                <li key={e.seq}>
                  #{e.seq} · {e.summary}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="pq-reflection">
        <h3>Think it through</h3>
        <p>{feedback.reflection}</p>
      </div>
      <p className="pq-informational">
        {feedback.next} Replaying Day 2 starts from your actual Day 1 outcome
        and replaces the Day 2 practice result; it does not accumulate extra
        rewards.
      </p>
      <div className="pq-actions">
        <button className="primary" onClick={onClose}>
          Explore the workplace
        </button>
        <button className="secondary" onClick={onReplay}>
          Replay Day 2
        </button>
        <button className="secondary" onClick={onMenu}>
          Main menu
        </button>
      </div>
    </>
  );
}

export default function Day2Panel({
  kind,
  state,
  dispatch,
  onClose,
  onReplay,
  onMenu,
}: GamePanelProps) {
  const titles: Partial<Record<GamePanelProps["kind"], string>> = {
    mentor: "A small task. Two waiting teams.",
    board: "Your dependency planning tablet",
    lead: "Trace the delay with Sam",
    supplier: "Check support capacity",
    safety: "Keep the acceptance gates",
    report: "Present the revised sequence",
    journal: "Day 2 mission journal",
    debrief: "The sequence. The consequence.",
  };
  return (
    <Dialog
      title={titles[kind] ?? DAY2.title}
      eyebrow={`CONSTRUCTION · DAY 2 · ${DAY2.title.toUpperCase()}`}
      wide={["board", "report", "debrief"].includes(kind)}
      variant={
        kind === "board" ? "tablet" : kind === "journal" ? "journal" : "panel"
      }
      status={`DAY ${state.day} · ${String(Math.floor(state.minutes / 60)).padStart(2, "0")}:${String(state.minutes % 60).padStart(2, "0")}`}
      onClose={onClose}
    >
      {kind === "mentor" && (
        <Mentor state={state} dispatch={dispatch} onClose={onClose} />
      )}{" "}
      {kind === "board" && <Board state={state} dispatch={dispatch} />}{" "}
      {["lead", "supplier", "safety"].includes(kind) && (
        <Conversation
          npc={kind as NpcId}
          state={state}
          dispatch={dispatch}
          onClose={onClose}
        />
      )}{" "}
      {kind === "report" && (
        <Recommendation state={state} dispatch={dispatch} onClose={onClose} />
      )}{" "}
      {kind === "journal" && <MissionJournal state={state} />}{" "}
      {kind === "debrief" && (
        <Debrief
          state={state}
          onClose={onClose}
          onReplay={onReplay}
          onMenu={onMenu}
        />
      )}
    </Dialog>
  );
}
