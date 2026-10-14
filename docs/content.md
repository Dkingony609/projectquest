# Mission content and systems guide

The [GDD](design/ProjectQuest_Comprehensive_Game_Design_Document.docx) is the product specification. Its Day 1 definition of done and escalation rubric drive the first playable content. All project dates, costs and consequences are fictional teaching values; they are not engineering estimates, legal advice or certification evidence.

## `CONST-I01` — The Missing Materials

**Placement:** Junior PM Intern, construction site office, two-storey community building project. **Goal:** Provide grounded concrete-delivery status and a next-step recommendation before the coordination meeting. **Authority:** Inspect, ask, update records and recommend. The intern cannot approve a new supplier, commit expenditure, waive safety review or silently change the baseline.

### Cast and sources

| Source / character | Distinct contribution | Uncertainty / authority |
| --- | --- | --- |
| Project schedule at planning board | Foundation task, baseline dates, finish-to-start successors and affected milestone | Approved plan documents sequence, not current supplier readiness |
| Sam, foreman/delivery lead | Crew booking, dependency timing and practical impact if concrete is late | Operational knowledge includes assumptions that require confirmation |
| Morgan, supplier contact at terminal | Truck problem, estimated replacement timing and commitment status | Estimate is probabilistic; no confirmed delivery guarantee |
| Alex, mentor / Senior PM | Delegates work, probes confidence and impact, owns approval/review | Can review a recommendation within scenario authority |
| Riley, sponsor; Taylor, safety/quality | Full-week cast for governance, acceptance and pressure scenarios | Later missions; do not claim interactive characters before built |

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

The task board allows a valid progress/blocker update linked to source evidence. The basic schedule makes the foundation predecessor/successor relationship and baseline/forecast visible. The issue record requires evidence, affected task/milestone, an owner, next checkpoint and honest certainty wording. Detailed input uses accessible semantic panels launched from relevant world objects; the world remains the context for finding information and people.

No issue is “resolved” merely because it was recorded. Forecast changes come from simulation rules and review, not moving a card for visual effect.

### Decisions and recoverable outcomes

| Response | Legitimate? | Intended operational effect / feedback |
| --- | --- | --- |
| Wait with a contingency and verification checkpoint | Yes, when evidence and owner are clear | Protects budget and authority; schedule exposure remains visible; follow-up reduces avoidable surprise |
| Recommend alternate supply subject to cost/safety approval | Yes | Potentially protects sequence at a cost; mentor review precedes approved commitment |
| Promise delivery with unsupported certainty | Professionally unsound | Brief confidence can reverse after the event; factual accuracy and honest confidence matter |
| Order an alternative supplier as an intern | Governance breach | Apparent schedule recovery does not erase lack of authority; ethics gate fails and remediation remains available |
| Understate or ignore successor impact | Incomplete reasoning | A recorded issue still misses downstream schedule consequences; review explains dependency tracing |

Consequences are deterministic and distinguish schedule, cost, quality, wellbeing, trust and governance instead of one opaque “correct” badge. A poor result offers replay or a later recovery assignment; it never prevents the learner from understanding and correcting the decision.

### Rubric

| Criterion | 0 — Missing | 1 — Developing | 2 — Competent | 3 — Strong |
| --- | --- | --- | --- | --- |
| Accuracy | Misstates facts | Weak/incomplete source | Accurate sourced status | Separates fact from assumption |
| Impact | No effect explained | Vague concern | Links schedule/scope/cost | Compares quantified alternatives |
| Authority | Acts beyond role | Decision owner unclear | Escalates to right authority | Makes approvable recommendation |
| Follow-up | No action | Unowned action | Owner and due date | Verification plus contingency |

Each score cites logged behavior. Operational success, participation XP, professional conduct and competence remain separate. Novel independent scenarios and diminishing hint use are needed for mastery; a flawless replay alone is insufficient.

## Versioned mission contract

Each authored mission needs the following fields or their typed equivalent:

```ts
type MissionDefinition = {
  id: string;                // e.g. CONST-I01; stable across revisions
  version: number;
  industry: string;
  roleRequired: string;
  sceneId: string;
  prerequisites: string[];
  briefing: string;
  authority: string[];       // inspect, record, recommend; explicit limits
  initialState: unknown;    // validated canonical project state
  sources: unknown[];       // ID, provenance, facts/claims, knowledge scope
  objectives: unknown[];    // ID, dependencies, observed completion predicate
  events: unknown[];        // ID, trigger, priority, effect, once-only policy
  allowedActions: unknown[];// validators, approval requirement and state delta
  outcomes: unknown[];      // causal consequences and debrief statements
  recoveryRoutes: unknown[];
  rubric: unknown[];        // observed evidence -> criterion -> explanation
  reflections: string[];
  tests: string[];          // required branch/recovery assertions
};
```

This is a design contract, not a claim that an in-game content editor or schema loader already exists. Initial content can be strongly typed code; later extraction should preserve stable IDs and validation. Pack versions must be represented in save compatibility decisions. NPC dialogue may reveal information but cannot invent canonical evidence or approve actions outside the actor's authority.

## Industry pack contract

| Pack component | Required content |
| --- | --- |
| Setting | Hub/site scene, interactables, props, readable environment feedback, licensed/owned asset list |
| Roster | Mentor, sponsor, team, suppliers, goals, information limits, reliability and availability |
| Mission graph | Briefings, sources, objective dependencies, events, legitimate options and recovery |
| Operations | Calendar, costs, dependencies, procurement/quality/compliance constraints and sector terms |
| Assessment | Observable competencies, rubric, misconceptions, feedback and transfer task |
| Localisation/review | Jurisdiction labels, translated terms, SME review and safety limitations |

Construction's materials/dependency story is not a template answer order for every sector. Software needs defect severity, QA and release pressure; healthcare needs adoption/privacy/service continuity; events need vendor/run-of-show/weather contingency; manufacturing needs shutdown capacity and commissioning; energy needs grid/permit/supply constraints.

## Shared game systems inventory

| System | First slice responsibility | Later depth |
| --- | --- | --- |
| Character and profile | Name, appearance, intern role, controlled avatar, local resume | Cosmetics, more rigs and profiles |
| Industry | Clearly distinguish playable construction and future packs | Transferable skill retention plus sector onboarding |
| World | Navigable office/site context, interaction proximity and accessible alternative | Multiple hubs, stateful site stages and richer animation |
| Dialogue/relationships | Authored evidence questions, mentor review and trust consequences | Availability, preferences, long-term relationships, optional bounded AI |
| Missions | Objective prerequisites, validated completion and debrief | Five-day arcs, capstones, multi-project campaigns |
| Simulator | Dependencies, forecast, trade-offs, governance and deliberate event | Resource levelling, budgets, risk realisation, benefits and portfolio rules |
| Work tools | Functional task board, issue record and basic schedule | WBS, RAID, changes, meetings, procurement, quality acceptance and status reports |
| Time | Explicit checkpoints, no reading penalty | Calendar, scheduled meetings, priorities and seeded event variation |
| Learning/career | Four criteria, logged evidence, feedback and participation separate from mastery | Full taxonomy, independent successes, ethical gates and promotion challenges |
| Persistence | Versioned valid local save, resume, replay and no duplicate events | Migrations, profiles, opt-in cloud sync |
| UI/accessibility | Contextual HUD, semantic tablet/dialogue, readable errors and loading | Remapping, size/contrast/motion options and documented assistive-device tests |

## Authoring and review workflow

Learning design specifies observable evidence first. A practising PM supplies credible constraints and more than one defensible response. Narrative gives each NPC a motive and knowledge boundary. Systems design turns that content into validated commands and causal outcomes. QA checks every branch, evidence gate and recovery. Learners test clarity, fun and transfer independently. Sector reviewers validate regulated assumptions and jurisdiction labels before release.

Optional AI must not add unverified facts, authorise spending, grade learners, waive safety, or advance time. Core authored play stays available without it. Later creator content requires moderation and asset licensing, and enterprise reporting requires explicit consent and permission design.
