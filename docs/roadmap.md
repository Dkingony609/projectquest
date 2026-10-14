# Playable delivery roadmap

The [GDD](design/ProjectQuest_Comprehensive_Game_Design_Document.docx) targets a full career simulation across six sectors, but its vertical-slice gate is one deep construction internship mission. The implementation sequence below keeps each milestone runnable and separately verifiable. A completed milestone is tested, documented, committed, pushed to the canonical GitHub repository, and its remote commit checked before the next milestone is completed.

## Milestones and exit gates

| Milestone | Scope | Required exit evidence |
| --- | --- | --- |
| M1 — Browser game foundation | TypeScript/React/Vite architecture; provisional Three.js runtime; office/site greybox; avatar controls, camera, collision and interaction focus; domain and content contracts; design and developer documentation | Production build and types pass; controller smoke test confirms movement, world bounds and focus; browser starts without a critical runtime error; GitHub commit verified |
| M2 — Integrated `CONST-I01` vertical slice | Introduction; character creation; industry selection; intern placement; mentor briefing; three source investigation; authored dialogue; task/issue/schedule tools; two legitimate recommendations plus governance failure; deliberate consequences; four-criterion feedback; persistent progress and replay; accessible alternatives | Automated tests prove source/field/precondition validation, authority distinctions, different deterministic outcomes, save integrity and replay idempotency; browser run completes a mission and reloads; all exposed controls function; GitHub commit verified |
| M3 — Slice hardening and validation | Remappable controls, camera sensitivity and text sizing; broader accessibility and device verification; refined NPC animation, art and audio; novice and experienced learner playtests; content/SME review; comparative engine benchmark | Keyboard and alternative-control completion; documented representative hardware measurements; learners explain choice-to-consequence causality; learning, authenticity and fun tested separately; engine decision revisited with measurements |
| M4 — Construction first week | Days 2–5: slipping milestone, stakeholder check-in, scope surprise, recovery capstone; basic change control, meeting notes and truthful reporting; evidence-based coordinator readiness | Five resumable days, branching/recovery tests, novel-context competency evidence; capstone unlocks coordinator training without automatic promotion |
| M5 — Software MVP arc | Distinct software environment and five-day appointment-app release campaign; tickets, QA, change pressure and technical debt; industry transfer | Software cannot be solved by copying the construction answer order; independent QA/release outcomes; transferable evidence retained and sector gap taught |
| M6 — Coordinator and project-manager progression | Workstream coordination, WBS, integrated scope/cost/schedule/quality control, resource constraints, budgets, procurement and acceptance; controlled small-project ownership | Repeated independent competency evidence plus ethical and role challenge gates; permissions and scope grow with role; project recovery remains possible |
| M7 — Industry expansion | Healthcare, events, manufacturing and energy packs; facilities, regulatory/safety constraints and market-labelled terminology | Sector SMEs review credible constraints; distinct story arcs and approval logic; each pack has deterministic tests, recovery and accessibility gates |
| M8 — Senior career and production capabilities | Senior PM, programme, portfolio, delivery executive/consulting/sector tracks; benefits, investment and governance; localisation, scalable authoring and optional cloud sync | Multi-project decisions and longitudinal evidence; balanced sector throughput; privacy and migration requirements verified |
| M9 — Optional extensions | Bounded AI, cooperative play, institutional dashboards and curated educator content | Core missions still work offline of optional services; consent and permissions tested; AI cannot change canonical state or rubrics; community content moderation/licensing validated |

M1 and M2 are engineering delivery gates. M3's moderated playtesting and hardware/SME validation are separate from automated correctness and cannot be represented as already completed by a passing build. Release timing is intentionally unspecified.

## Full-requirement traceability

“M2 slice” means a deliberately narrow implementation, not the full breadth of the GDD system. The initial player role remains Junior PM Intern.

| GDD requirement | Initial coverage | Expansion / acceptance gate |
| --- | --- | --- |
| 1–3: action-first loop, autonomy and recoverable consequences | M1 controls; M2 investigation → artefact → recommendation → consequence → reflection | M3 first useful action and consequence comprehension playtests |
| 4: six industries and transferable proficiency | M2 construction playable; software visible as future content; remaining cards clearly future packs | M5/M7 distinctive full packs and retained core competency evidence |
| 5: 3D workplace, rooms, project context and world feedback | M1 compact office, planning/meeting spaces and contextual construction site; M2 state-related cues | M3 polished geometry, animation/audio, performance and alternative interaction verification; later multiple hubs |
| 6: career, XP, competency, reputation and authority | M2 intern identity, earned feedback/evidence and separate participation reward | M4 coordinator readiness; M6–M8 repeated independent successes, ethics and promotion challenges; executive branches |
| 7: canonical scope, schedule, dependencies, cost, quality, resources and risk | M2 concrete delivery dependency, forecast, trade-offs, role limits, trust/wellbeing and discrete event | M4/M6 general calendars, resource levelling, actual/forecast budgets, quality/rework and risk realisation; M8 programme value |
| 7: uncertainty and deterministic failure/recovery | M2 independent provenance, forecast vs baseline, repeatable authored consequences and replay | M4 recovery missions; M6 more governance outcomes; later saved seeded variation |
| 8.1: task/Kanban board | M2 functional task record update with evidence and permissions | M4 expanded editable cards/activity; accessible list operations alongside future drag/drop |
| 8.2: WBS and deliverables | Existing delivery task context in M2 | M6 author work packages, estimates, ownership and acceptance; planning-review validation |
| 8.3: timeline and critical path | M2 basic finish-to-start dependency and forecast | M4/M6 multi-link critical path, baseline comparison, contingency and resource constraints |
| 8.4: RAID and change control | M2 issue log with owner, impact, confidence and next checkpoint | M4 full change request and approval; M6 risks/assumptions/dependencies, residual exposure and response |
| 8.5: meetings and communication | M2 mentor briefing, source conversations and recommendation review | M4 sponsor presentation, meeting notes, assigned actions and verified follow-up |
| 8.6: budget and procurement | M2 intern may flag options/cost; no purchase authority | M6 bid comparison, contingency, delegated spending and conflicts of interest |
| 8.7: quality and acceptance | M2 safety/quality review constraint on alternative supply | M5 QA/release decisions; M6 defects, formal criteria, sign-off and usable outcomes |
| 8.8: calendar, inbox and notes | M2 mission journal and deliberate checkpoint/time | M4 calendar, work batching/filtering, notes and realistic interdependent workload |
| 9: NPCs, branching dialogue and relationships | M2 authored mentor, foreman and supplier, sourced knowledge and trust effects | M4 persistent cast, sponsor/quality specialist, preferences and availability; optional bounded AI M9 |
| 10: learning and assessment | M2 four observable escalation criteria, evidence-based feedback | M4/M6 taxonomy across 8–10 domains, hint fading and novel transfer; M3 learning/SME review |
| 11: construction five-day campaign | M2 `CONST-I01` only | M4 five-day arc, capstone and coordinator training unlock |
| 12: sector-specific missions | Future cards label unbuilt packs | M5/M7 software defect, clinic adoption, venue delay, shutdown logistics and permit uncertainty |
| 13: HUD, tablet, onboarding and accessibility | M2 contextual controls, semantic project tools, concise journal, keyboard/alternate interactions and local resume | M3 remapping, text sizing, contrast/motion settings, camera tuning and documented assistive technology validation |
| 14: rewards, case history and retention | M2 participation/feedback and career record without promotion claim | M4/M6 achievements, portfolio case studies, optional cosmetics and practice; no missed-day penalty |
| 14: economy and monetisation | No dependency in first slice | Fictional salary/cosmetics later; business model needs separate research; no paid competence gates |
| 15: domain/data integrity, content and persistence | M1 module contracts; M2 validated commands, stable IDs, event journal, versioned local saves | M4/M8 content loading/editor, migrations, localisation and optional backend sync |
| 15/19: analytics and privacy | Local fictional state; no external telemetry requirement | M3 local research protocol; later opt-in anonymised signals, explicit retention and learning-validity limits |
| 16: authoring workflow and AI boundaries | M2 authored mission with sources, rubric, recovery and tests | PM/learning/narrative/sector review before release; M8 editor; M9 grounded AI with no state authority |
| 17: multiplayer, enterprise and creators | Deferred and unnecessary for core play | M9 responsibilities, consent, role-based reports, moderation/licensing; no unsupported psychometric claims |
| 18–20: MVP, quality, risks and open decisions | One interactive construction slice with visible future options; provisional engine ADR | M3 measure usability, accessibility, authenticity, learning and hardware performance independently; M5 two-sector MVP |

## Status discipline

The repository's checks and commit history are the evidence of delivered engineering. [testing.md](testing.md) describes checks and records any verified results. A future industry card, roadmap item, data contract, or test plan does not imply playable content. Outstanding bespoke art, animation, sound, representative-device benchmarks, learner research and sector review remain visible production work even after the initial slice passes engineering checks.
