# ProjectQuest

A playable career in project management. A browser-first, third-person 3D simulation where evidence, project artefacts, and decisions drive learning and consequences.

The source of truth is the supplied [Game Design Document](docs/design/ProjectQuest_Comprehensive_Game_Design_Document.docx). Its [text extraction](docs/design/source-text.md) is also included for search and review.

## Current milestone

The implementation contains a complete engineering slice of **The Missing Materials** (`CONST-I01`), the first construction internship assignment. Create your character, enter a navigable 3D office/site, meet Alex, inspect the schedule, interview colleagues, update the delivery card and issue log, and recommend a response. The 10:30 checkpoint applies project consequences; a four-part, source-cited debrief and local save preserve your progress.

Construction is the only playable industry. Software and the other four sectors are labelled future content. Five-day campaigns, promotions beyond intern, and the full career simulation remain on the [roadmap](docs/roadmap.md). Bespoke production art/audio, human learner playtests, subject-matter review, and representative-hardware benchmarks remain outstanding.

Both implementation milestones are pushed to `feat/projectquest-browser`: `e814373` is the 3D foundation and `5c1836a` is the integrated first-day chapter. The remote branch was checked against the full local commit SHA after pushing. Local validation passed 39 unit/integration tests, six Chromium acceptance tests, lint and the production build. Earlier HTTP 403 push denials are resolved. See [verification](docs/verification.md) for scope and evidence. The development branch has not been merged into `main`.

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

| Control                               | Action                                                               |
| ------------------------------------- | -------------------------------------------------------------------- |
| WASD / arrow keys                     | Walk with collision                                                  |
| Drag the world                        | Orbit the third-person camera                                        |
| Click ground / a labelled world route | Walk along a path around obstacles                                   |
| E / contextual interaction button     | Interact with a nearby colleague or station                          |
| T                                     | Open the portable project tablet: tasks, schedule and issue register |
| J                                     | Open the mission journal                                             |
| Escape                                | Close a panel, or open settings from the workplace                   |
| Tab / Shift+Tab                       | Navigate semantic interface controls                                 |

Accessible navigation offers labelled routes beside the same 3D sources. A graphics-failure route also permits investigation and tools without WebGL. Reduced motion, high contrast, larger text and lower graphics cost are available in settings. These controls support the learning loop; formal assistive-technology validation is still required.

Project time advances only when you choose the checkpoint. Read the schedule, speak with Sam and Morgan, and record their evidence before reporting. Taylor provides optional acceptance-check detail. Waiting with a contingency and requesting an approved alternate are legitimate responses with different costs and forecasts. Unsupported promises and attempts to order beyond your authority have recoverable consequences. Replay starts a fresh practice run, including XP; one mission does not grant a promotion.

Progress saves in this browser's localStorage. It is not a cloud backup and does not transfer across devices/origins. The main menu can resume valid progress; starting a new career replaces the current save after confirmation. Storage failures and incompatible/corrupt saves show a recovery message.

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

Original temporary procedural geometry is used for the current workplace. Bespoke characters, environment assets and audio remain production work. This game teaches general skills; it does not award professional accreditation.
