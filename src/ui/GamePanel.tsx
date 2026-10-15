import { useState, type FormEvent } from "react";
import {
  getFeedback,
  getObjectives,
  getPack,
  type Command,
  type GameState,
  type SourceId,
} from "../game/index";
import Dialog from "./Dialog";
import "./panels.css";

export type PanelKind =
  | "mentor"
  | "board"
  | "lead"
  | "supplier"
  | "safety"
  | "report"
  | "journal"
  | "career"
  | "settings"
  | "debrief";
export interface GamePanelProps {
  kind: PanelKind;
  state: GameState;
  dispatch: (command: Command) => void;
  onClose: () => void;
  onReplay: () => void;
  onMenu: () => void;
}
type InteractionProps = Pick<GamePanelProps, "state" | "dispatch" | "onClose">;
const pack = getPack();
const sourceOrder: SourceId[] = ["schedule", "lead", "supplier", "safety"];
const sourceLabels: Record<SourceId, string> = {
  schedule: "Schedule",
  lead: "Sam · crews",
  supplier: "Morgan · supplier",
  safety: "Taylor · acceptance",
};
const credits = (value: number) => `${value.toLocaleString("en-US")} cr`;
const statusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Complete",
};

function SourceRecord({ source }: { source: SourceId }) {
  const record = pack.sources[source];
  return (
    <article className="pq-source">
      <h3>Source record · {record.title}</h3>
      <ul>
        {record.detail.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
      <small>{record.provenance}</small>
    </article>
  );
}

function EvidenceInputs({
  available,
  selected,
  onChange,
}: {
  available: SourceId[];
  selected: SourceId[];
  onChange: (sources: SourceId[]) => void;
}) {
  return (
    <fieldset className="pq-full">
      <legend>Source evidence</legend>
      <div className="pq-evidence-list">
        {sourceOrder.map((source) => (
          <label key={source}>
            <input
              aria-label={sourceLabels[source]}
              type="checkbox"
              checked={selected.includes(source)}
              disabled={!available.includes(source)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, source]
                    : selected.filter((entry) => entry !== source),
                )
              }
            />
            {sourceLabels[source]}
            {!available.includes(source) && " · not inspected"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Mentor({ state, dispatch, onClose }: InteractionProps) {
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
          <small>Senior Project Manager · your mentor</small>
        </div>
      </div>
      <blockquote className="pq-speech">
        {state.phase === "arrival"
          ? `Welcome to the team, ${state.profile.name}. There’s a real problem waiting for us this morning. Let’s start with what we know.`
          : state.phase === "debrief"
            ? "Your first assignment is recorded. Look at what changed, and the evidence behind each result. One mission starts your career; it does not decide it."
            : "A good update helps someone make a decision. Tell me what is confirmed, what is an estimate, who is affected, and what you recommend."}
      </blockquote>
      {state.phase === "arrival" ? (
        <>
          <p>{pack.mission.briefing}</p>
          <div className="pq-help">
            Your authority: gather evidence, update project records and
            recommend. Alex approves any procurement change.
          </div>
          <div className="pq-actions">
            <button
              className="primary"
              onClick={() => dispatch({ type: "brief" })}
            >
              Accept the assignment <span>↗</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>Your next steps</h3>
          <ul className="pq-list">
            {getObjectives(state)
              .filter((objective) => !objective.complete)
              .slice(0, 3)
              .map((objective) => (
                <li className="pq-objective" key={objective.id}>
                  <span className="pq-check" aria-hidden="true">
                    ○
                  </span>
                  {objective.label}
                </li>
              ))}
          </ul>
          {state.profile.assistance === "guided" && (
            <details className="pq-help">
              <summary>Why investigate before updating?</summary>
              <p>
                Sam knows how crews and successor tasks are affected. Morgan
                knows the delivery estimate. The schedule is the approved
                baseline. Check all three so your issue separates facts from
                assumptions.
              </p>
            </details>
          )}
          <div className="pq-actions">
            <button className="primary" onClick={onClose}>
              Back to the workplace <span>↗</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}

function Conversation({
  kind,
  state,
  dispatch,
  onClose,
}: InteractionProps & { kind: "lead" | "supplier" | "safety" }) {
  const [response, setResponse] = useState<"facts" | "pressure" | null>(
    state.evidence.includes(kind) ? "facts" : null,
  );
  const npc = pack.npcs[kind];
  const names = {
    lead: [
      "Ask about crews and dependencies",
      "Ask Sam to hold the original deadline",
    ],
    supplier: [
      "Ask for delivery evidence and confidence",
      "Ask Morgan for a firm guarantee",
    ],
    safety: [
      "Ask about alternate delivery checks",
      "Ask Taylor to prioritise the original date",
    ],
  };
  const enabled = state.phase === "investigating";
  const speak = (choice: "facts" | "pressure") => {
    dispatch({ type: "ask", npc: kind, choice });
    if (enabled) setResponse(choice);
  };
  return (
    <>
      <div className="pq-person">
        <span className="pq-person-avatar" aria-hidden="true">
          {npc.name[0]}
        </span>
        <div>
          <strong>{npc.name}</strong>
          <small>{npc.role}</small>
        </div>
      </div>
      <blockquote className="pq-speech">
        {response === "facts"
          ? npc.facts
          : response === "pressure"
            ? npc.pressure
            : npc.greeting}
      </blockquote>
      {state.phase === "arrival" && (
        <div className="pq-help">
          Meet Alex in the office to receive your assignment first.
        </div>
      )}
      {enabled && (
        <div className="pq-choice-grid">
          <button
            className="pq-choice"
            aria-label={names[kind][0]}
            onClick={() => speak("facts")}
          >
            <strong>{names[kind][0]}</strong>
            <span>
              {kind === "lead"
                ? "Understand the affected work and what the team can do next."
                : kind === "supplier"
                  ? "Separate confirmed information from the estimated arrival."
                  : "Understand who reviews materials and what approval requires."}
            </span>
          </button>
          <button
            className="pq-choice"
            aria-label={names[kind][1]}
            onClick={() => speak("pressure")}
          >
            <strong>{names[kind][1]}</strong>
            <span>
              {kind === "safety"
                ? "Explore whether speed changes the review conditions."
                : "Emphasise the meeting deadline and ask for certainty."}
            </span>
          </button>
        </div>
      )}
      {state.evidence.includes(kind) && <SourceRecord source={kind} />}
      <div className="pq-actions">
        <button className="secondary" onClick={onClose}>
          Return to workplace
        </button>
      </div>
    </>
  );
}

function TaskEditor({
  state,
  dispatch,
}: Pick<InteractionProps, "state" | "dispatch">) {
  const task = state.tasks.find((entry) => entry.id === "delivery")!;
  const [status, setStatus] = useState<"blocked" | "in_progress" | "done" | "">(
    "",
  );
  const [owner, setOwner] = useState<string>(task.owner);
  const [dueDay, setDueDay] = useState(String(task.dueDay));
  const [blocker, setBlocker] = useState("");
  const [evidence, setEvidence] = useState<SourceId[]>(
    task.evidence.length ? task.evidence : state.evidence,
  );
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !status ||
      !["Sam", "Morgan", "Alex"].includes(owner) ||
      !Number.isInteger(Number(dueDay)) ||
      Number(dueDay) < 1 ||
      !blocker.trim() ||
      !evidence.length
    ) {
      setError(
        "Choose a status and owner, enter a whole due day, describe the blocker, and attach at least one inspected source.",
      );
      return;
    }
    setError("");
    dispatch({
      type: "updateTask",
      taskId: "delivery",
      status,
      owner: owner as "Sam" | "Morgan" | "Alex",
      dueDay: Number(dueDay),
      blocker,
      evidence,
    });
  };
  return (
    <form className="pq-form" onSubmit={submit} noValidate>
      <h3 className="pq-full">Update the concrete delivery card</h3>
      <label className="pq-field">
        Task status
        <select
          aria-label="Task status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          required
        >
          <option value="">Choose a status</option>
          <option value="blocked">Blocked</option>
          <option value="in_progress">In progress</option>
          <option value="done">Complete</option>
        </select>
      </label>
      <label className="pq-field">
        Task owner
        <select
          aria-label="Task owner"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          required
        >
          <option value="">Choose an owner</option>
          <option value="Morgan">Morgan · supplier</option>
          <option value="Sam">Sam · delivery lead</option>
          <option value="Alex">Alex · project manager</option>
        </select>
      </label>
      <label className="pq-field">
        Task due day
        <input
          aria-label="Task due day"
          type="number"
          min="1"
          max="30"
          step="1"
          value={dueDay}
          onChange={(event) => setDueDay(event.target.value)}
          required
        />
        <span>
          Keep a realistic date; only Alex can change the approved baseline.
        </span>
      </label>
      <label className="pq-field">
        Blocker / evidence summary
        <input
          value={blocker}
          onChange={(event) => setBlocker(event.target.value)}
          maxLength={300}
          placeholder="What prevents the work from proceeding?"
          required
        />
      </label>
      <EvidenceInputs
        available={state.evidence}
        selected={evidence}
        onChange={setEvidence}
      />
      {error && (
        <div className="pq-errors pq-full" role="alert">
          {error}
        </div>
      )}
      <div className="pq-actions pq-full">
        <button className="primary" type="submit">
          Save delivery update <span>↗</span>
        </button>
      </div>
    </form>
  );
}

function IssueEditor({
  state,
  dispatch,
}: Pick<InteractionProps, "state" | "dispatch">) {
  const [title, setTitle] = useState(state.issue?.title ?? "");
  const [owner, setOwner] = useState<string>(state.issue?.owner ?? "");
  const [severity, setSeverity] = useState<string>(state.issue?.severity ?? "");
  const [dueDay, setDueDay] = useState(
    state.issue ? String(state.issue.dueDay) : "",
  );
  const [impact, setImpact] = useState<string>(state.issue?.impact ?? "");
  const [uncertainty, setUncertainty] = useState<string>(
    state.issue?.uncertainty ?? "",
  );
  const [nextCheck, setNextCheck] = useState(state.issue?.nextCheck ?? "");
  const [evidence, setEvidence] = useState<SourceId[]>(
    state.issue?.evidence ?? state.evidence,
  );
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !title.trim() ||
      !["Sam", "Morgan", "Alex"].includes(owner) ||
      !["low", "medium", "high"].includes(severity) ||
      !Number.isInteger(Number(dueDay)) ||
      Number(dueDay) < 1 ||
      !["foundation", "delivery"].includes(impact) ||
      !["estimate", "guaranteed"].includes(uncertainty) ||
      !nextCheck.trim() ||
      !evidence.length
    ) {
      setError(
        "Complete every issue field and attach at least one inspected source. Include an owner, due day, affected work, confidence and next check.",
      );
      return;
    }
    setError("");
    dispatch({
      type: "logIssue",
      issue: {
        title,
        owner: owner as "Sam" | "Morgan" | "Alex",
        severity: severity as "low" | "medium" | "high",
        dueDay: Number(dueDay),
        impact: impact as "foundation" | "delivery",
        uncertainty: uncertainty as "estimate" | "guaranteed",
        nextCheck,
        evidence,
      },
    });
  };
  return (
    <>
      {state.issue && (
        <article className="pq-register">
          <h3>Recorded issue · {state.issue.title}</h3>
          <dl>
            <dt>Accountable</dt>
            <dd>
              {state.issue.owner} · Day {state.issue.dueDay}
            </dd>
            <dt>Impact</dt>
            <dd>
              {state.issue.impact === "foundation"
                ? "Foundations and successor framing"
                : "Delivery only"}
            </dd>
            <dt>Next check</dt>
            <dd>
              {state.issue.nextCheck} ·{" "}
              {state.issue.uncertainty === "estimate"
                ? "Arrival remains an estimate"
                : "Arrival recorded as guaranteed"}
            </dd>
          </dl>
        </article>
      )}
      <p>
        An issue has already happened. Record what is known and who will follow
        up, without treating an estimate as a delivery confirmation.
      </p>
      <form className="pq-form" onSubmit={submit} noValidate>
        <label className="pq-field pq-full">
          Issue title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summarise the concrete delivery issue"
            maxLength={160}
            required
          />
        </label>
        <label className="pq-field">
          Issue owner
          <select
            aria-label="Issue owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            required
          >
            <option value="">Assign the follow-up owner</option>
            <option value="Sam">Sam · delivery lead</option>
            <option value="Morgan">Morgan · supplier</option>
            <option value="Alex">Alex · project manager</option>
          </select>
        </label>
        <label className="pq-field">
          Severity
          <select
            aria-label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            required
          >
            <option value="">Assess severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="pq-field">
          Due day
          <input
            type="number"
            min="1"
            max="30"
            step="1"
            value={dueDay}
            onChange={(event) => setDueDay(event.target.value)}
            placeholder="e.g. 1"
            required
          />
        </label>
        <label className="pq-field">
          Affected work
          <select
            aria-label="Affected work"
            value={impact}
            onChange={(event) => setImpact(event.target.value)}
            required
          >
            <option value="">Trace the impact</option>
            <option value="delivery">Concrete delivery only</option>
            <option value="foundation">
              Foundations and successor framing
            </option>
          </select>
        </label>
        <label className="pq-field">
          Confidence
          <select
            aria-label="Confidence"
            value={uncertainty}
            onChange={(event) => setUncertainty(event.target.value)}
            required
          >
            <option value="">Separate fact from assumption</option>
            <option value="estimate">Arrival is an estimate</option>
            <option value="guaranteed">Arrival is guaranteed</option>
          </select>
        </label>
        <label className="pq-field">
          Next check
          <input
            aria-label="Next check"
            type="time"
            value={nextCheck}
            onChange={(event) => setNextCheck(event.target.value)}
            required
          />
          <span>Use the verification time agreed with Morgan.</span>
        </label>
        <EvidenceInputs
          available={state.evidence}
          selected={evidence}
          onChange={setEvidence}
        />
        {error && (
          <div className="pq-errors pq-full" role="alert">
            {error}
          </div>
        )}
        <div className="pq-actions pq-full">
          <button className="primary" type="submit">
            {state.issue ? "Update issue record" : "Log issue"} <span>↗</span>
          </button>
        </div>
      </form>
    </>
  );
}

function Schedule({
  state,
  dispatch,
}: Pick<InteractionProps, "state" | "dispatch">) {
  const inspected = state.evidence.includes("schedule");
  return (
    <>
      <div className="pq-schedule-summary">
        <div className="pq-stat">
          <small>Approved baseline</small>
          <strong>Day {state.project.baselineFinishDay}</strong>
          <span>Foundation milestone</span>
        </div>
        <div className="pq-stat">
          <small>Current forecast</small>
          <strong>Day {state.project.forecastFinishDay}</strong>
          <span>
            {state.project.delivery === "unconfirmed"
              ? "Delivery not confirmed"
              : state.project.delivery === "late"
                ? "Delivery delay resolved in forecast"
                : "Delivery confirmed at checkpoint"}
          </span>
        </div>
        <div className="pq-stat">
          <small>Budget baseline</small>
          <strong>{credits(state.project.budgetBaseline)}</strong>
          <span>Fictional project credits</span>
        </div>
      </div>
      <div className="pq-dependencies">
        <div>
          <strong>01 · Concrete delivery</strong>
          <small>Receipt required</small>
        </div>
        <span aria-label="blocks">→</span>
        <div>
          <strong>02 · Foundations</strong>
          <small>No spare float</small>
        </div>
        <span aria-label="blocks">→</span>
        <div>
          <strong>03 · Framing</strong>
          <small>Finish-to-start link</small>
        </div>
      </div>
      <p>
        A delayed predecessor can move every successor. Your card update records
        an issue; it does not change the approved baseline or make materials
        arrive.
      </p>
      {!inspected && (
        <div className="pq-actions">
          <button
            className="primary"
            disabled={state.phase !== "investigating"}
            onClick={() => dispatch({ type: "inspect", source: "schedule" })}
          >
            Inspect schedule <span>↗</span>
          </button>
        </div>
      )}
      {inspected && <SourceRecord source="schedule" />}
      <h3 className="pq-section-heading">Compare the response estimates</h3>
      <table className="pq-table">
        <thead>
          <tr>
            <th>Response</th>
            <th>Forecast</th>
            <th>Extra cost</th>
            <th>Decision conditions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Wait + contingency</strong>
            </td>
            <td>Day 13</td>
            <td>400 cr</td>
            <td>Notify crews; verify at 10:30</td>
          </tr>
          <tr>
            <td>
              <strong>Alternate supplier</strong>
            </td>
            <td>Day 12</td>
            <td>2,000 cr</td>
            <td>Alex approval + Taylor acceptance check</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function Board({
  state,
  dispatch,
}: Pick<InteractionProps, "state" | "dispatch">) {
  const [tab, setTab] = useState<"tasks" | "schedule" | "issues">("tasks");
  const editable = state.phase === "investigating";
  const tabs = ["tasks", "schedule", "issues"] as const;
  return (
    <>
      <div
        className="pq-tabs"
        role="tablist"
        aria-label="Project tablet tools"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const index = tabs.indexOf(tab);
          const next =
            tabs[
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      tabs.length) %
                    tabs.length
            ];
          setTab(next);
          document.getElementById(`pq-tab-${next}`)?.focus();
        }}
      >
        {tabs.map((id) => (
          <button
            key={id}
            id={`pq-tab-${id}`}
            role="tab"
            tabIndex={tab === id ? 0 : -1}
            aria-selected={tab === id}
            aria-controls={`pq-tabpanel-${id}`}
            onClick={() => setTab(id)}
          >
            {id === "tasks"
              ? "Tasks"
              : id === "schedule"
                ? "Schedule"
                : "Issue register"}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`pq-tabpanel-${tab}`}
        aria-labelledby={`pq-tab-${tab}`}
      >
        {tab === "tasks" && (
          <>
            <div className="pq-task-grid">
              {state.tasks.map((task, index) => (
                <article className="pq-task" key={task.id}>
                  <span className="pq-task-step">
                    WORK PACKAGE 0{index + 1}
                  </span>
                  <h3>{task.title}</h3>
                  <span
                    className={`pq-chip${task.status === "blocked" ? " pq-chip-alert" : " pq-chip-neutral"}`}
                  >
                    {statusLabels[task.status]}
                  </span>
                  <p>
                    {task.owner} · Due Day {task.dueDay}
                  </p>
                  <p>
                    {task.dependencies.length
                      ? `Depends on ${task.dependencies.join(", ")}`
                      : "First dependency in the chain"}
                  </p>
                  <details>
                    <summary>Acceptance & sources</summary>
                    <p>{task.acceptance}</p>
                    <p>
                      {task.evidence.length
                        ? task.evidence
                            .map((source) => sourceLabels[source])
                            .join(" · ")
                        : "No evidence attached yet"}
                    </p>
                    {task.blocker && <p>{task.blocker}</p>}
                  </details>
                </article>
              ))}
            </div>
            {editable ? (
              <TaskEditor state={state} dispatch={dispatch} />
            ) : (
              <div className="pq-help">
                {state.phase === "arrival"
                  ? "Meet Alex to receive your task before changing project records."
                  : "The submitted records are retained for your mentor review and debrief."}
              </div>
            )}
          </>
        )}
        {tab === "schedule" && <Schedule state={state} dispatch={dispatch} />}
        {tab === "issues" &&
          (editable ? (
            <IssueEditor state={state} dispatch={dispatch} />
          ) : state.issue ? (
            <article className="pq-register">
              <h3>{state.issue.title}</h3>
              <dl>
                <dt>Owner</dt>
                <dd>{state.issue.owner}</dd>
                <dt>Due</dt>
                <dd>Day {state.issue.dueDay}</dd>
                <dt>Next check</dt>
                <dd>{state.issue.nextCheck}</dd>
                <dt>Sources</dt>
                <dd>
                  {state.issue.evidence
                    .map((source) => sourceLabels[source])
                    .join(" · ")}
                </dd>
              </dl>
            </article>
          ) : (
            <div className="pq-empty">
              No issue recorded. Receive your assignment from Alex before using
              the register.
            </div>
          ))}
      </div>
    </>
  );
}

function Recommendation({ state, dispatch, onClose }: InteractionProps) {
  const [option, setOption] = useState<
    "wait" | "alternate" | "promise" | "unauthorised" | null
  >(null);
  const [confidence, setConfidence] = useState<"estimate" | "guaranteed" | "">(
    "",
  );
  const [impact, setImpact] = useState<"foundation" | "delivery" | "">("");
  const [nextCheck, setNextCheck] = useState("");
  const [comparisonFields, setComparisonFields] = useState({
    waitFinishDay: "",
    waitCost: "",
    alternateFinishDay: "",
    alternateCost: "",
  });
  const [error, setError] = useState("");
  if (state.phase === "review")
    return <Review state={state} dispatch={dispatch} onClose={onClose} />;
  const ready =
    ["schedule", "lead", "supplier"].every((source) =>
      state.evidence.includes(source as SourceId),
    ) &&
    Boolean(state.issue) &&
    Boolean(
      state.tasks.find((task) => task.id === "delivery")?.evidence.length,
    );
  const descriptions = {
    wait: "Retain the current supplier. Notify the crews, verify at 10:30, and resequence preparatory work if delayed. Forecast Day 13; +400 cr standby cost.",
    alternate:
      "Recommend an alternate to Alex. Forecast Day 12; +2,000 cr. Procurement approval and Taylor’s acceptance check remain conditions.",
    promise:
      "Reassure the team that the original date is firm. This removes uncertainty from your message even though Morgan gave an estimated arrival.",
    unauthorised:
      "Try to place the alternate order immediately. This prioritises speed and commits extra cost; Alex normally owns the spending decision.",
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!option || !confidence || !impact || !nextCheck) {
      setError(
        "Choose a response and complete your confidence, affected work and verification time.",
      );
      return;
    }
    const entries = Object.values(comparisonFields);
    const entered = entries.filter((value) => value.trim() !== "").length;
    if (entered > 0 && entered < 4) {
      setError(
        "Complete all four comparison fields, or leave all four blank. Both response estimates need a finish day and an extra cost.",
      );
      return;
    }
    if (
      entered === 4 &&
      entries.some(
        (value) => !Number.isInteger(Number(value)) || Number(value) < 0,
      )
    ) {
      setError(
        "Comparison values must be whole, non-negative numbers. Forecast days must be between 1 and 30.",
      );
      return;
    }
    if (
      entered === 4 &&
      (Number(comparisonFields.waitFinishDay) < 1 ||
        Number(comparisonFields.waitFinishDay) > 30 ||
        Number(comparisonFields.alternateFinishDay) < 1 ||
        Number(comparisonFields.alternateFinishDay) > 30 ||
        Number(comparisonFields.waitCost) > 100000 ||
        Number(comparisonFields.alternateCost) > 100000)
    ) {
      setError(
        "Use forecast days from 1 to 30 and extra costs from 0 to 100,000 fictional credits.",
      );
      return;
    }
    const comparison =
      entered === 4
        ? {
            waitFinishDay: Number(comparisonFields.waitFinishDay),
            waitCost: Number(comparisonFields.waitCost),
            alternateFinishDay: Number(comparisonFields.alternateFinishDay),
            alternateCost: Number(comparisonFields.alternateCost),
          }
        : undefined;
    setError("");
    dispatch({
      type: "submitRecommendation",
      option,
      confidence,
      impact,
      nextCheck,
      ...(comparison ? { comparison } : {}),
    });
  };
  return (
    <>
      <div className="pq-person">
        <span className="pq-person-avatar" aria-hidden="true">
          A
        </span>
        <div>
          <strong>Alex Chen</strong>
          <small>Coordination review · recommendations, not orders</small>
        </div>
      </div>
      <blockquote className="pq-speech">
        What do you recommend? Show me the evidence, what it means for the work,
        and when we should verify the next update.
      </blockquote>
      {!ready && (
        <div className="pq-help">
          Before submitting: inspect the schedule, speak to Sam and Morgan,
          update the delivery card, and record your issue. Your journal tracks
          the missing steps.
        </div>
      )}
      <div className="pq-report-context">
        {sourceOrder.map((source) => (
          <span
            key={source}
            className={`pq-chip${!state.evidence.includes(source) ? " pq-chip-neutral" : ""}`}
          >
            {state.evidence.includes(source) ? "✓" : "○"} {sourceLabels[source]}
          </span>
        ))}
      </div>
      <form onSubmit={submit} noValidate>
        <div className="pq-option-grid">
          {(["wait", "alternate", "promise", "unauthorised"] as const).map(
            (id, index) => (
              <button
                key={id}
                type="button"
                className="pq-choice"
                aria-label={pack.options[id].label}
                aria-pressed={option === id}
                onClick={() => setOption(id)}
                disabled={state.phase !== "investigating"}
              >
                <span className="pq-choice-index">RESPONSE 0{index + 1}</span>
                <strong>{pack.options[id].label}</strong>
                <span>{descriptions[id]}</span>
              </button>
            ),
          )}
        </div>
        <details className="pq-comparison">
          <summary>
            Compare alternatives <span>Optional · record the trade-off</span>
          </summary>
          <p>
            Use the source estimates in the Schedule tab. Record the foundation
            finish day and additional cost for both responses so Alex can
            compare them.
          </p>
          <div className="pq-form">
            {(
              [
                ["waitFinishDay", "Wait forecast day", 1, 30],
                ["waitCost", "Wait extra cost", 0, 100000],
                ["alternateFinishDay", "Alternate forecast day", 1, 30],
                ["alternateCost", "Alternate extra cost", 0, 100000],
              ] as const
            ).map(([id, label, min, max]) => (
              <label className="pq-field" key={id}>
                {label}
                <input
                  aria-label={label}
                  type="number"
                  min={min}
                  max={max}
                  step="1"
                  value={comparisonFields[id]}
                  onChange={(event) =>
                    setComparisonFields((current) => ({
                      ...current,
                      [id]: event.target.value,
                    }))
                  }
                  placeholder={
                    id.endsWith("Cost")
                      ? "Fictional credits"
                      : "Foundation finish day"
                  }
                />
              </label>
            ))}
          </div>
        </details>
        <div className="pq-form" style={{ marginTop: 22 }}>
          <label className="pq-field">
            Recommendation confidence
            <select
              aria-label="Recommendation confidence"
              value={confidence}
              onChange={(event) =>
                setConfidence(event.target.value as typeof confidence)
              }
              required
            >
              <option value="">Choose your wording</option>
              <option value="estimate">Arrival is an estimate</option>
              <option value="guaranteed">Arrival is guaranteed</option>
            </select>
          </label>
          <label className="pq-field">
            Recommendation impact
            <select
              aria-label="Recommendation impact"
              value={impact}
              onChange={(event) =>
                setImpact(event.target.value as typeof impact)
              }
              required
            >
              <option value="">State the affected work</option>
              <option value="delivery">Delivery only</option>
              <option value="foundation">
                Foundations and successor framing
              </option>
            </select>
          </label>
          <label className="pq-field">
            Recommendation next check
            <input
              type="time"
              value={nextCheck}
              onChange={(event) => setNextCheck(event.target.value)}
              required
            />
          </label>
          <div className="pq-field">
            <span>
              Your recommendation stays subject to review. Project time advances
              only when you choose the checkpoint.
            </span>
          </div>
          {error && (
            <div className="pq-errors pq-full" role="alert">
              {error}
            </div>
          )}
          <div className="pq-actions pq-full">
            <button
              className="primary"
              type="submit"
              disabled={!ready || state.phase !== "investigating"}
            >
              Submit recommendation <span>↗</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

function Review({ state, dispatch, onClose }: InteractionProps) {
  const answered = state.reviewAnswer !== null;
  return (
    <>
      <div className="pq-person">
        <span className="pq-person-avatar" aria-hidden="true">
          A
        </span>
        <div>
          <strong>Alex Chen</strong>
          <small>
            Mentor review ·{" "}
            {state.proposal && pack.options[state.proposal.option].label}
          </small>
        </div>
      </div>
      <blockquote className="pq-speech">
        The replacement arrival is an estimate. What must happen before we tell
        the team that the delivery—and our plan—are confirmed?
      </blockquote>
      {state.proposal?.comparison && (
        <div className="pq-register">
          <h3>Your recorded alternative comparison</h3>
          <table className="pq-table">
            <thead>
              <tr>
                <th>Response</th>
                <th>Forecast finish</th>
                <th>Extra cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Wait + contingency</td>
                <td>Day {state.proposal.comparison.waitFinishDay}</td>
                <td>{credits(state.proposal.comparison.waitCost)}</td>
              </tr>
              <tr>
                <td>Approved alternate</td>
                <td>Day {state.proposal.comparison.alternateFinishDay}</td>
                <td>{credits(state.proposal.comparison.alternateCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {!answered ? (
        <div className="pq-choice-grid">
          <button
            className="pq-choice"
            aria-label="Verify at 10:30 and keep the plan conditional"
            onClick={() =>
              dispatch({ type: "answerReview", answer: "conditional" })
            }
          >
            <strong>Verify at 10:30 and keep the plan conditional</strong>
            <span>
              Confirm with Morgan and Sam. Any alternate needs your cost
              approval and Taylor’s acceptance check; notify crews and
              resequence if the delivery misses.
            </span>
          </button>
          <button
            className="pq-choice"
            aria-label="Treat the replacement estimate as confirmed"
            onClick={() =>
              dispatch({ type: "answerReview", answer: "guarantee" })
            }
          >
            <strong>Treat the replacement estimate as confirmed</strong>
            <span>
              Give the team a definite answer now to keep work focused on the
              original date.
            </span>
          </button>
          <button
            className="pq-choice"
            aria-label="Wait for someone else to provide an update"
            onClick={() => dispatch({ type: "answerReview", answer: "defer" })}
          >
            <strong>Wait for someone else to provide an update</strong>
            <span>
              Avoid making an assumption, but leave ownership and the
              verification time open.
            </span>
          </button>
        </div>
      ) : (
        <>
          <div className="pq-help">
            Your review answer is recorded.{" "}
            {state.proposal?.approval === "conditional"
              ? "Alex has conditionally approved the recommendation. The delivery and acceptance checks still need to occur."
              : state.proposal?.approval === "rejected"
                ? "The procurement request has not been approved. The checkpoint will show the project consequence and recovery feedback."
                : "The checkpoint will compare your update against verified delivery evidence."}
          </div>
          <h3>Resolve the delivery checkpoint</h3>
          <p>
            Advance to Day 1, 10:30. The simulation will verify the supplier
            update, apply the crew and acceptance conditions, and calculate the
            consequences of your recommendation.
          </p>
          <div className="pq-actions">
            <button
              className="primary"
              onClick={() => dispatch({ type: "advanceTime" })}
            >
              Advance to 10:30 <span>→</span>
            </button>
          </div>
        </>
      )}
      <div className="pq-actions">
        <button className="secondary" onClick={onClose}>
          Return to workplace
        </button>
      </div>
    </>
  );
}

function Journal({ state }: { state: GameState }) {
  return (
    <>
      <p className="pq-step">Day 01 · {pack.mission.title}</p>
      <p>{pack.mission.briefing}</p>
      <h3>Assignment objectives</h3>
      <ul className="pq-list">
        {getObjectives(state).map((objective) => (
          <li
            key={objective.id}
            className="pq-objective"
            data-complete={objective.complete}
          >
            <span className="pq-check" aria-hidden="true">
              {objective.complete ? "✓" : "○"}
            </span>
            <span>
              {objective.label}
              <span className="sr-only">
                {" "}
                · {objective.complete ? "Complete" : "Pending"}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <h3 className="pq-section-heading">Evidence notebook</h3>
      {state.evidence.length ? (
        state.evidence.map((source) => (
          <SourceRecord key={source} source={source} />
        ))
      ) : (
        <div className="pq-empty">
          Your notebook is empty. Speak with Alex, then inspect the schedule and
          investigate with your colleagues.
        </div>
      )}
      <h3 className="pq-section-heading">Activity log</h3>
      <ol className="pq-list pq-event-list">
        {state.events.map((event) => (
          <li key={event.seq}>
            <small>#{String(event.seq).padStart(2, "0")}</small>
            <span>{event.summary}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

function Career({ state }: { state: GameState }) {
  const roles = [
    "Junior PM Intern",
    "Project Coordinator",
    "Junior Project Manager",
    "Project Manager",
    "Senior Project Manager",
    "Programme Manager / Senior PM track",
    "Programme / Project Director",
    "Portfolio Director",
    "Head of Delivery / VP Projects",
    "Chief Projects Officer / executive route",
  ];
  const labels = {
    accuracy: "Accuracy",
    impact: "Impact",
    authority: "Authority",
    followUp: "Follow-up",
  };
  return (
    <>
      <div className="pq-career-header">
        <div>
          <h3>{state.profile.name}</h3>
          <p>{state.career.role} · Construction & Infrastructure</p>
        </div>
        <div className="pq-career-xp">
          <strong>{state.career.xp}</strong>
          <small>CAREER XP</small>
        </div>
      </div>
      <h3>Demonstrated evidence · Day 1</h3>
      <div className="pq-schedule-summary pq-competency-grid">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((id) => (
          <div className="pq-stat" key={id}>
            <small>{labels[id]}</small>
            <strong>{state.career.competencies[id]} / 3</strong>
            <span>
              {state.phase === "debrief"
                ? "Scenario evidence"
                : "Assessed at debrief"}
            </span>
          </div>
        ))}
      </div>
      <p>
        Career XP records participation. Competency evidence, professional
        conduct and future promotion challenges determine readiness. One
        assignment does not award professional accreditation or an automatic
        promotion.
      </p>
      <h3>Achievements</h3>
      <div className="pq-chip-list">
        {state.career.achievements.length ? (
          state.career.achievements.map((achievement) => (
            <span className="pq-chip" key={achievement}>
              ✓ {achievement}
            </span>
          ))
        ) : (
          <span className="quiet">
            Complete your first assignment to record achievements.
          </span>
        )}
      </div>
      <h3 className="pq-section-heading">Your career horizon</h3>
      <ol className="pq-ladder">
        {roles.map((role, index) => (
          <li key={role}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{role}</strong>
              <small>
                {index === 0
                  ? "Current placement · playable"
                  : "Future campaign · not yet implemented"}
              </small>
            </div>
          </li>
        ))}
      </ol>
      <div className="pq-informational">
        Next planned mission: The Slipping Milestone. The first-week and
        coordinator arcs are on the development roadmap; they are not playable
        in this release.
      </div>
    </>
  );
}

function Debrief({
  state,
  onReplay,
  onMenu,
  onClose,
}: Pick<GamePanelProps, "state" | "onReplay" | "onMenu" | "onClose">) {
  const feedback = getFeedback(state);
  if (!feedback)
    return (
      <div className="pq-empty">
        Your debrief is available after the mentor review and the 10:30
        checkpoint.
      </div>
    );
  return (
    <>
      <article className="pq-outcome">
        <p className="pq-step">DAY 1 · ASSIGNMENT RECORDED</p>
        <h3>{feedback.title}</h3>
        <p>{feedback.summary}</p>
      </article>
      <div className="pq-metrics">
        <div className="pq-stat">
          <small>Baseline → forecast</small>
          <strong>
            {state.project.baselineFinishDay} →{" "}
            {state.project.forecastFinishDay}
          </strong>
          <span>Foundation milestone day</span>
        </div>
        <div className="pq-stat">
          <small>Cost forecast</small>
          <strong>{credits(state.project.forecastCost)}</strong>
          <span>Baseline {credits(state.project.budgetBaseline)}</span>
        </div>
        <div className="pq-stat">
          <small>Stakeholder trust</small>
          <strong>{state.project.stakeholderTrust} / 100</strong>
          <span>Started at 60</span>
        </div>
        <div className="pq-stat">
          <small>Quality</small>
          <strong>{state.project.quality} / 100</strong>
          <span>Acceptance criteria retained</span>
        </div>
      </div>
      {state.project.explanation !== feedback.summary && (
        <p>{state.project.explanation}</p>
      )}
      <h3 className="pq-section-heading">What your actions demonstrated</h3>
      <div className="pq-rubric">
        {feedback.criteria.map((criterion) => (
          <article key={criterion.id}>
            <header>
              <h3>{criterion.label}</h3>
              <strong>
                {criterion.score}
                <small> / 3</small>
              </strong>
            </header>
            <p>{criterion.detail}</p>
            <ul className="pq-citations">
              {criterion.citations.length ? (
                criterion.citations.map((event) => (
                  <li key={event.seq}>
                    #{event.seq} · {event.summary}
                  </li>
                ))
              ) : (
                <li>No qualifying action was recorded.</li>
              )}
            </ul>
          </article>
        ))}
      </div>
      <div className="pq-reflection">
        <h3>Think it through</h3>
        <p>{feedback.reflection}</p>
      </div>
      <div className="pq-career-header" style={{ marginTop: 20 }}>
        <div>
          <h3>You’re building experience.</h3>
          <p>
            {state.career.role} ·{" "}
            {feedback.governancePassed
              ? "Authority boundaries observed"
              : "Authority needs reflection and recovery"}
          </p>
        </div>
        <div className="pq-career-xp">
          <strong>+{feedback.xpEarned}</strong>
          <small>CAREER XP</small>
        </div>
      </div>
      <div className="pq-informational">
        {feedback.next} The next campaign mission is planned and not yet
        playable. Replay starts a fresh practice save and does not accumulate
        rewards.
      </div>
      <div className="pq-actions">
        <button className="primary" onClick={onClose}>
          Explore your workplace <span>↗</span>
        </button>
        <button className="secondary" onClick={onReplay}>
          Replay assignment
        </button>
        <button className="secondary" onClick={onMenu}>
          Main menu
        </button>
      </div>
      <p className="quiet">
        Local progress is saved on this browser. Fictional simulation values
        support learning; they are not real engineering estimates or
        certification results.
      </p>
    </>
  );
}

export function GamePanel({
  kind,
  state,
  dispatch,
  onClose,
  onReplay,
  onMenu,
}: GamePanelProps) {
  const titles: Record<PanelKind, string> = {
    mentor:
      state.phase === "review"
        ? "Let’s review your recommendation."
        : "Your first day starts here.",
    board: "Your project tablet",
    lead: "Talk with Sam",
    supplier: "Call the supplier",
    safety: "Check acceptance conditions",
    report:
      state.phase === "review"
        ? "A decision needs a final check."
        : "Bring the facts. Make a recommendation.",
    journal: "Mission journal",
    career: "A career built on evidence",
    settings: "Play at your pace",
    debrief: "The decision. The difference.",
  };
  const eyebrows: Record<PanelKind, string> = {
    mentor: "MENTOR · SITE OFFICE",
    board: "RIVERSIDE COMMUNITY BUILD · PROJECT TOOLS",
    lead: "DELIVERY LEAD · SITE CONTEXT",
    supplier: "DISPATCH DESK · DELIVERY EVIDENCE",
    safety: "QUALITY & SAFETY · REVIEW CONDITIONS",
    report: "COORDINATION MEETING · ALEX CHEN",
    journal: "CONST-I01 · THE MISSING MATERIALS",
    career: "YOUR PROFESSIONAL JOURNEY",
    settings: "ACCESSIBILITY & CONTROLS",
    debrief: "MISSION DEBRIEF · DAY 01",
  };
  return (
    <Dialog
      title={titles[kind]}
      eyebrow={eyebrows[kind]}
      wide={["board", "report", "career", "debrief"].includes(kind)}
      onClose={onClose}
    >
      {kind === "mentor" && (
        <Mentor state={state} dispatch={dispatch} onClose={onClose} />
      )}
      {["lead", "supplier", "safety"].includes(kind) && (
        <Conversation
          kind={kind as "lead" | "supplier" | "safety"}
          state={state}
          dispatch={dispatch}
          onClose={onClose}
        />
      )}
      {kind === "board" && <Board state={state} dispatch={dispatch} />}
      {kind === "report" && (
        <Recommendation state={state} dispatch={dispatch} onClose={onClose} />
      )}
      {kind === "journal" && <Journal state={state} />}
      {kind === "career" && <Career state={state} />}
      {kind === "debrief" && (
        <Debrief
          state={state}
          onReplay={onReplay}
          onMenu={onMenu}
          onClose={onClose}
        />
      )}
      {kind === "settings" && (
        <>
          <dl className="pq-settings">
            <dt>Workplace movement</dt>
            <dd>
              WASD or arrow keys. Drag to turn the camera. Click the ground to
              walk. Approach a character or project station, then press E or its
              interaction prompt.
            </dd>
            <dt>Your project tablet</dt>
            <dd>
              T opens the project tools. Every record and conversation uses
              keyboard-accessible controls. Escape closes a panel.
            </dd>
            <dt>Time pressure</dt>
            <dd>
              Reading and exploring never advance project time. The 10:30
              checkpoint is an explicit decision after your mentor review.
            </dd>
            <dt>Text alternative</dt>
            <dd>
              Use the accessible interactions list from the game controls to
              inspect sources and open tools without navigating the 3D scene.
            </dd>
          </dl>
          <div className="pq-actions">
            <button className="primary" onClick={onClose}>
              Return to game
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}

export default GamePanel;
