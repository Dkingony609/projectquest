# Implementation verification

## Milestone 01 — Browser architecture and 3D interaction foundation

Implemented the Vite/React/TypeScript/Three.js application, compact office and construction-site environment, animated avatar, third-person camera, WASD/arrow movement, collision, click-to-move, proximity E/click interactions, and graphics-failure alternative. Preserved the original GDD and recorded architecture, decisions, content contracts and roadmap.

Verified in this cloud instance:

- `npm run build`: TypeScript and production build passed.
- `npm run lint`: passed.
- `npm test`: five collision tests passed (bounds, furniture, doorway, thin-wall tunnelling, wall sliding).
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: one Chromium test passed. It launches the renderer, moves with actual keyboard input, approaches Alex, opens a proximity dialogue with E, returns to the world, and returns to the menu. No browser JavaScript errors were observed.
- Visually inspected the rendered office screenshot.

The browser test uses a 960×640 viewport and software graphics in this environment. Its 37.5-second runtime is test execution time, not a hardware FPS benchmark. A low-frame-rate controller timing issue found during validation was corrected; collision substeps still prevent tunnelling. Browser-side key-release monitoring avoids delayed external polling overshooting the intended path.

Limitations at this milestone: this is a labelled interaction sandbox, not yet the complete internship mission. Direct click routes can stop at obstacles; pathfinding is scheduled during integrated-slice work. The 778 kB initial production JavaScript bundle warrants splitting when the mission UI is added. Full asset production, representative hardware performance, learner playtests and subject-matter review are not verified.

Git branch: `feat/projectquest-browser`. The commit itself records this milestone; the root agent separately verifies its remote push before beginning integration.

## Milestone 02 — Integrated construction Day 1

Implemented a browser-playable CONST-I01 chapter: character appearance/name/guidance, clearly scoped industry placement, mentor briefing, independent schedule/crew/supplier evidence, optional safety conversation, functional task and issue records, dependency schedule and quantified response comparison, four recommendation branches, explicit mentor authority review, a deliberate 10:30 checkpoint, causal outcomes and cited competency feedback. Local versioned saves replay-validate the command journal; corrupt state is rejected. Replay is a fresh practice run, with no reward farming or automatic promotion.

The 3D world now routes clicks through doors and around obstacles. Static geometry batches and baked shadows reduce repeated rendering work. Low graphics settings and automatic software-renderer detection are supported. Accessible travel retains the renderer instead of rebuilding it, and open tools/dialogs freeze their 3D backdrop while continuing to accept UI input. A rear-facade cutaway preserves site visibility. The React/Three bundles are split, removing the original oversized initial-bundle warning.

Checks in the current instance:

- Production build and TypeScript passed after integration.
- ESLint passed.
- 39 unit/integration tests passed: 24 domain/save tests and 15 collision/pathfinding tests.
- Separate Chromium UI walkthroughs completed briefing, evidence, validated tools, both optional-comparison validation states, a wait recommendation, mentor review, checkpoint and debrief. Modal focus, Escape/restore and keyboard tabs were exercised.
- Separate actual 3D route smoke passed spawn → mentor → board → delivery lead, including room/site doorways, proximity and E interactions; no page JavaScript errors occurred.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e -- --workers=1`: all six browser tests passed in 3.3 minutes. Verified a complete wait path and stable resume; an alternate approved only after acceptance; a blocked unauthorised order and fresh recovery; corrupt-save recovery; portrait sizing, settings and focus; and real character customisation/WASD/E mentor interaction.

Audit corrections: false guarantees no longer earn factual-accuracy credit; strong impact requires an explicitly recorded correct comparison; deferred reviews receive feedback about the action actually taken; duplicate questions cannot farm relationships; unauthorised procurement cannot receive strong follow-up simply for inspecting safety evidence. Interns recommend; Alex authorises and Sam/Taylor verify conditions before alternate spending.

An early full browser run exceeded its software-rendering time budget after completing evidence and tool edits. Profiling identified repeated renderer creation during accessible travel and continuous GPU work behind paused panels. Those runtime costs were corrected before rerunning acceptance. This timeout was not reported as a passing test.

Limits: one construction first-day chapter is implemented. Later campaign days, other sectors and career promotions remain future work. Procedural assets remain interim; human learner/SME review, assistive-technology certification, Godot comparison and representative laptop benchmarks were not performed. SwiftShader measurements in this CPU-only environment are not a validated minimum-device specification. No production website is deployed.

Delivery: M1 commit `e814373` and M2 commit `5c1836a` were initially local because GitHub denied pushes with HTTP 403. After the user reported access was available, `git push -u origin feat/projectquest-browser` succeeded. `git ls-remote origin refs/heads/feat/projectquest-browser` returned `5c1836ab008410446294e2da51b8ace6cad6771a`, exactly matching the full local implementation commit. Both milestones are now remotely delivered on the development branch. `main` was not merged and no deployment was performed. The source Git bundle and static archive remain backups of the implementation snapshot.

Reusable environment install_script and start_skill were saved as a configuration draft. Saving did not execute or publish that draft. The implementation is now available from its remote development branch; fresh-task environment restoration is not independently verified. Environment publication remains separate from GitHub delivery.

Final reproducibility check: `npm --cache /workspace/.cache/projectquest-npm ci` passed from the frozen lockfile, followed by a passing build, lint and all 39 tests. Source formatting was normalised without logic changes. Initial UI JavaScript is approximately 309 kB (94 kB gzip); the separately loaded Three.js world is approximately 564 kB (144 kB gzip). No chunk-size warning remains. GitHub Actions checks are defined and are now present on the pushed branch. Remote workflow results have not been checked; the passing checks reported here are local results.

## Feedback milestone — music, typography and committed choices

Implemented the original 98-second “First Light at Riverside” instrumental, scene mixing and musical effects; gesture-safe playback, music/effects levels, mute, hidden-tab suspension and graceful no-audio support. Added self-hosted Manrope and DM Serif Display with SIL OFL notices. Committed dialogue and recommendation choices are canonical, visibly disabled and retained across panels/saves; a separate documented recovery preserves a pressured conversation's cost. Old save journals remain replay-compatible.

Verified: build and TypeScript, ESLint, 52 unit/integration tests and eight Chromium acceptance tests passed. The new audio browser test decoded and played the real score, measured nonzero post-master output, verified zero music output at volume zero and mute, reloaded settings, loaded actual font files, and checked graceful unsupported-audio behavior. Existing complete Day 1 paths, movement, save/resume and portrait controls still passed. Signal checks of the rendered score record peak0.76, RMS0.1395 and a bounded loop seam; no subjective listening-panel claim is made. No extra mission is claimed until the next milestone.

## Feedback milestone — The Slipping Milestone (v0.2.0)

Implemented CONST-I02 in the same construction campaign: an explicit Day 1 → Day 2 transition carries the profile, relationships, project forecast/cost/trust, event journal and earned XP. The learner inspects the schedule, verifies the survey with Sam and acceptance with Taylor, edits four task durations and four predecessor links, and saves Sam’s 11:00 follow-up. The pure scheduler computes early/late dates, float and critical activities. The baseline stays fixed while the working forecast reflects the verified chain.

Four committed responses have distinct outcomes. An honest revised sequence adds one day without extra spend; approved survey support recovers the additional day for 1,200 credits after verification. Unsupported promises or inspection-bypass proposals are rejected and incur coordination consequences; unsafe work is never executed. Source-cited feedback and both case studies persist, and replay restores the actual Day 1 checkpoint instead of stacking Day 2 rewards.

New envelopes use schema 2 while retaining the existing browser storage key. A literal pre-campaign schema-1 fixture, including a historically permitted dual-answer conversation, loads with identical project values, scores and history; it can continue, re-save, complete Day 2 and replay. Invalid graphs, missing source links, edited canonical state and duplicate completion are rejected. Equivalent reordered plans are normalized and do not add duplicate events.

Local production build/TypeScript, ESLint and all 89 unit/integration tests pass. The full Chromium run completed all 11 existing acceptance cases in 5.9 minutes, including the three new Day 2 paths: approved support with legacy migration/reload/replay, blocked inspection bypass, and honest revised sequence with two career records. Audio playback/output, fonts, Day 1 branches, corrupt-save recovery, portrait controls and real character movement still passed.

A twelfth browser case checks the read-only Day 2 dependency tool at 390px width and keyboard navigation. Reviewing inherited fieldset disabling identified a focus-trap edge: disabled descendants are now excluded using `:disabled`. Both this case and the existing portrait/focus case passed after correction. Dependency arrows use inline SVG so font coverage does not affect the graph. The focused Day 2 check is repeated after that presentation update; no gameplay rules changed. CI runs the same single-worker browser command to avoid competing software-rendered scenes.

An initial browser attempt reused a development server that exited during the Day 1 reload, producing connection-refused failures. It was rerun against a persistent server owned by this task; that completed run is the acceptance evidence above. An earlier Day 2 test locator was corrected to include the toolbar's shortcut-bearing accessible label. Failed or interrupted attempts were not counted as passes.

A separate HTTP-served production smoke loaded the real built app, continued an original save into Day 2, displayed the 3D workplace and planning tool, confirmed portrait fields fit, checked keyboard tabs, and retrieved the bundled score/font assets. No page errors or failed resources occurred. Screenshots were inspected. These are local results; the remote GitHub Actions run and a public deployment are not claimed.

Delivery branch: `feat/projectquest-browser`. The Day 2 commit records this milestone; its exact remote SHA is independently checked after pushing. The previous sound/font/commitment milestone was pushed and verified as `6018a38d8a9bc32d37817dfdecec0eaa90d36176`. The downloadable static archive and Git source bundle are regenerated from the final build/commit outside the checkout.

Limits: two construction internship chapters, authored interim geometry, discrete checkpoints and a bounded scheduling scenario. Day 3 onward, other industries and promotions remain future work. No public deployment, target-hardware FPS, human learning-effectiveness, listening-panel or formal assistive-technology validation is claimed.

## Character upgrade — rigged humans (v0.3.0)

**Implemented:** Replaced primitive player/NPC bodies with locally bundled, textured MakeHuman CC0 anatomical meshes and separate 53-bone rigs. Two selectable human builds, natural faces/finger geometry, UV clothing/skin/hair, smoothly blended in-place Idle/Walk clips, scene-specific PPE and shared industry wardrobe configurations use one renderer. The character creator now previews the actual 3D assets with face/hand/full-body views. Body/colour choices persist, original saves retain their prior state, and movement/collision/camera/dialogue/mission commands remain unchanged. Added bounded camera zoom, model loading/retry/cancellation, independent material/skeleton ownership and GPU cleanup. Sources, licences, checksums and optional Blender authoring scripts are bundled and documented.

**Verified in the current cloud instance:**

- `npm run build`: TypeScript and production build passed. No chunk-size warning; the shared human/Three.js chunk is approximately 640 kB (162 kB gzip), lazy preview approximately 6 kB, world approximately 28 kB. The two complete locally bundled model files total approximately 7.9 MB, including embedded textures and optional wardrobe geometry.
- `npm run lint`: passed.
- `npm test`: all 99 tests across eight files passed, including real GLB structure, independent skeleton/material instances, walk/idle blending, loading cancellation/disposal and both new/legacy appearance saves.
- `CHROMIUM_PATH=/usr/bin/chromium npx playwright test --workers=1`: all 15 acceptance tests passed in one completed 6.8-minute run. The three new character cases exercised actual skinned meshes, both body builds, material choices/reload, five independent world rigs, live walking/idle/collision, mentor interaction, camera orbit/zoom and failed-model retry/accessibility. All twelve previous audio, Day 1, Day 2, migration, replay, portrait/focus and movement cases also passed.
- Inspected browser face, hand, full-body and workplace screenshots, plus an offline clinical-outfit render. Captures are linked in [characters.md](characters.md). Visual review identified an inward-facing hardhat crown; corrected the source winding, re-exported both assets and reran the complete passing suite before delivery.
- The offline Blender export completed successfully with `--python-exit-code 1`. Python authoring-script syntax, production/model SHA-256 matches and the rebuilt static archive's CRC/model checksums were checked.

An earlier browser attempt overlapped two test runners and lost an audio trace artifact; it was interrupted, as was the pre-hardhat-correction run. Neither is counted as the final result. The final single-worker run above completed all fifteen checks without failures.

**Limits:** These are two semi-realistic game character builds with colour/workplace variations, not a large face/hair collection or facial/lip animation system. Construction remains the only playable industry with two chapters; wardrobe support does not create other campaigns. Broader production art, representative-device FPS, learner/subject-matter review and public deployment remain outstanding. Cloud Chromium uses software graphics and is not a hardware benchmark.

**GitHub:** Development branch `feat/projectquest-browser`; this milestone is recorded by its implementation commit. Its full SHA is checked against the remote after pushing. `main` is not merged and no deployment is implied. The source bundle and playable static archive are regenerated from the delivered revision.

**Next:** Construction Day 3, “The Stakeholder Check-in,” followed by reviewed content and broader character identities according to the roadmap.
