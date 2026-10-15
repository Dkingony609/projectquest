# ProjectQuest architecture

ProjectQuest is a single-player browser game: a navigable third-person workplace, authored characters, accessible project tools, and a deterministic project simulator. The construction campaign has two playable chapters, `CONST-I01` and `CONST-I02`; completed validation and GitHub delivery are tracked in [verification.md](verification.md). The [source Game Design Document](design/ProjectQuest_Comprehensive_Game_Design_Document.docx) defines the full product; [roadmap.md](roadmap.md) separates implemented scope from future work. Both chapters run without a server, account, AI provider or workplace credentials.

## Runtime and dependency boundaries

The browser-first implementation uses TypeScript, React 19, Vite, and Three.js. Three.js owns rendering, camera, avatar movement, world collision, interaction focus, and scene disposal. React owns the introduction, character creation, industry selection, HUD, dialogue, tablet tools, feedback, and settings. The domain layer owns all canonical gameplay state. See [decisions.md](decisions.md) for the provisional engine selection and its unperformed comparison gate.

```text
Versioned sector content ───────┐
                              ▼
React UI ── typed command ──► Domain reducer ──► new canonical state
Three.js world ────────────────▲       │               │
  position / focus / inspect           │               ├─► UI + world projection
                                      ▼               └─► validated local save
                               event journal
```

World interaction requests a gameplay action; opening a panel alone does not award learning evidence. The UI cannot independently approve purchases, change project baselines, or grade a learner. Shared command validation checks mission phase, role authority, source evidence, required fields, and duplicate events before changing state. Camera position and focus are presentation state; saved progress records meaningful player/world state needed to resume.

| Boundary                                 | Responsibility                                                                                             | Contract                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/world`                              | Compact office/site hub, avatar, camera, collisions, NPC/prop affordances                                  | Publishes nearby target and inspect/interact requests; receives project and appearance projections |
| `src/game`                               | Mission states, sources, project consequences, deliberate time advancement, competency evidence            | Pure typed commands return state or a readable validation error                                    |
| `src/App.tsx`                            | Main menu, character creation, industry flow, HUD, settings, accessible navigation and storage integration | Orchestrates world and panels; dispatches validated commands and stores movement checkpoints       |
| `src/ui`                                 | Focus-managed semantic dialogs, authored NPC conversations, tablet tools, journal, career and feedback     | Shows canonical state and submits commands; field validation preserves rejected form drafts        |
| `src/game/content.ts`, `day2-content.ts` | Authored terminology, source documents, cast, briefings, options and work packages                         | Stable industry, mission, source, task, NPC and objective IDs                                      |
| `src/game/schedule.ts`                   | Finish-to-start calculation, graph validation and early/late task timings                                  | Pure input graph produces forecast, float and critical activities or a readable error              |
| `src/game/save.ts`                       | Versioned local snapshot and journal validation                                                            | Validated save envelope; corrupt/unsupported state does not silently become progress               |

The implementation keeps strongly typed content alongside domain modules instead of a separate editor. `GamePanel` routes Day 2 interactions to `Day2Panel`; career/settings and the same focus-managed `Dialog` remain shared. Extracting additional packs must preserve these boundaries rather than cloning the application.

## Day 1 engine API

The public API is exported from `src/game/index.ts`, with shared types in `types.ts`, authored content in `content.ts`, transitions in `engine.ts`, runtime input validation in `validation.ts`, and storage handling in `save.ts`.

| API                                         | Responsibility                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `createGame(profile)`                       | Create version 1 `CONST-I01` state at arrival, Day 1 09:00, as a construction intern                               |
| `applyCommand(state, command)`              | Return `{ state, error?, notice? }`; failed validation returns the unchanged original state                        |
| `getObjectives(state)`                      | Derive stable objective IDs, labels and completion from canonical evidence and phase                               |
| `getFeedback(state)`                        | Return the four-criterion assessment and citations, or `null` before debrief                                       |
| `getPack()`                                 | Supply the construction content pack without cloning simulation logic                                              |
| `serializeSave(state)` / `parseSave(input)` | Store and validate the versioned snapshot plus command journal; parsing returns state or a readable recovery error |

The initial profile includes name, construction industry, skin/shirt/hair appearance and guided/standard assistance. Each chapter uses `arrival → investigating → review → debrief`; state also includes position, mission/version/seed, time, sources, tasks, issue, recommendation, review response, metrics, career evidence, achievements and event journal. Day 1 commands include `brief`, `inspect`, `ask`, `followUp`, `updateTask`, `logIssue`, `chooseRecommendation`, `submitRecommendation`, `answerReview` and `advanceTime`. The first answer and response selection commit immediately; a separate `followUp` can recover evidence after pressure without erasing its relationship cost. Day 1 requires `schedule`, `lead` and `supplier` sources; `safety` is optional. `submitRecommendation` accepts an optional `OptionComparison` with both alternatives' forecast days and additional costs; the strongest impact score requires a correct recorded comparison, not merely reading the options.

A submitted alternate-supply recommendation is not a procurement commitment. Mentor review records the required approval and checks; an unauthorised attempt is challenged and blocked, with a governance consequence. Only the explicit `advanceTime` command after review resolves the 10:30 checkpoint. An animation clock never advances project time.

## Day 2 campaign and scheduling API

`startNextMission` is accepted from a completed Day 1 debrief. It preserves the profile, relationships, accumulated XP, project costs/trust/forecast and event journal, records the Day 1 case study, and starts `CONST-I02` at Day 2 09:00. Current sources, task records, recommendation and review are reset for the new assignment. The first chapter's committed conversation choices do not lock the new chapter's responses: current dialogue is scoped after the transition in the journal.

`day2-content.ts` supplies `DAY2` and `baselineSchedule()`. Mission-specific transition and assessment rules live in `day2.ts`, with state/command contracts in `day2-types.ts`. These adapters reuse `applyCommand`, `getObjectives`, `getFeedback`, shared conversations, review commands, journal and persistence.

| API / command                            | Responsibility                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `calculateSchedule(tasks, startDay = 0)` | Validate positive whole durations, unique IDs, known dependencies and an acyclic graph; calculate early/late starts and finishes, float and critical activities                       |
| `saveSchedulePlan`                       | Validate four sourced work packages, all four finish-to-start links, Sam as owner and the 11:00 check; record the recalculated working forecast without baseline approval or spending |
| `chooseScheduleRecommendation`           | Commit one response after investigation and plan requirements pass; later cards stay locked                                                                                           |
| `submitScheduleRecommendation`           | Record the committed response, quantified comparison, confidence and next check for mentor review                                                                                     |
| `answerReview` / `advanceTime`           | Apply the Day 2 approval conditions and explicit 11:00 event once; retain acceptance gates and record causal feedback                                                                 |
| `replayMission(state)`                   | Restart Day 1 fresh, or reconstruct the actual Day 1 checkpoint and restart Day 2 without stacking the replaced rewards                                                               |

The schedule rule is `earlyStart = max(predecessor earlyFinish)` and `earlyFinish = earlyStart + duration`. The four-task diamond is survey → inspection and off-site formwork → pour. Baseline durations 1/1/2/1 make a four-day chain; Sam's verified survey duration of two days makes five. The chapter maps this one-day chain increase onto the carried Day 1 forecast. Approved second-team support restores the shorter survey duration for 1,200 fictional credits, subject to Sam's capacity confirmation, Taylor's acceptance checks and Alex's approval. The baseline and previous mission's costs remain intact.

## Canonical state and reproducibility

The initial domain model covers player identity and appearance; selected industry and intern role; mission phase and completed objectives; source provenance; a dependency-linked task board; issue owner, affected task, next check and uncertainty wording; project forecast, budget, quality, team wellbeing and trust; relationship context; event history; assessment and career evidence; and a saved-world checkpoint.

Time advances only at explicit checkpoints. Reading a document, working in a form, pausing, or leaving the browser is never an irreversible time penalty. Ordered event sequences, command validation and phase guards prevent applying a delivery consequence twice after reloading. Scenario version and seed are saved with the snapshot. The delivery check uses a deterministic seeded draw against Morgan's 70% estimate; `createGame` currently fixes seed 609, so the default wait route repeats the Day 13 / +400-credit outcome. The rule also supports a late replacement with Day 14 / +800-credit standby consequence. `Math.random()` is never used for canonical outcomes.

Source facts are separate from claims. A supplier estimate is not a guarantee, and a foreman's operational constraint does not constitute purchasing authority. An intern can inspect, record and recommend; approved mentor action is distinct from an unauthorised order. The consequences of choosing an unauthorised action are explicitly recorded as a governance breach rather than legitimising the transaction.

## Learning and progression

Assessment cites observed events against four criteria: accuracy, impact/dependency reasoning, authority and follow-up, each 0–3. Career XP is separate from competence: Day 1 awards 40 completion XP plus five per rubric point; Day 2 awards 50 plus five per point. Each completion is recorded once. `missionHistory` retains each chapter's scores, XP, outcome, forecast, cumulative actual cost and trust; the active competency display shows the current chapter. Source Checker, Early Escalator, Recovery Planner and Dependency Detective have action-based conditions. Two chapters do not promote the intern or establish mastery. Replay replaces practice results without stacking XP. Later promotion requires repeated independent evidence across required domains, mission milestones, professional conduct and a role-specific challenge.

The initial feedback is a teaching instrument, not an accredited assessment. No score certifies project management, engineering, clinical, procurement or safety competence.

## Rendering and interaction

The shared hub uses coherent project-owned procedural geometry: office, meeting area, planning board, supplier terminal, industry context, NPCs and an animated avatar. Final character rigs, richer animation, environmental textures, VFX and industry-specific assets remain production requirements. The original “First Light at Riverside” score and authored effects are bundled locally; Manrope and DM Serif Display are self-hosted with their font licences. `src/audio/README.md` and `public/fonts/README.md` record provenance and regeneration details. Playback needs neither Python nor ffmpeg; these are optional score-authoring tools.

Third-person navigation includes swept/substepped collision, a bounded orbit/follow camera, obstacle-aware paths for click/labelled-world routes, and proximity-based E/click interactions. Labelled accessible navigation places the avatar beside the same stations, and graphics-failure controls expose their panels when WebGL cannot run. The same validated investigation and decisions remain required. T opens the portable tablet, J the journal, Escape closes panels or opens settings, and Tab retains semantic interface focus navigation. Dialogs trap focus while open and restore it when closed; tablet tabs support arrows/Home/End. 2D tools contain the detailed text rather than tiny in-world spreadsheets.

Reduced motion, larger text, high contrast and lower graphics cost are implemented settings. The world lazy-loads behind the UI, batches static opaque geometry, bounds pixel ratio and shadow resolution, and applies a lower-cost path for software rendering or the user's low-spec setting. World teardown releases geometries, materials, textures, renderer resources, animation loops and listeners. Laptop performance remains a design target: no device-level 30–60 FPS claim is valid until a representative benchmark records hardware, browser, scene and settings. Remapping, camera-sensitivity settings and formal assistive-technology validation remain M3 work.

## Persistence, failure and privacy

Local saves retain the browser key `projectquest.save.v1` and contain fictional project data and the player's chosen profile. Autosave follows accepted commands and world-position checkpoints; starting a new career requires confirmation before replacing progress. New envelopes use `format: 'projectquest.save'` and `schemaVersion: 2`; the domain snapshot's internal `version: 1` is a separate identifier. The action journal includes the explicit chapter transition and each committed response. Loading accepts up to 1 MB and 600 commands, validates profile/position, reconstructs state from `createGame` and compares the entire canonical snapshot with that reconstruction. Tampered metrics, duplicates and out-of-order actions are rejected. Position is finite/bounded at load and collision-clamped by the world; camera/UI focus are presentation state. Settings use the separate `projectquest.settings.v1` key.

Original schema-1 compatibility uses `replaySavedCommand` with historical conversation semantics for the journal prefix preceding the first new `followUp` or `chooseRecommendation` action. This permits the repeated conversation answers that the original release accepted; the other Day 1 rules remain unchanged. The full reconstructed snapshot must match before loading, preserving the recorded legacy outcome and assessment. New actions use committed-choice rules. The journal itself retains this prefix boundary when re-saved in schema 2; no separate archived engine is bundled. Genuine original-save fixtures cover continuation through Day 2, replay and re-saving. Future changes to other historical rules will require an explicit compatibility strategy.

Browser storage can be unavailable, full, manually cleared or origin-specific. The implementation displays save failures and corrupt/unsupported-save recovery messages while permitting a fresh game. Schema-1 compatibility does not provide multi-device backups, cloud sync or a general migration system for future versions. Never persist API keys or require real workplace information.

No analytics, cloud sync, enterprise reporting, multiplayer, or AI dialogue is necessary for this slice. If introduced, consent, retention, role-based access and scenario authority need separate design and test gates. AI may only paraphrase bounded hints or grounded dialogue; deterministic code remains the authority for facts, approvals, time and grading.

## Extension rules

1. Add missions as versioned content with sources, objectives, allowed actions, recovery and tests; reuse shared simulation and UI systems.
2. Introduce new tools only when their mission requires them. Future WBS, RAID, change control, procurement and portfolio views must connect to canonical state.
3. Different sectors need different operational constraints and believable stories, not the same answer sequence with different labels.
4. Preserve old save compatibility through explicit migration or an honest incompatibility path.
5. Keep core gameplay available without a backend or optional AI service.
