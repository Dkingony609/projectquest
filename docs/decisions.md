# Development decisions

The decisions here adapt the [GDD](design/ProjectQuest_Comprehensive_Game_Design_Document.docx) to a new browser repository. They record implementation choices, not measured product validation.

## ADR 001 — Provisional browser-first Three.js runtime

**Status:** Accepted for the first implementation, subject to comparison.

**Context:** The user explicitly requests a real playable browser game. The GDD names Three.js/React Three Fiber as a strong browser-first candidate and Godot as a strong game-first candidate. It asks for the same ten-minute mission in the top two engines and measured comparison before a final commitment. The checkout has no existing engine architecture to preserve.

**Decision:** Use direct Three.js with React 19, TypeScript and Vite to build the first end-to-end browser mission. Keep simulation, authored content and assessment independent of renderer APIs. Defer the Godot comparison to M3 rather than make a performance claim before a working representative mission exists.

**Consequence:** Immediate browser delivery and accessible DOM tools are practical. Camera/controller, collision, animation, world lifecycle and authoring need explicit engineering. This is a provisional candidate selection, not completion of the GDD's dual-engine technical-selection gate. Record load, frame time, accessibility, build complexity and maintenance on representative machines before making a final engine commitment.

## ADR 002 — One deep construction internship slice

**Status:** Accepted; extended to a second linked construction chapter by ADR 009.

**Context:** The request describes six sectors and full executive progression, while the GDD separates long-term scope from a one-mission vertical slice and two-sector MVP.

**Decision:** Implement `CONST-I01`, “The Missing Materials,” first. Construction is playable; software is visible as future content. Any additional industry cards explicitly identify planned packs. Reuse one domain engine and industry-pack contract; do not create separate sector applications.

**Consequence:** The first slice demonstrates the complete learning loop without claiming six playable careers. Day 2 now provides a distinct planning task on the same project. Software and the four other sectors require their own reviewed stories and mechanics. Career starts as intern; completing either chapter provides evidence and practice without granting a promotion.

## ADR 003 — Deterministic code controls facts and consequences

**Status:** Accepted.

**Decision:** Use typed commands and pure state transitions for sources, mission progress, issues, proposals, checkpoint events and scoring. UI and NPC dialogue cannot bypass role permissions or required evidence. Authored dialogue and local saves work without an API or AI service. Deliberate time advancement avoids penalties while a learner reads.

**Consequence:** Branches are reproducible and testable. Events have stable IDs and are applied once. Later random variation must store a seed; future AI may only produce bounded presentation grounded in validated state. No client-facing API key or external data collection is needed.

## ADR 004 — Decision evidence before promotion

**Status:** Accepted.

**Decision:** Grade the first mission against accuracy, impact, authority and follow-up, each 0–3, and explain scores using actual logged actions. Track participation XP separately. Keep uncertainty, source provenance, authority and verified next steps visible in the tools and feedback.

**Consequence:** A good recommendation and a fast but unauthorised order can have different operational and ethical outcomes. Multiple legitimate responses remain possible. One scored scenario cannot establish mastery or professional certification; later promotions need independent scenario successes, required domain evidence, professional conduct and role challenges.

## ADR 005 — Local browser persistence, no backend prerequisite

**Status:** Accepted for the vertical slice.

**Decision:** Save a versioned validated snapshot and reproducible event history in browser localStorage. Resume at meaningful checkpoints and provide explicit replay/new-career actions. Detect corrupt, unsupported or unavailable storage and show a recoverable status.

**Consequence:** The game is easy to run and contains no service credentials. Saves belong to a browser origin/profile and are not cloud backups. Cross-device accounts, cloud sync, enterprise reports and multi-profile storage require future design, privacy and migration work. Save validation must not trust arbitrary storage objects as domain state.

## ADR 006 — Project-owned procedural assets

**Status:** Accepted for initial production.

**Decision:** Build a visually coherent compact hub, props and characters from procedural geometry authored in this repository. Avoid imported assets without explicit licensing/provenance.

**Consequence:** The first build demonstrates movement, proximity interaction and state-driven feedback. Original project-authored music/effects and self-hosted licensed typography are now bundled. Bespoke character models/rigs, rich animation, textures, environment packs, expanded audio and VFX remain production work. Procedural geometry is interim art; passing a build does not establish the GDD's eventual production-art quality or hardware performance.

## ADR 007 — Accessible tools supplement physical discovery

**Status:** Accepted.

**Decision:** Keep 3D movement and proximity-based discovery central while exposing semantic keyboard/click alternatives for key sources and tools. Use legible 2D panels for issue fields, task details, sources and feedback. Do not require audio cues, reaction speed, drag-and-drop, or reading tiny world labels to finish the learning objective.

**Consequence:** Alternative interaction can complete the same domain commands and assessment. World affordances still make locations and work context meaningful. Formal screen-reader, keyboard-only, low-motion and device validation remain explicit M3 gates; do not describe an automated DOM check as an accessibility certification.

## ADR 008 — Retain the renderer during accessible travel and pause its backdrop

**Status:** Accepted after browser validation exposed software-rendering overhead.

**Decision:** A presentation checkpoint moves the avatar to a validated accessible destination without recreating the WebGL scene. An open tool/dialog renders its backdrop once and suspends repeated GPU draws until the relevant visual state or size changes. Project commands and UI input continue normally; project time remains deliberate. The rear office facade cuts away on the site side to keep the player and source characters visible.

**Consequence:** Accessible source visits avoid repeated shader compilation and resource creation, while semantic tools remain responsive on software graphics. The browser acceptance run that originally timed out is preserved as a diagnosed failure, followed by reruns after this correction. This optimisation does not establish representative-device FPS.

## ADR 009 — A second chapter teaches dependency planning through a working tool

**Status:** Accepted.

**Context:** The GDD names “The Slipping Milestone” as the next assignment: a minor-looking activity blocks two successors. Repeating the Day 1 delivery form would not demonstrate a new planning skill.

**Decision:** Add `CONST-I02` to the same construction campaign. Use four editable task durations and labelled predecessor checkboxes, backed by a pure finish-to-start scheduler. A setting-out survey gates inspection and off-site formwork; both gate the pour. Recalculate task timings and the working forecast from the graph. Carry Day 1 costs, trust, forecast, relationships and career evidence into Day 2. Require schedule/Sam/Taylor provenance, Sam's 11:00 follow-up and Alex's review; Morgan remains optional.

**Consequence:** The learner works with a dependency model and sees why the longer parallel branch controls the milestone. Waiting and requesting a second survey team have distinct schedule/cost effects. The approved baseline cannot be silently changed, no unsafe bypass is executed, and added spending occurs only after approval and checks. Durations and credits remain authored teaching assumptions, not construction estimates. Day 3 and further promotion are still planned.

## ADR 010 — Preserve committed decisions and historically valid saves

**Status:** Accepted.

**Decision:** Commit an NPC answer, response card and mentor answer when chosen, using canonical journal/state records. Disabled alternatives remain unavailable across panel reopening and reload. A documented follow-up recovers evidence after pressure while retaining the original choice and relationship cost. Scope conversation commitments to the current chapter so the same colleague can be interviewed in Day 2.

New saves use envelope schema 2 while retaining the existing localStorage key. Accept original schema-1 progress only after replay with its historical conversation semantics and full canonical-snapshot comparison, preserving its assessment and consequences. Retain the legacy journal prefix when re-saving and continuing under the new protocol; new decisions use the committed-choice rules. The prefix boundary is identified by new `followUp`/`chooseRecommendation` actions, with the remaining Day 1 rules unchanged; this release does not bundle a separate historical engine.

**Consequence:** Closing a panel cannot reset a consequential choice, and migration cannot regrade a previously completed assignment under changed rules. Historical dual-answer journals and tampered legacy snapshots require fixture coverage. Day 2 replay restores the actual Day 1 checkpoint and replaces Day 2 practice outcomes without stacking XP; new-career confirmation still protects the current browser save.

## ADR 011 — Self-host the original score and licensed typography

**Status:** Accepted.

**Decision:** Bundle the original “First Light at Riverside” instrumental score and authored effects, plus Manrope and DM Serif Display WOFF2 fonts with licence notices. Start audio only after a user gesture, persist independent music/effects preferences, suspend hidden-tab audio and provide visible feedback for meaningful cues.

**Consequence:** Gameplay needs no streaming, font service or audio-generation dependency. Audio remains optional. Python, NumPy and ffmpeg are score-authoring tools rather than application prerequisites. The bundled composition and signal/browser checks do not replace listening review or the broader production asset roadmap; provenance is recorded in `src/audio/README.md` and `public/fonts/README.md`.
