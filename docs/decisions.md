# Development decisions

The decisions here adapt the [GDD](design/ProjectQuest_Comprehensive_Game_Design_Document.docx) to a new browser repository. They record implementation choices, not measured product validation.

## ADR 001 — Provisional browser-first Three.js runtime

**Status:** Accepted for the first implementation, subject to comparison.

**Context:** The user explicitly requests a real playable browser game. The GDD names Three.js/React Three Fiber as a strong browser-first candidate and Godot as a strong game-first candidate. It asks for the same ten-minute mission in the top two engines and measured comparison before a final commitment. The checkout has no existing engine architecture to preserve.

**Decision:** Use direct Three.js with React 19, TypeScript and Vite to build the first end-to-end browser mission. Keep simulation, authored content and assessment independent of renderer APIs. Defer the Godot comparison to M3 rather than make a performance claim before a working representative mission exists.

**Consequence:** Immediate browser delivery and accessible DOM tools are practical. Camera/controller, collision, animation, world lifecycle and authoring need explicit engineering. This is a provisional candidate selection, not completion of the GDD's dual-engine technical-selection gate. Record load, frame time, accessibility, build complexity and maintenance on representative machines before making a final engine commitment.

## ADR 002 — One deep construction internship slice

**Status:** Accepted.

**Context:** The request describes six sectors and full executive progression, while the GDD separates long-term scope from a one-mission vertical slice and two-sector MVP.

**Decision:** Implement `CONST-I01`, “The Missing Materials,” first. Construction is playable; software is visible as future content. Any additional industry cards explicitly identify planned packs. Reuse one domain engine and industry-pack contract; do not create separate sector applications.

**Consequence:** The slice demonstrates the complete learning loop without claiming six playable careers. Software and the four other sectors require distinct, reviewed stories and mechanics. Career starts as intern; successful Day 1 unlocks practice or the next development step rather than granting a promotion.

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

**Consequence:** The first build can demonstrate real movement, proximity interaction and state-driven feedback. Bespoke character models/rigs, rich animation, textures, environment packs, sound, music and VFX remain outstanding. Procedural assets are intentionally interim art; passing a build does not establish the GDD's eventual production-art quality or hardware performance.

## ADR 007 — Accessible tools supplement physical discovery

**Status:** Accepted.

**Decision:** Keep 3D movement and proximity-based discovery central while exposing semantic keyboard/click alternatives for key sources and tools. Use legible 2D panels for issue fields, task details, sources and feedback. Do not require audio cues, reaction speed, drag-and-drop, or reading tiny world labels to finish the learning objective.

**Consequence:** Alternative interaction can complete the same domain commands and assessment. World affordances still make locations and work context meaningful. Formal screen-reader, keyboard-only, low-motion and device validation remain explicit M3 gates; do not describe an automated DOM check as an accessibility certification.

## ADR 008 — Retain the renderer during accessible travel and pause its backdrop

**Status:** Accepted after browser validation exposed software-rendering overhead.

**Decision:** A presentation checkpoint moves the avatar to a validated accessible destination without recreating the WebGL scene. An open tool/dialog renders its backdrop once and suspends repeated GPU draws until the relevant visual state or size changes. Project commands and UI input continue normally; project time remains deliberate. The rear office facade cuts away on the site side to keep the player and source characters visible.

**Consequence:** Accessible source visits avoid repeated shader compilation and resource creation, while semantic tools remain responsive on software graphics. The browser acceptance run that originally timed out is preserved as a diagnosed failure, followed by reruns after this correction. This optimisation does not establish representative-device FPS.
