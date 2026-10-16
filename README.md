# ProjectQuest

A playable career in project management. A browser-first, third-person 3D simulation where evidence, project artefacts, and decisions drive learning and consequences.

The source of truth is the supplied [Game Design Document](docs/design/ProjectQuest_Comprehensive_Game_Design_Document.docx). Its [text extraction](docs/design/source-text.md) is also included for search and review.

## Current milestone

The construction internship has two playable chapters. In **The Missing Materials** (`CONST-I01`), create your character, enter the 3D office/site, gather delivery evidence, update the task and issue records, and take a recommendation through the 10:30 checkpoint. Continue directly into **The Slipping Milestone** (`CONST-I02`) with the same profile, project consequences and career evidence.

Day 2 uses a working scheduling tool: edit four task durations and predecessor links, trace a survey that blocks two activities, and recalculate the foundation forecast. Sam supplies the verified duration, Taylor confirms acceptance gates, and Alex reviews the recommendation before the deliberate 11:00 checkpoint. Both chapters end with causal, source-cited feedback and saved case studies.

Construction is the only playable industry. Software and the other four sectors remain future content. Day 3, **The Stakeholder Check-in**, the remainder of the first week, promotions beyond intern and the full career simulation remain on the [roadmap](docs/roadmap.md). Broader character/environment art, learner playtests, subject-matter review and representative-hardware benchmarks are still outstanding. Original music and self-hosted fonts are included.

Development is on `feat/projectquest-browser`; `main` has not been merged and no public deployment is implied. See [verification](docs/verification.md) for completed validation runs and checked remote commits. Test counts belong to the recorded run, not to this feature summary.

## Install and run

Requires Node.js 22 or newer and npm. No backend, account, credentials, or API keys are needed.

Use the existing cloud checkout; each task is already isolated and does not need a Git worktree:

```bash
cd /workspace/projectquest
npm ci
npm run dev
```

Vite reports the development address in your terminal. Open it in a modern desktop browser with WebGL. A static production build is supported; no backend, account, credentials, or API keys are needed to play.

npm's cache can be kept in the writable workspace:

```bash
npm --cache /workspace/.cache/projectquest-npm ci
```

For another machine, clone the development branch from the canonical repository:

```bash
git clone --branch feat/projectquest-browser https://github.com/Dkingony609/projectquest.git
cd projectquest
npm ci
npm run dev
```

The game is on `feat/projectquest-browser`; `main` remains unchanged until a separate merge.

## Play

| Control                               | Action                                                      |
| ------------------------------------- | ----------------------------------------------------------- |
| WASD / arrow keys                     | Walk with collision                                         |
| Drag the world                        | Orbit the third-person camera                               |
| Mouse wheel                           | Zoom the third-person camera                                |
| Click ground / a labelled world route | Walk along a path around obstacles                          |
| E / contextual interaction button     | Interact with a nearby colleague or station                 |
| T                                     | Open the portable project tablet for the current assignment |
| J                                     | Open the mission journal                                    |
| Escape                                | Close a panel, or open settings from the workplace          |
| Tab / Shift+Tab                       | Navigate semantic interface controls                        |

Accessible navigation offers labelled routes beside the same 3D sources. A graphics-failure route also permits investigation and tools without WebGL. Reduced motion, high contrast, larger text and lower graphics cost are available in settings. These controls support the learning loop; formal assistive-technology validation is still required.

Project time advances only when you choose a checkpoint. Day 1 requires schedule, Sam and Morgan evidence; Taylor adds acceptance-check detail. Day 2 requires the schedule, Sam and Taylor; Morgan provides optional capacity context. Waiting and requesting approved recovery support are legitimate responses with different cost/forecast effects. Unsupported promises and attempts to bypass approval or acceptance gates have recorded consequences.

Conversation answers, response cards and mentor-review answers commit when chosen. Their alternatives remain greyed out after closing or reloading. A separate documented follow-up can recover missing evidence while retaining the original relationship consequence. Working records remain editable during investigation.

Continue to Day 2 from the Day 1 debrief. Day 1 replay starts a fresh career practice run. Day 2 replay restores your actual Day 1 checkpoint and replaces the Day 2 result; rewards do not stack. Your role remains Junior PM Intern.

Progress saves in this browser's localStorage. It is not a cloud backup and does not transfer across devices/origins. The main menu resumes validated progress; starting a new career replaces the current save after confirmation. The save envelope is version 2, with compatibility for verified original version 1 saves. Storage failures and incompatible/corrupt saves show a recovery message.

## Checks and production build

```bash
npm run lint
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run preview
```

If Chromium is already installed, skip its download and use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Browser tests start Vite automatically on port 5173. Build output goes to `dist/` and can be served by a static HTTPS host. A production deployment is not created automatically. The [testing guide](docs/testing.md) separates checks already run from automated browser checks from future accessibility, research and hardware gates.

## Continue development

- [Architecture](docs/architecture.md): world, deterministic domain, content and UI boundaries.
- [Roadmap](docs/roadmap.md): verifiable milestones and full-product scope.
- [Content and game systems](docs/content.md): construction mission structure and assessment.
- [Testing](docs/testing.md): automated checks and human playtest gates.
- [Decision log](docs/decisions.md): technology, scope, art and accessibility decisions.

Original temporary procedural geometry is used for the current workplace. The player and all NPCs now use textured, rigged human assets with idle/walk animation. Richer environment art, broader character identities and a reviewed audio library remain production work. This game teaches general skills; it does not award professional accreditation.

## Sound, typography and committed decisions

An original 78 BPM, 32-bar instrumental score (piano, pad, bass and brushed percussion) starts after your first interaction. Settings provide independent music/effects volume and mute; hidden tabs suspend audio. All relevant sound cues also have visible feedback. Audio and the new Manrope/DM Serif Display fonts are self-hosted with no external runtime service. Font licences are in `public/fonts`; the original score recipe is in `src/audio`.

The original composition and sound effects accompany both chapters. Audio starts after a user gesture and remains optional; every relevant cue has visible feedback. Legacy progress retains its recorded consequences when it is migrated and continued.

## Rigged human characters (v0.3.0)

Both selectable body types and all four NPCs use actual 3D human meshes, textured faces, fingers, clothing and independently animated skeletons. The character creator previews the same assets with full-body, face and hand views. Existing appearances and old saves remain supported. Shared office, site/PPE, clinical, events, manufacturing and energy outfits support future content; construction is still the only playable industry.

Models are bundled locally; no Blender installation or asset service is required to play. The [character guide](docs/characters.md) explains animation, lifecycle, outfits and limits. [Asset notices](public/models/humans/NOTICE.md), CC0 terms and checksums accompany the files; optional [authoring instructions](scripts/characters/README.md) preserve the build recipe.

## Tablet and field notebook (v0.3.1)

Press **T** to open the project tablet: a framed device with an in-game status bar, independently scrolling screen, working tool tabs and a physical home control that puts it away. Existing schedule, task and issue tools still update the same project records; Day 2 retains its editable dependency plan.

Press **J** to open the field notebook. Turn spreads with Previous/Next or jump to Assignment, Evidence and Activity. Ruled paper, a bound spine and locally bundled Kalam handwriting present the same live objectives, verified source records and activity history. Reading or turning pages never changes project decisions or advances time. Keyboard focus, Escape, high contrast, larger text and portrait layouts remain supported.

See the [tool presentation guide](docs/tools.md) for captures, interaction details and implementation boundaries.
