# Testing and verification

These checks define acceptance criteria. A check is a verified result only when the corresponding command or browser run has actually succeeded. No automated check establishes learner gains, industry authenticity, or performance on hardware that was not tested.

## Developer checks

Use the repository's package scripts after installation; exact commands and current outcomes are recorded by the implementation milestone. The required engineering checks are a TypeScript check, production build, focused domain tests, and browser gameplay smoke/integration tests. Lint is required when a lint configuration is provided. Do not bypass TLS, package signatures or checksum verification to install dependencies.

| Check                         | Purpose                                                                        | Failure means                                                              |
| ----------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Type checking                 | Domain commands, UI state and world adapters agree                             | Fix contract errors before claiming runnable milestone                     |
| Production build              | Browser bundle and static assets resolve                                       | Fix bundling/asset defects; a dev page alone is insufficient               |
| Domain unit/integration tests | Validation, deterministic outcomes, assessment and save contracts              | Reproduce the branch/state failure and fix causal logic                    |
| Browser gameplay              | Actual launch, controls, tools, conversations, consequence and resume          | A build cannot substitute for this integration proof                       |
| Repository/remote review      | No secrets/generated dependencies; coherent committed milestone reached GitHub | Preserve local work, report exact push/access issue, do not claim delivery |

## M1 controller acceptance

1. Launch the application and wait for the world to render without a critical console/runtime error.
2. Hold each movement key, observe changed avatar/world position, and verify collisions keep the player inside usable paths.
3. Rotate the camera through allowed angles; the avatar and interactable areas remain visible and the camera stays bounded.
4. Approach an NPC, board and terminal: the focused affordance changes with proximity, and interaction targets the focused object.
5. Leave/re-enter the world or resize the viewport: listeners, loops and canvas resources do not multiply.

The world cannot be represented as verified by only counting a canvas element. Browser checks should exercise movement and interaction behavior. FPS targets require separate measured frame-time sampling and representative hardware.

## M2 mission and simulation tests

| Test                      | Required assertion                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New career                | Name/appearance and construction selection survive entry; role is Junior PM Intern                                                                          |
| Visible future sectors    | Unbuilt sector cannot silently start the construction mission or claim completion                                                                           |
| Briefing/preconditions    | Tools/actions follow mission dependencies; later events cannot bypass required valid state                                                                  |
| Three independent sources | Schedule, foreman and supplier provide different relevant information; duplicate inspection does not count as a new source                                  |
| Source provenance         | Uncertainty cannot turn a supplier estimate into an authoritative guarantee                                                                                 |
| Issue validation          | Missing owner, affected milestone, evidence, next checkpoint or invalid confidence produces readable errors; the rejected command preserves canonical state |
| Functional tools          | A valid task/issue change is retained and influences displayed project information; opening panels alone is not work evidence                               |
| Legitimate choices        | Wait-with-contingency and propose-alternative-with-approval are both available and produce explainable distinct trade-offs                                  |
| Governance branch         | Ordering without authority is flagged; it cannot earn the same authority score or promotion eligibility as a reviewed proposal                              |
| Unsupported promise       | Credibility and later forecast differ from honest uncertainty reporting; debrief cites the logged promise                                                   |
| Determinism               | Same saved starting state and commands yield the same event, project metrics and assessment                                                                 |
| Event idempotency         | Reloading or repeating submit/advance cannot duplicate the delivery event, XP or completed objectives                                                       |
| Rubric                    | Accuracy/impact/authority/follow-up stay within 0–3 and cite actually observed actions                                                                      |
| Career integrity          | A single Day 1 success does not promote the intern or label competency mastered                                                                             |
| Recovery                  | After a poor outcome, feedback and replay/recovery stay available; the game is not unwinnable                                                               |
| Persistence               | Valid in-progress and completed snapshots resume correctly; invalid versions, corrupt data and unavailable storage are handled safely                       |
| Accessible completion     | Semantic keyboard/click source and tool paths invoke the same validated commands as world interaction                                                       |

## End-to-end gameplay walkthrough

Start a new career, customise the player, choose construction, enter the workplace, approach the mentor and accept the briefing. Inspect the schedule, speak with the foreman, and confirm supplier status. Update a project artefact with source-backed facts, owner, dependency impact, uncertainty and a next check. Commit and submit an authorised recommendation, answer the confidence/impact review, advance the coordination checkpoint, and read the changed forecast, budget/trust trade-off and rubric feedback. Reload and confirm identity, mission and project state survived without reapplying the event.

Repeat using the other legitimate option and one governance failure branch. Use the alternative interaction path at least once. Test a narrow viewport for usable panel controls and scrolling, while distinguishing responsive UI from an unvalidated mobile 3D release.

## Two-chapter scheduling and persistence acceptance

These are required checks for the Day 2 increment; their presence in this guide does not claim they have already run.

| Check                        | Required assertion                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chapter entry                | Continue is available only from completed Day 1; profile, accumulated XP, relationships, forecast, costs, trust and the first case study survive                         |
| New investigation            | Day 2 starts with its own evidence; schedule, Sam and Taylor are required, Morgan is optional; Day 1 response locks do not block new conversations                       |
| Real scheduling tool         | Duration inputs and predecessor checkboxes recalculate timings from the current graph, including changed task duration and each parallel branch                          |
| Graph validation             | Duplicate IDs, invalid/non-whole durations, missing predecessors and cycles are rejected; valid parallel paths use the maximum predecessor finish                        |
| Diamond evidence             | The saved plan includes survey → inspection, survey → off-site formwork, and both branches → pour, with Sam's verified two-day survey                                    |
| Baseline and forecast        | Four-day baseline vs five-day verified chain moves the carried forecast by one; plan editing does not change the approved baseline or commit cost                        |
| Ownership and provenance     | Save requires schedule/Sam/Taylor evidence, Sam as owner and the 11:00 check; rejected commands preserve canonical state                                                 |
| Committed choices            | NPC answer, response card and mentor answer remain selected while alternatives stay disabled after reopening and reload; premature rejected actions create no commitment |
| Evidence recovery            | A pressured conversation can be followed up for facts without restoring the original relationship cost or unlocking the answer                                           |
| Legitimate responses         | Waiting adds one day with no new spend; approved extra-team support recovers the additional day for 1,200 credits after capacity/acceptance checks                       |
| Approval boundary            | A submitted proposal cannot authorise spending; bypass/unsupported assurance is challenged, and no unsafe work or waived acceptance gate is applied                      |
| Event and reward idempotency | Repeated advance/transition/completion cannot apply cost or XP twice; Day 2 replay reconstructs the actual Day 1 result and replaces Day 2 rewards                       |
| Career history               | Both completed case studies retain per-mission scores, XP and outcomes; the intern role and prior consequences remain                                                    |
| Original save fixtures       | Genuine schema-1 in-progress and completed journals, including historical dual-answer conversations, replay under their original semantics before migration              |
| Legacy preservation          | Migrated outcomes/scores are unchanged; edited legacy snapshots are rejected; schema-2 export/reload/continuation preserves the legacy replay prefix                     |
| New save integrity           | Schema-2 checkpoints across both chapters reconstruct from the journal; altered plan/metrics, unsupported versions, duplicate and out-of-order commands are rejected     |

Continue the Day 1 walkthrough into Day 2. Accept Alex's new briefing, inspect the diamond schedule, obtain Sam/Taylor evidence, enter the two-day survey and all four links, save Sam's 11:00 follow-up, and compare both response estimates. Commit one response, submit conditional wording, answer the mentor review and advance to 11:00. Verify the forecast/cost delta and both career case studies, then reload and replay Day 2 to check that the prior outcome is retained and rewards do not accumulate. Repeat for the second legitimate response and a rejected bypass or assurance.

## Presentation and local assets

Verify that the Ogg/MP3 score and WOFF2 fonts resolve from the build without runtime third-party requests. Audio should begin after a user gesture, obey independent persisted music/effects volume and mute, suspend in hidden tabs and resume safely. Browser checks should inspect actual audio output where supported and retain visible cues when audio is unavailable. Check that font licence/provenance files remain present; score-authoring tools are optional and must not become install/start prerequisites. Signal validation and browser output checks do not establish human listening quality.

## Research and release gates

| Gate                       | Required evidence                                                                                                        | Current expectation                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Novice usability           | Players complete the loop without facilitation, first work artefact within target onboarding window, explain consequence | Moderated playtest after stable slice            |
| Learning transfer          | New-context pre/post work task, rather than repeated answer memorisation                                                 | Learning designer and representative learners    |
| PM authenticity            | Experienced PM reviews authority, uncertainty, dependencies and realistic trade-offs                                     | Subject-matter review before release claims      |
| Sector/jurisdiction safety | Domain review; no implied ability to waive clinical/engineering/legal checks                                             | Every regulated pack needs review                |
| Accessibility              | Keyboard-only and alternative-control mission completion; text, contrast/motion and assistive technology checks          | Formal pass beyond semantic DOM implementation   |
| Performance                | Load and frame-time records with browser, CPU/GPU, viewport, quality and scene                                           | No minimum-hardware FPS claim before measurement |
| Engine comparison          | Same representative mission in Three.js and Godot with usability/build/maintenance measures                              | Deferred candidate-selection gate                |

## Milestone results

Initial documentation defines intended checks only. The milestone owner records the commands actually run, browser behavior observed, failures repaired, remaining limitations, branch and verified remote commit when delivering M1/M2. Remote delivery and a production build should never be called a public deployment unless deployment was separately performed and checked.

Record current commands, counts, failures and verified remote commits in [verification.md](verification.md) after each run. Earlier results apply only to their recorded revision and scope; they do not validate new scheduling or migration behavior. Use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --workers=1` on this CPU-only cloud machine to avoid competing software-rendered browsers. Automated engineering checks do not complete the separate research, assistive-technology, listening-review and target-hardware gates.
