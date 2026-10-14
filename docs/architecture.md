# ProjectQuest architecture

ProjectQuest is a single-player browser game: a navigable third-person workplace, authored characters, accessible project tools, and a deterministic project simulator. The [source Game Design Document](design/ProjectQuest_Comprehensive_Game_Design_Document.docx) defines the full product; [roadmap.md](roadmap.md) separates the initial slice from future scope. Nothing in this architecture requires a server, account, AI provider, or workplace credentials to complete the first mission.

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

| Boundary | Responsibility | Contract |
| --- | --- | --- |
| `src/world` | Compact office/site hub, avatar, camera, collisions, NPC/prop affordances | Publishes nearby target and inspect/interact requests; receives project and appearance projections |
| `src/game` | Mission states, sources, project consequences, deliberate time advancement, competency evidence | Pure typed commands return state or a readable validation error |
| `src/ui` | Semantic panels, character creation, mission HUD, dialogue and tools | Shows canonical state and submits commands; retains form drafts until valid submission |
| Industry content | Sector terminology, source documents, cast, briefing, options, rubrics | Stable industry, mission, source, task, NPC and objective IDs |
| Persistence | Versioned local snapshot, validation, resume and reset | Validated save envelope; corrupt/unsupported state does not silently become progress |

The first slice may keep validated content alongside domain modules instead of a separate editor. Extracting additional packs must preserve these boundaries rather than cloning the application.

## Day 1 engine API

The approved integration contract is exported from `src/game/index.ts`, with shared types in `types.ts`, authored content in `content.ts`, transitions in `engine.ts`, and storage handling in `save.ts`.

| API | Responsibility |
| --- | --- |
| `createGame(profile)` | Create version 1 `CONST-I01` state at arrival, Day 1 09:00, as a construction intern |
| `applyCommand(state, command)` | Return `{ state, error?, notice? }`; failed validation returns the unchanged original state |
| `getObjectives(state)` | Derive stable objective IDs, labels and completion from canonical evidence and phase |
| `getFeedback(state)` | Return the four-criterion assessment and citations, or `null` before debrief |
| `getPack()` | Supply the construction content pack without cloning simulation logic |
| `serializeSave(state)` / `parseSave(input)` | Store and validate the versioned snapshot plus command journal; parsing returns state or a readable recovery error |

The initial profile includes name, construction industry, skin/shirt/hair appearance and guided/standard assistance. The state machine is `arrival → investigating → review → debrief`; state also includes bounded position, mission/version/seed, time, sources, tasks, issue, recommendation, review response, metrics, career evidence, achievements and event journal. Commands are `brief`, `inspect`, `ask`, `updateTask`, `logIssue`, `submitRecommendation`, `answerReview` and `advanceTime`. Evidence source IDs are `schedule`, `lead`, `supplier` and optional `safety`.

A submitted alternate-supply recommendation is not a procurement commitment. Mentor review records the required approval and checks; an unauthorised attempt is challenged and blocked, with a governance consequence. Only the explicit `advanceTime` command after review resolves the 10:30 checkpoint. An animation clock never advances project time.

## Canonical state and reproducibility

The initial domain model covers player identity and appearance; selected industry and intern role; mission phase and completed objectives; source provenance; a dependency-linked task board; issue owner, affected task, next check and uncertainty wording; project forecast, budget, quality, team wellbeing and trust; relationship context; event history; assessment and career evidence; and a saved-world checkpoint.

Time advances only at explicit checkpoints. Reading a document, working in a form, pausing, or leaving the browser is never an irreversible time penalty. Event IDs and phase guards prevent applying a delivery consequence twice after reloading. Scenario version and any seed are saved with the snapshot. The first authored event can be deterministic without randomness; later variation must use a saved seeded generator rather than `Math.random()` in simulation logic.

Source facts are separate from claims. A supplier estimate is not a guarantee, and a foreman's operational constraint does not constitute purchasing authority. An intern can inspect, record and recommend; approved mentor action is distinct from an unauthorised order. The consequences of choosing an unauthorised action are explicitly recorded as a governance breach rather than legitimising the transaction.

## Learning and progression

Assessment cites observed events and compares decisions with a published four-criterion escalation rubric: accuracy, impact, authority and follow-up, each 0–3. Career XP records participation separately from competence. A single good Day 1 result cannot promote the intern or establish mastery. Later promotion requires repeated independent evidence across required domains, mission milestones, professional conduct, and a role-specific challenge. Replay is practice; it cannot substitute for a novel transfer scenario.

The initial feedback is a teaching instrument, not an accredited assessment. No score certifies project management, engineering, clinical, procurement or safety competence.

## Rendering and interaction

The first hub uses coherent project-owned procedural geometry: office, meeting area, planning board, supplier terminal, industry context, NPCs, and an animated avatar. This avoids unverifiable third-party licensing while the interaction loop is built. Final character rigs, authored animation, environmental textures, audio, VFX, and industry-specific assets remain production requirements.

Third-person navigation includes collision boundaries, a bounded orbit/follow camera, and proximity-based E/click interactions. Accessible semantic interaction alternatives must permit the same investigation and completion without requiring precision movement. 2D tools contain the detailed text rather than tiny in-world spreadsheets. Focus cues must remain legible without colour alone.

Laptop performance is a design target. Pixel ratio, geometry counts, lights, shadow cost, and world updates should be bounded, and world teardown must release geometries, materials, renderer resources, animation loops, and listeners. No device-level 30–60 FPS claim is valid until a representative benchmark records hardware, browser, scene and settings.

## Persistence, failure and privacy

Local saves use `projectquest.save.v1` and contain only fictional project data and the player's chosen profile. Never persist API keys or require real workplace information. Autosave occurs after reversible checkpoints; a user can resume or explicitly start a new career. Loading validates size, version, profile, world position and command IDs, reconstructs the mission by replaying valid commands, and compares the canonical snapshot to the reconstruction. A tampered metric or invented objective must not become earned progress. Browser storage can be unavailable, full, manually cleared, or origin-specific, so save failure must be visible and gameplay must remain usable. Invalid data must fall back to a safe entry flow with a readable explanation; migrations or an explicit incompatible-save warning protect later versions.

No analytics, cloud sync, enterprise reporting, multiplayer, or AI dialogue is necessary for this slice. If introduced, consent, retention, role-based access and scenario authority need separate design and test gates. AI may only paraphrase bounded hints or grounded dialogue; deterministic code remains the authority for facts, approvals, time and grading.

## Extension rules

1. Add missions as versioned content with sources, objectives, allowed actions, recovery and tests; reuse shared simulation and UI systems.
2. Introduce new tools only when their mission requires them. Future WBS, RAID, change control, procurement and portfolio views must connect to canonical state.
3. Different sectors need different operational constraints and believable stories, not the same answer sequence with different labels.
4. Preserve old save compatibility through explicit migration or an honest incompatibility path.
5. Keep core gameplay available without a backend or optional AI service.
