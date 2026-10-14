# Testing and verification

These checks define acceptance criteria. A check is a verified result only when the corresponding command or browser run has actually succeeded. No automated check establishes learner gains, industry authenticity, or performance on hardware that was not tested.

## Developer checks

Use the repository's package scripts after installation; exact commands and current outcomes are recorded by the implementation milestone. The required engineering checks are a TypeScript check, production build, focused domain tests, and browser gameplay smoke/integration tests. Lint is required when a lint configuration is provided. Do not bypass TLS, package signatures or checksum verification to install dependencies.

| Check | Purpose | Failure means |
| --- | --- | --- |
| Type checking | Domain commands, UI state and world adapters agree | Fix contract errors before claiming runnable milestone |
| Production build | Browser bundle and static assets resolve | Fix bundling/asset defects; a dev page alone is insufficient |
| Domain unit/integration tests | Validation, deterministic outcomes, assessment and save contracts | Reproduce the branch/state failure and fix causal logic |
| Browser gameplay | Actual launch, controls, tools, conversations, consequence and resume | A build cannot substitute for this integration proof |
| Repository/remote review | No secrets/generated dependencies; coherent committed milestone reached GitHub | Preserve local work, report exact push/access issue, do not claim delivery |

## M1 controller acceptance

1. Launch the application and wait for the world to render without a critical console/runtime error.
2. Hold each movement key, observe changed avatar/world position, and verify collisions keep the player inside usable paths.
3. Rotate the camera through allowed angles; the avatar and interactable areas remain visible and the camera stays bounded.
4. Approach an NPC, board and terminal: the focused affordance changes with proximity, and interaction targets the focused object.
5. Leave/re-enter the world or resize the viewport: listeners, loops and canvas resources do not multiply.

The world cannot be represented as verified by only counting a canvas element. Browser checks should exercise movement and interaction behavior. FPS targets require separate measured frame-time sampling and representative hardware.

## M2 mission and simulation tests

| Test | Required assertion |
| --- | --- |
| New career | Name/appearance and construction selection survive entry; role is Junior PM Intern |
| Visible future sectors | Unbuilt sector cannot silently start the construction mission or claim completion |
| Briefing/preconditions | Tools/actions follow mission dependencies; later events cannot bypass required valid state |
| Three independent sources | Schedule, foreman and supplier provide different relevant information; duplicate inspection does not count as a new source |
| Source provenance | Uncertainty cannot turn a supplier estimate into an authoritative guarantee |
| Issue validation | Missing owner, affected milestone, evidence, next checkpoint or invalid confidence produces readable errors; the rejected command preserves canonical state |
| Functional tools | A valid task/issue change is retained and influences displayed project information; opening panels alone is not work evidence |
| Legitimate choices | Wait-with-contingency and propose-alternative-with-approval are both available and produce explainable distinct trade-offs |
| Governance branch | Ordering without authority is flagged; it cannot earn the same authority score or promotion eligibility as a reviewed proposal |
| Unsupported promise | Credibility and later forecast differ from honest uncertainty reporting; debrief cites the logged promise |
| Determinism | Same saved starting state and commands yield the same event, project metrics and assessment |
| Event idempotency | Reloading or repeating submit/advance cannot duplicate the delivery event, XP or completed objectives |
| Rubric | Accuracy/impact/authority/follow-up stay within 0–3 and cite actually observed actions |
| Career integrity | A single Day 1 success does not promote the intern or label competency mastered |
| Recovery | After a poor outcome, feedback and replay/recovery stay available; the game is not unwinnable |
| Persistence | Valid in-progress and completed snapshots resume correctly; invalid versions, corrupt data and unavailable storage are handled safely |
| Accessible completion | Semantic keyboard/click source and tool paths invoke the same validated commands as world interaction |

## End-to-end gameplay walkthrough

Start a new career, customise the player, choose construction, enter the workplace, approach the mentor and accept the briefing. Inspect the schedule, speak with the foreman, and confirm supplier status. Update a project artefact with source-backed facts, owner, dependency impact, uncertainty and a next check. Submit an authorised recommendation, answer the confidence/impact review, advance the coordination checkpoint, and read the changed forecast, budget/trust trade-off and rubric feedback. Reload and confirm identity, mission and project state survived without reapplying the event.

Repeat using the other legitimate option and one governance failure branch. Use the alternative interaction path at least once. Test a narrow viewport for usable panel controls and scrolling, while distinguishing responsive UI from an unvalidated mobile 3D release.

## Research and release gates

| Gate | Required evidence | Current expectation |
| --- | --- | --- |
| Novice usability | Players complete the loop without facilitation, first work artefact within target onboarding window, explain consequence | Moderated playtest after stable slice |
| Learning transfer | New-context pre/post work task, rather than repeated answer memorisation | Learning designer and representative learners |
| PM authenticity | Experienced PM reviews authority, uncertainty, dependencies and realistic trade-offs | Subject-matter review before release claims |
| Sector/jurisdiction safety | Domain review; no implied ability to waive clinical/engineering/legal checks | Every regulated pack needs review |
| Accessibility | Keyboard-only and alternative-control mission completion; text, contrast/motion and assistive technology checks | Formal pass beyond semantic DOM implementation |
| Performance | Load and frame-time records with browser, CPU/GPU, viewport, quality and scene | No minimum-hardware FPS claim before measurement |
| Engine comparison | Same representative mission in Three.js and Godot with usability/build/maintenance measures | Deferred candidate-selection gate |

## Milestone results

Initial documentation defines intended checks only. The milestone owner records the commands actually run, browser behavior observed, failures repaired, remaining limitations, branch and verified remote commit when delivering M1/M2. Remote delivery and a production build should never be called a public deployment unless deployment was separately performed and checked.
