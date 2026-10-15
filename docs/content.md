# Mission content and systems guide

The [GDD](design/ProjectQuest_Comprehensive_Game_Design_Document.docx) is the product specification. Its Day 1 definition of done and escalation rubric drive the first playable content. All project dates, costs and consequences are fictional teaching values; they are not engineering estimates, legal advice or certification evidence.

The mission described below is integrated in the local M2 code. Automated game/save and world checks pass; final browser acceptance and the HTTP 403 GitHub delivery blocker are tracked in [verification.md](verification.md). Other industries and later days are planned content.

## `CONST-I01` — The Missing Materials

**Placement:** Junior PM Intern, construction site office, two-storey community building project. **Goal:** Provide grounded concrete-delivery status and a next-step recommendation before the coordination meeting. **Authority:** Inspect, ask, update records and recommend. The intern cannot approve a new supplier, commit expenditure, waive safety review or silently change the baseline.

### Cast and sources

| Source / character                   | Distinct contribution                                                                               | Uncertainty / authority                                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Project schedule at planning board   | Foundation task, baseline dates, finish-to-start successors and affected milestone                  | Approved plan documents sequence, not current supplier readiness                                                |
| Sam, foreman/delivery lead           | Crew booking, dependency timing and practical impact if concrete is late                            | Operational knowledge includes assumptions that require confirmation                                            |
| Morgan, supplier contact at terminal | Truck problem, estimated replacement timing and commitment status                                   | Estimate is probabilistic; no confirmed delivery guarantee                                                      |
| Alex, mentor / Senior PM             | Delegates work, probes confidence and impact, owns approval/review                                  | Can review a recommendation within scenario authority                                                           |
| Taylor, safety/quality coordinator   | Optional fourth conversation explains acceptance, access and approval requirements for an alternate | Already interactive; cannot waive checks; inspecting this source supports stronger alternate follow-up evidence |
| Riley, sponsor                       | Full-week cast for governance, acceptance and pressure scenarios                                    | Planned later character, not an interactive NPC in this slice                                                   |

The sources intentionally conflict in confidence and implication, not by presenting three copies of the same clue. Source inspection is recorded with a stable ID. Repeated reading must not inflate evidence or assessment.

### Objective graph

```text
Meet mentor / receive assignment
               ↓
Inspect schedule + ask foreman + confirm supplier
               ↓
Update source-backed task / issue artefact
               ↓
Prepare recommendation + confidence/impact response
               ↓
Mentor review → explicit time checkpoint → delivery event
               ↓
Project consequences → rubric feedback → saved career record
```

The mission journal displays the next useful action and completed prerequisites. A validation error explains a missing owner or source instead of completing an objective. Dependency awareness is demonstrated through the work, rather than a vocabulary quiz.

### Tool behavior

The portable tablet opens from the board, its toolbar button, or T. Tasks, Schedule and Issue register are semantic keyboard-navigable tabs. The task board allows a source-backed status, blocker and owner update on the concrete delivery card. It rejects completion before a signed receipt and rejects changing Day 1's due date; foundation/framing baselines are protected. The basic schedule makes the delivery → foundations → framing relationship, baseline/forecast and response costs visible. The issue record requires title, known owner, severity, Day 1 due date, inspected evidence, affected work, confidence wording and the agreed 10:30 checkpoint. Required fields and domain errors are readable and preserve the rejected command's canonical state.

The schedule, Sam and Morgan must all be investigated and cited in the issue before a recommendation can be submitted. Taylor is optional for completion. The recommendation form accepts an optional four-value comparison: wait finish day/additional cost and alternate finish day/additional cost. A partial comparison is rejected, and a wrong complete comparison remains logged for explanatory feedback rather than silently being corrected. The highest impact score requires the player to enter Day 13 / +400 and Day 12 / +2,000 respectively and trace the foundation dependency.

No issue is “resolved” merely because it was recorded. Forecast changes come from simulation rules and review, not moving a card for visual effect.

### Decisions and recoverable outcomes

| Response                                                   | Legitimate?                            | Intended operational effect / feedback                                                                                                                                                                                                  |
| ---------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wait with a contingency and verification checkpoint        | Yes, when evidence and owner are clear | Default seed: accepted replacement at 10:30 misses the morning pour, Day 13 forecast, +400 standby credits, improved trust/wellbeing. A seeded late-replacement branch produces Day 14 / +800 while preserving honest-escalation credit |
| Recommend alternate supply subject to cost/safety approval | Yes                                    | Alex conditionally approves +2,000 credits; Sam/Taylor verify site access/acceptance at 10:30 before approval becomes effective and spend is recorded; Day 12 forecast and normal quality retained                                      |
| Promise delivery with unsupported certainty                | Professionally unsound                 | Brief confidence can reverse after the event; factual accuracy and honest confidence matter                                                                                                                                             |
| Attempt to order an alternative supplier as an intern      | Governance breach                      | Procurement blocks the order; Day 14 forecast and +800 standby credits reflect disruption, not a committed alternate purchase; authority score fails and reflection/replay remain available                                             |
| Understate or ignore successor impact                      | Incomplete reasoning                   | A recorded issue still misses downstream schedule consequences; review explains dependency tracing                                                                                                                                      |

An unsupported guarantee produces an initially reassuring trust increase, then a dispatch audit: Day 14 forecast, +1,000 disruption credits and trust corrected to 44. Review can also be deferred without inventing a false assurance; this still loses coordination time and reduces performance, while remaining distinct from a governance breach.

Consequences are deterministic and distinguish schedule, cost, quality, wellbeing, trust and governance instead of one opaque “correct” badge. The current recovery is reflection and a fresh replay for the same profile; replay resets mission rewards and previous run history. A later recovery assignment is planned. Day 2 is not playable yet, and no branch grants a promotion.

### Rubric

| Criterion | 0 — Missing         | 1 — Developing         | 2 — Competent                | 3 — Strong                       |
| --------- | ------------------- | ---------------------- | ---------------------------- | -------------------------------- |
| Accuracy  | Misstates facts     | Weak/incomplete source | Accurate sourced status      | Separates fact from assumption   |
| Impact    | No effect explained | Vague concern          | Links schedule/scope/cost    | Compares quantified alternatives |
| Authority | Acts beyond role    | Decision owner unclear | Escalates to right authority | Makes approvable recommendation  |
| Follow-up | No action           | Unowned action         | Owner and due date           | Verification plus contingency    |

Each score cites logged behavior. For strong follow-up on the alternate path, the learner also investigates Taylor's acceptance requirements; the checkpoint then logs the actual review. Operational success, XP, professional conduct and competence remain separate. XP is 40 completion points plus five per rubric point, awarded once in a run; Source Checker, Early Escalator and Recovery Planner have action-based conditions. Novel independent scenarios and diminishing hint use are needed for mastery; a flawless replay alone is insufficient.

## Versioned mission contract

The implemented `IndustryPack` in `src/game/types.ts` has this content shape; `src/game/content.ts` supplies the construction pack:

```ts
type IndustryPack = {
  id: "construction";
  title: string;
  mission: {
    id: "CONST-I01";
    version: 1;
    title: string;
    briefing: string;
    authority: string[];
    rubric: string[];
    recovery: string;
    setting: string;
    roleRequired: "intern";
    prerequisites: string[];
    startState: "arrival";
    objectiveIds: string[];
    events: {
      id: string;
      trigger: string;
      minutes: number;
      priority: number;
      once: boolean;
    }[];
    allowedActions: string[];
    outcomes: string[];
    recoveryRoutes: string[];
    reflections: string[];
    acceptanceTests: string[];
  };
  sources: Record<SourceId, Source>;
  npcs: Record<NpcId, Npc>;
  options: Record<
    ProposalOption,
    {
      label: string;
      description: string;
      forecastDay: number;
      cost: number;
    }
  >;
};
```

`Source` contains an ID, title, detail lines and provenance. `Npc` contains an ID, name, role, greeting, evidence response and pressure response. The four `ProposalOption` IDs are `wait`, `alternate`, `promise` and `unauthorised`. `getPack()` returns a copy of the authored pack. `createGame()` owns the starting project state, `getObjectives()` derives completion, and deterministic rules/rubric logic live in `engine.ts`; content strings are not an executable mission editor. Future packs will need generic scenario loading and validated predicates before rules can be authored without code. Preserve IDs and explicit save compatibility when extracting those contracts.

## Industry pack contract

| Pack component      | Required content                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Setting             | Hub/site scene, interactables, props, readable environment feedback, licensed/owned asset list |
| Roster              | Mentor, sponsor, team, suppliers, goals, information limits, reliability and availability      |
| Mission graph       | Briefings, sources, objective dependencies, events, legitimate options and recovery            |
| Operations          | Calendar, costs, dependencies, procurement/quality/compliance constraints and sector terms     |
| Assessment          | Observable competencies, rubric, misconceptions, feedback and transfer task                    |
| Localisation/review | Jurisdiction labels, translated terms, SME review and safety limitations                       |

Construction's materials/dependency story is not a template answer order for every sector. Software needs defect severity, QA and release pressure; healthcare needs adoption/privacy/service continuity; events need vendor/run-of-show/weather contingency; manufacturing needs shutdown capacity and commissioning; energy needs grid/permit/supply constraints.

## Shared game systems inventory

| System                 | First slice responsibility                                                                                                                          | Later depth                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Character and profile  | Name, appearance, intern role, controlled avatar, local resume                                                                                      | Cosmetics, more rigs and profiles                                                |
| Industry               | Clearly distinguish playable construction and future packs                                                                                          | Transferable skill retention plus sector onboarding                              |
| World                  | Navigable office/site context, interaction proximity and accessible alternative                                                                     | Multiple hubs, stateful site stages and richer animation                         |
| Dialogue/relationships | Authored evidence questions, mentor review and trust consequences                                                                                   | Availability, preferences, long-term relationships, optional bounded AI          |
| Missions               | Objective prerequisites, validated completion and debrief                                                                                           | Five-day arcs, capstones, multi-project campaigns                                |
| Simulator              | Dependencies, forecast, trade-offs, governance and deliberate event                                                                                 | Resource levelling, budgets, risk realisation, benefits and portfolio rules      |
| Work tools             | Functional task board, issue record and basic schedule                                                                                              | WBS, RAID, changes, meetings, procurement, quality acceptance and status reports |
| Time                   | Explicit checkpoints, no reading penalty                                                                                                            | Calendar, scheduled meetings, priorities and seeded event variation              |
| Learning/career        | Four criteria, logged evidence, explicit comparison, case record and achievements; XP separate from mastery                                         | Full taxonomy, independent successes, ethical gates and promotion challenges     |
| Persistence            | Versioned valid local save, resume, replay and no duplicate events                                                                                  | Migrations, profiles, opt-in cloud sync                                          |
| UI/accessibility       | Contextual HUD, T tablet, semantic focus-managed dialogue/tabs, readable errors/loading, labelled routes and text/contrast/motion/low-spec settings | Remapping, camera sensitivity and documented assistive-device tests              |

## Authoring and review workflow

Learning design specifies observable evidence first. A practising PM supplies credible constraints and more than one defensible response. Narrative gives each NPC a motive and knowledge boundary. Systems design turns that content into validated commands and causal outcomes. QA checks every branch, evidence gate and recovery. Learners test clarity, fun and transfer independently. Sector reviewers validate regulated assumptions and jurisdiction labels before release.

Optional AI must not add unverified facts, authorise spending, grade learners, waive safety, or advance time. Core authored play stays available without it. Later creator content requires moderation and asset licensing, and enterprise reporting requires explicit consent and permission design.
