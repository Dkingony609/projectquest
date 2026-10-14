# ProjectQuest

A playable career in project management. A browser-first, third-person 3D simulation where evidence, project artefacts, and decisions drive learning and consequences.

The source of truth is the supplied [Game Design Document](docs/design/ProjectQuest_Comprehensive_Game_Design_Document.docx). Its [text extraction](docs/design/source-text.md) is also included for search and review.

## Current milestone

Milestone 01 provides the browser architecture and an explorable 3D workplace: third-person movement, camera orbit, collision, click-to-move, and proximity interactions. It is an interaction sandbox. The next milestone integrates the GDD's construction Day 1 mission, **The Missing Materials**, with project tools, simulation, competency feedback, and persistent saves.

## Install and run

Requires Node.js 22 or newer and npm. No backend, account, credentials, or API keys are needed.

```bash
git clone https://github.com/Dkingony609/projectquest.git
cd projectquest
git switch feat/projectquest-browser
npm ci
npm run dev
```

Vite reports the development address in your terminal. Open that address in a modern desktop browser with WebGL. WASD or arrow keys move, dragging the world rotates the camera, E interacts with a nearby station, and clicking the ground walks to a location. Detailed work will use accessible HTML interfaces.

For this cloud workspace use the existing checkout at `/workspace/projectquest`; tasks are already isolated and do not need a Git worktree. npm's cache can be kept in the writable workspace:

```bash
npm --cache /workspace/.cache/projectquest-npm ci
```

## Checks and production build

```bash
npm run lint
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run preview
```

If Chromium is already installed, skip its download and use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Browser tests start Vite automatically. Build output goes to `dist/` and can be served by a static HTTPS host. A production deployment is not created automatically.

## Continue development

- [Architecture](docs/architecture.md): world, deterministic domain, content and UI boundaries.
- [Roadmap](docs/roadmap.md): verifiable milestones and full-product scope.
- [Content and game systems](docs/content.md): construction mission structure and assessment.
- [Testing](docs/testing.md): automated checks and human playtest gates.
- [Decision log](docs/decisions.md): technology, scope, art and accessibility decisions.

Original temporary procedural geometry is used for the current workplace. Bespoke characters, environment assets and audio remain production work. This game teaches general skills; it does not award professional accreditation.
