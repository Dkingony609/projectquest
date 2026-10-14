PROJECTQUEST
Comprehensive Game Design Document
An immersive, educational 3D project management career simulation
Version 1.0  |  14 October 2026  |  Working product specification
Status: Concept approved for design exploration; implementation assumptions require prototyping and playtesting.
Executive summary
ProjectQuest is a single-player-first, third-person 3D career simulation in which players select an industry, start as a Junior Project Management Intern, and develop toward project, programme, portfolio and executive leadership. Players learn by completing authentic work: finding information, speaking with stakeholders, building schedules, updating artefacts, managing changes, presenting recommendations and witnessing consequences. The game combines an explorable workplace with high-fidelity 2D management tools, deterministic simulation systems, authored narrative, and optional bounded AI dialogue.
The north star: every meaningful interaction should teach, test or demonstrate the consequences of a project management skill. The commercial product vision supports multiple sectors; the first playable vertical slice proves one deeply interactive internship mission. Full career depth and all industries are long-range scope, not MVP promises.
Document control
Field
Definition
Product / working title
ProjectQuest (name subject to brand and trademark review)
Genre
Educational career simulator; management strategy; light narrative role-playing
Primary platform
Desktop web / PC, keyboard and mouse initially
Secondary platforms
Tablet / mobile adaptations post-validation; controller optional
Audience
PM learners, early-career professionals, training organisations, career changers
Business model
Undecided; product exploration, no monetisation dependency in MVP
Maturity
Pre-production GDD / product requirements baseline
Contents
1. Vision and design pillars
2. Audience and player promise
3. Core player experience
4. Industry selection and variability
5. World and 3D interaction design
6. Career and progression
7. Project simulation model
8. Hands-on work systems
9. Narrative, NPCs and dialogue
10. Curriculum and assessment
11. Missions and first-week campaign
12. Missions across industries
13. UX, HUD and accessibility
14. Economy, rewards and retention
15. Technical architecture and data
16. Content authoring and AI policy
17. Multiplayer and enterprise extensions
18. MVP and production roadmap
19. Quality, analytics and success criteria
20. Risks and open decisions
Appendices: examples, data contracts and acceptance tests

1. Vision and design pillars
1.1 Product fantasy
“On your first day, you are responsible for helping a real team deliver a real project.” The player is not cast as an all-knowing hero. They begin with limited authority and imperfect information. As their competence increases, they earn trust, expand their decision rights, and oversee larger investments. The office, project sites and consequences are tangible; the management decisions are intellectually demanding.
1.2 Pillars
Pillar
Design rule
Anti-pattern
Learn by doing
Players produce or modify a project artefact within the first five minutes.
Long compulsory lectures before gameplay
Consequences matter
Choices update simulated cost, schedule, quality, relationships and future events.
Answers that merely flash “correct”
Competence earns authority
Promotion gates require evidence across specific skills.
XP-only promotions
Industries feel distinct
Shared PM systems, sector-specific constraints, visuals and scenarios.
Reskinned identical missions
Approachable depth
Simple interactions first; complex tools unlocked through practice.
Displaying every PM tool at once
Human-centred leadership
NPCs have needs, information, limits and agency.
Treating teammates as resource points only
Recoverable failure
Setbacks open meaningful recovery paths and reflection.
Punitive unwinnable failure spirals
1.3 Out-of-scope assumptions
Not a substitute for accredited education, supervised job experience, licensure or PMP certification.
No full open-world city or fully simulated construction physics in MVP.
No claim that all careers naturally end in Chief Projects Officer; top roles vary by organisation.
No generative AI with unrestricted authority to change budgets, grades or canonical project state.
No pay-to-win competence scores or deceptive streak pressure.
2. Audience and player promise
2.1 Personas
Persona
Need
Game solution
Student / career explorer
Understand what PMs actually do
Guided internship days and career previews
Entry-level PM professional
Practise without harming live projects
Consequence-based tasks, feedback and recovery
PMP learner
Apply concepts rather than memorise definitions
Optional competency mapping and scenario practice
Experienced PM
Try unfamiliar sectors and complex trade-offs
Industry switching and leadership challenges
Learning & development buyer
Demonstrate learning gains and progress
Rubric-based reports; opt-in enterprise dashboards
2.2 Positioning
Position as a “playable career in project management,” not simply a quiz game. The short session provides a complete task-to-consequence loop; longer sessions permit deeper planning and delivery. The game must deliver both entertainment (narrative tension, autonomy, discovery) and learning (transferable reasoning, authentic artefacts, feedback).
3. Core player experience
3.1 First 15 minutes
Choose an industry, avatar and difficulty/assistance preference; enter an internship placement.
Meet a mentor in a short contextual scene; control the avatar almost immediately.
Receive a concrete work request via dialogue and task inbox.
Investigate by walking to an NPC or accessing a project console.
Update a task / issue record with facts, owner, due date and confidence.
Choose an escalation or mitigation proposal; present it to the mentor.
Watch the simulation advance, see a consequence and receive evidence-based feedback.
3.2 Macro loop
Career selection → receive assignment → gather evidence → use PM tools → decide and communicate → advance simulated time → resolve events → review outcomes → earn competency evidence → unlock responsibility → accept next assignment.
3.3 Micro loop
Notice signal → inspect source → ask question → record or compare → take authorised action → verify result. Time pressure comes from project timing, not reflex gameplay. Pausing and accessibility time extensions are supported.
3.4 Session formats
Format
Target duration
Content
Quick task
5–10 minutes
One follow-up, risk update or meeting action
Mission
15–30 minutes
One scoped problem with 2–4 viable approaches
Project day
30–50 minutes
Interdependent tasks and daily retrospective
Project milestone
45–90 minutes
Planning, negotiation, execution and review arc
4. Industry selection and variability
4.1 Selection flow
The new game flow presents industry cards, project examples, core skills, relative operational complexity and visual previews. Industry choice determines placement and first mission pack, not a permanent class. Players may hold several industry proficiencies in one profile.
4.2 Industry framework
Industry
Starter project
Distinct constraints
Signature hands-on mechanic
Construction
Two-storey community building
Permits, site safety, sequencing, subcontractors
Inspect site, coordinate delivery and dependencies
Software & technology
Appointment booking application
Backlog, QA, releases, technical debt
Triage tickets, build sprint board, manage change
Healthcare
Clinic scheduling-system rollout
Clinical safety, privacy, training, downtime
Map deployment readiness and stakeholder approvals
Events & entertainment
Regional business conference
Venue, vendors, run-of-show, weather
Rehearse event schedule and contingency plan
Manufacturing
Assembly-line installation
Production downtime, capacity, procurement
Plan shutdown window and commissioning
Energy & sustainability
Community solar installation
Grid approvals, supply lead times, environment
Sequence permits, equipment and commissioning
4.3 Transfer rules
Competency is split into transferable core skill scores and industry proficiencies. On switching industries, the player retains communication, scheduling and leadership evidence while gaining a “new sector” knowledge gap and mentor support. Industry-specific legal or safety tasks require local onboarding. No claim of professional credentials is awarded solely by play.
4.4 Industry content pack contract
Setting: environment prefab, ambient sound, props, interactable objects and site map.
Roster: mentor, sponsor, team, vendors and variable character traits.
Mission graph: objectives, events, evidence sources, choices, outcomes and recovery.
Operations: industry calendar, costs, dependencies, compliance flags and terminology.
Assessment: demonstrated behaviours, rubric, misconceptions and debrief.
Localisation: terminology and legal assumptions must be market-labelled and reviewed.
5. World and 3D interaction design
5.1 Camera and locomotion
Third-person camera in a compact explorable hub. Keyboard WASD and mouse camera; click-to-move is an optional accessibility setting. Interact with E/click when within proximity. Sprinting is cosmetic only; there is no reaction-time gate for learning objectives. Mission markers are helpful but never obscure the world.
5.2 Space types
Space
Gameplay role
MVP
Main office
Walk, NPC interactions, workstation, inbox
Yes
War room
Project board, timeline and planning activities
Yes (compact)
Meeting room
Structured dialogues, presentations and action items
Yes
Break area
Optional relationship conversations and contextual clues
Later
Construction site / facility
Inspection, visual progress, safety and logistics
Vertical slice variant
Executive suite
Portfolio and strategy decisions
Later
5.3 Contextual interaction grammar
Interactable objects advertise three layers: glance (status/affordance), inspect (reliable detail/source), act (task-specific interface). Physical proximity drives discovery; detailed data entry uses legible 2D panels. A 3D sticky-note wall may launch a full accessible Kanban view rather than forcing tiny text in-world.
5.4 Environmental storytelling
Visible changes represent state: unfinished construction stages, blocked QA screens, stressed but non-stereotyped team behaviour, meeting attendance, deliveries and ambient activity. These changes must be driven by canonical simulation data. Never imply that visual mood alone is objective performance truth.
5.5 Art direction and performance
Polished stylised semi-realistic 3D, modular geometry, strong silhouettes and professional colour language. Target readable laptop performance before photorealism. Aim for 30–60 FPS on documented minimum devices after representative benchmarking; this is a performance goal, not a validated hardware specification. Use baked lighting, LODs and instancing where practical.
6. Career and progression
6.1 Career tiers
Tier
Role
Typical authority
Promotion evidence
1
Junior PM Intern
Collect, report, escalate under supervision
Accurate records, timely follow-up
2
Project Coordinator
Maintain workstreams, facilitate reporting
Dependency visibility and reliable communication
3
Junior Project Manager
Own small scoped deliveries
Plan, deliver and recover a small project
4
Project Manager
Accountable for a complete project
Integrated scope/cost/schedule/quality control
5
Senior Project Manager
Complex cross-functional delivery
Leadership, negotiation, mentoring
6
Programme Manager / Senior PM track
Coordinate benefits and dependencies
Multi-project trade-off competence
7
Programme / Project Director
Govern major investments
Governance, escalations, strategic alignment
8
Portfolio Director
Select and balance initiatives
Value prioritisation and portfolio risk
9
Head of Delivery / VP Projects
Shape organisation-wide capability
Capacity and delivery operating model
10
Chief Projects Officer / executive route
Enterprise strategy and capital allocation
Board-level reasoning and long-horizon outcomes
6.2 Progression formula
Eligibility = minimum competency evidence in required domains + completion of mission milestones + acceptable ethical/professional conduct + role-specific promotion challenge. XP determines pace and unlocks cosmetics / practice opportunities; it cannot override competency requirements. Allow mentor-supported remediation and repeated assessments with changed scenarios.
6.3 Ratings
Separate Career XP, Domain Competency (0–5 rubric), Industry Familiarity, Trust/Reputation (contextual, reversible), and Portfolio Outcomes. Never compress these into one opaque “best PM” score. A profile can show strengths in communication and gaps in forecasting without labelling the player a failure.
6.4 Branches and employment
From senior levels, allow optional tracks: delivery executive, PMO/portfolio leadership, independent consulting, sector specialist, and operations leadership. Job offers reference demonstrated competencies, work preferences and narrative relationships. Employment/salary economy is fictional and clearly marked as such.
7. Project simulation model
7.1 Canonical project state
The simulation stores scope baseline, work packages, dependencies, progress, resources, budget baseline and actuals, quality criteria, risk/issue registers, stakeholders, approvals, and scheduled events. NPC claims can be incomplete or incorrect; authoritative documents and signed decisions have source provenance.
7.2 Time and event engine
Use discrete in-game time with deliberate advance at mission checkpoints and optional pause. Events have trigger predicates, priorities and cooldowns. For the MVP, avoid irreversible real-time penalties when reading interfaces. A dependency-based schedule recalculates after authorised edits; deterministic seeded randomness governs event variation.
7.3 Constraints and consequences
Metric
Inputs
Outputs
Schedule
Task duration, dependencies, capacity, blockers
Forecast finish, milestone slippage, critical path
Cost
Labour, materials, procurement, contingency
Actual cost, forecast at completion, variance
Quality
Acceptance criteria, testing, rushed work
Defects, rework, customer acceptance
Team wellbeing
Workload, conflict, communication, autonomy
Availability, retention risk, productivity modifiers
Stakeholder trust
Accuracy, timeliness, honesty, surprises
Support, escalation effort, approval likelihood
Risk exposure
Probability, impact, response effectiveness
Expected exposure, realised issues, residual risk
Business value
Benefits, scope choices, adoption
Outcome metrics after delivery
7.4 Decision integrity
Consequences must arise from understandable causal rules, not hidden moral judgements. Decisions can be simultaneously helpful and costly. A proposal is not equivalent to an approved change. Junior players cannot silently alter baselines or commit expenditure beyond delegated authority; they must recommend and seek approval.
7.5 Example schedule rule
For each task, earliest start = maximum predecessor finish subject to constraints; earliest finish = start + effective duration. Effective duration responds to availability and rework. For educational simplicity, early missions use finish-to-start links and basic business-day calendars; more dependency types and earned value concepts are unlocked later.
7.6 Failure and recovery
Project outcomes include successful, compromised, partially recovered, cancelled by governance, and ethically rejected. Every outcome offers a debrief and replay or recovery assignment. Unethical actions such as falsifying status may produce short-term apparent benefits but cause credibility loss when audited. Ethical conduct is a hard promotion gate.
8. Hands-on work systems
8.1 Task and Kanban board
Players edit owner, status, deadline, blocker, acceptance condition and activity log. Cards include evidence provenance and permissions. Drag-drop convenience is paired with accessible list actions. The board changes simulated task progress only when the action represents a valid update, not merely a visual move.
8.2 Planning and WBS
Break a project objective into deliverables and work packages. Distinguish outputs from activities. Add dependencies, estimates, acceptance criteria and ownership. Mentor hints explain why excessively large or unowned tasks fail planning review.
8.3 Timeline and critical path
A simple interactive schedule introduces sequencing and milestone constraints. Later missions permit resource levelling, baseline comparison, contingency analysis, and multiple dependency types. The system communicates uncertainty rather than presenting a precise deterministic real-world forecast.
8.4 RAID and change control
Risk, Assumption, Issue and Dependency records have owner, severity, evidence, response and next check. A change request captures proposed change, rationale, impacts, options, decision authority and approval state. Players practise the difference between identifying an issue and resolving it.
8.5 Meetings and communication
Meetings require agenda, relevant evidence, response selection or composition, decisions and follow-ups. Notes convert into assignable actions with owners and due dates. NPCs react to interruptions, unsupported claims and failure to follow up; assessments evaluate clarity and completeness, not conformity to one writing style.
8.6 Budget and procurement
Inspect purchase requests, compare bids, estimate trade-offs, track contingency and verify authorisation. Early internships collect and flag cost information; management roles decide within delegated limits. Procurement conflicts of interest are explicit ethics scenarios.
8.7 Quality and delivery acceptance
Identify criteria, request reviews, triage defects and present evidence for sign-off. Delivery is not automatically successful when tasks reach 100%; the sponsor must accept agreed outcomes and the business must be able to use them.
8.8 Personal productivity
Calendar, inbox, notes and mission tracker create realistic workload without email busywork. Choices about prioritisation affect deadlines and responsiveness. Provide batching, quick filters and search so mechanical clicking does not dominate the experience.
9. Narrative, NPCs and dialogue
9.1 Cast model
Each recurring NPC has role, goals, expertise, communication preference, reliability, trust relationship, current availability, and knowledge scope. Personalities are grounded and avoid simplistic demographic stereotypes. NPCs may be mistaken or deliberately withholding but reveal consistent clues.
9.2 Core cast for first project
Character
Role
Narrative function
Alex / mentor
Senior PM
Coaches, delegates tasks and judges readiness
Sam / delivery lead
Operational lead
Knows practical constraints and dependencies
Riley / sponsor
Project sponsor
Cares about outcomes, scope and budget
Morgan / supplier
External vendor
Controls delivery evidence and commitments
Taylor / QA or safety
Quality specialist
Challenges unsafe or untested shortcuts
9.3 Dialogue design
Conversations use authored objectives and branching responses. Choices affect information gathered, relationship context, evidence quality and future missions. A free-text mode can be added with bounded AI; baseline outcomes must remain achievable without typing or AI services.
9.4 Ethical tension
Use professional dilemmas such as pressure to hide delays, skip checks or blame colleagues. Avoid simplistic “be nice” scoring. Reward truthful, tactful escalation, evidence gathering, fairness and adherence to safety. Different communication styles may succeed if evidence and intent are sound.
10. Curriculum and assessment
10.1 Learning taxonomy
Use a competency taxonomy inspired by established PM areas: Ways of Working, Power Skills and Business Acumen, supplemented by industry knowledge and ethics. Mapping is a design guide, not an accreditation claim or reproduced proprietary curriculum. Where exam alignment is marketed, review current source specifications and licensing requirements before release.
10.2 Assessment pipeline
For each objective, define observed actions → evidence capture → rubric scoring → explanatory feedback → spaced reapplication in another scenario. Separate factual recall from performance. A learner may know the word “critical path” but fail to investigate a dependency; the game should show that distinction.
10.3 Competency matrix
Domain
Intern observable evidence
Advanced observable evidence
Initiation and scope
Identifies deliverables and ambiguity
Builds justification and controls change
Planning/schedule
Updates dependency and dates accurately
Optimises multi-team critical paths
Cost
Flags variance using source numbers
Forecasts and balances budgets
Risk
Records risk vs issue appropriately
Prioritises portfolio-level risk responses
Communication
Captures decisions and next actions
Negotiates difficult stakeholder trade-offs
Leadership
Listens and escalates respectfully
Develops teams and resolves conflict
Quality
Checks acceptance conditions
Designs quality governance
Business acumen
Explains project purpose
Prioritises benefits and investment value
Ethics
Reports truthfully and follows limits
Defends transparent governance under pressure
10.4 Feedback and mastery
Immediate feedback explains operational effects; reflective feedback asks why and compares options. Provide optional mentor scaffolding: guided, standard and expert. Hidden rubrics are explained after action to avoid rote gaming. Mastery requires multiple independent scenario successes with diminishing hint use, not one flawless run.
10.5 Example analytic rubric: escalation
Criterion
0 – Missing
1 – Developing
2 – Competent
3 – Strong
Accuracy
Misstates facts
Incomplete or weak source
Accurate status with source
Clearly separates fact/assumption
Impact
No impact stated
Vague concern
Links to schedule/scope/cost
Compares quantified alternatives
Authority
Acts beyond role
Unclear decision owner
Escalates to right authority
Proposes approvable recommendation
Follow-up
No action
Unowned action
Owner and due date
Verification and contingency
11. Missions and first-week campaign
11.1 Campaign setup
Five simulated days form the internship onboarding arc. The player receives a manageable shared project and increases responsibility as they demonstrate reliability. The week teaches discovery, record-keeping, dependencies, communication, change and recovery. It includes three decision styles: investigation, hands-on tooling and stakeholder interaction.
Day
Mission
Core verbs
Learning evidence
Key twist
1
Welcome / Missing Delivery
Inspect, ask, record, report
Source-backed issue update
Conflicting supplier and foreman information
2
The Slipping Milestone
Trace, replan, escalate
Dependency and forecast reasoning
An apparently minor task blocks two others
3
The Stakeholder Check-in
Prepare, present, summarise
Accurate status and action ownership
Sponsor asks for unwarranted assurance
4
The Scope Surprise
Compare, assess, propose
Change request and authority limits
Client calls addition “tiny”
5
Recover and Review
Prioritise, negotiate, verify
Integrated recovery and retrospective
Budget/time/quality trade-off
11.2 Day 1 detailed mission specification
MISSION ID: CONST-I01 / “The Missing Materials.” Context: a contractor has not confirmed concrete delivery for foundation work. Objective: provide a grounded status and next-step recommendation before coordination meeting. Starting authority: intern may gather data and recommend; cannot authorise alternate supplier or change baseline.
Spawn at site office; meet mentor for a short task briefing, learn E/click interaction and mission journal.
Inspect schedule on tablet; find foundation task and its finish-to-start successors.
Speak to foreman; obtain affected crews and timing assumptions.
Contact supplier; learn truck issue and probabilistic replacement timing.
Enter issue log: evidence, affected milestone, owner, next checkpoint; choose uncertainty wording.
Prepare two options: wait with contingency or propose alternate supplier subject to cost/safety review.
Report to mentor; respond to one probing question about confidence and impacts.
Advance time; receive delivery update, project health change and competency feedback.
11.3 Day 1 branching outcomes
Player behaviour
Simulation result
Learning feedback
Checks independent sources, records uncertainty, escalates
Reliable decision support; mentor explores options
Strong issue identification and communication
Promises delivery without evidence
Sponsor confidence appears high briefly, then falls
Never present supplier estimate as guaranteed
Orders alternative without approval
Potential schedule recovery but governance breach
Authority and procurement controls matter
Does not investigate dependency
Issue documented but understated impact
Trace successor tasks before recommending action
Raises clear risk early and prepares contingency
Some recovery flexibility even if delay occurs
Proactive response reduces exposure
11.4 Day 5 capstone
The intern builds a weekly status update, identifies the highest-priority blocker, proposes a modest recovery path and conducts a mentor review. The capstone grades evidence, reasoning, communication, ethics and verified follow-through. Successful completion unlocks the coordinator training arc, not an implausible instant promotion from a single week.
12. Missions across industries
Industry
Intern mission
Interactive task
Escalating complication
Software
Bug discovered before release
Triage impact, edit ticket, coordinate QA
Sponsor asks to launch with known defect
Healthcare
Training adoption is low
Inspect attendance and workflow, plan support
Clinic cannot tolerate service interruption
Events
Venue vendor misses deadline
Call vendor, update run-of-show, contingency
Weather threatens access and guest arrivals
Manufacturing
Installation shipment delayed
Cross-check inventory and shutdown plan
Extended shutdown affects production
Energy
Permit approval uncertain
Review approval dependency and dates
Contractor crew availability expires
Each industry must have at least one story arc that cannot be resolved by the same generic option ordering. Sector SMEs should review terminology and consequence credibility, especially for regulated contexts. Safety-critical areas may be simulated educationally without teaching unqualified players to make actual clinical or engineering decisions.
13. UX, HUD and accessibility
13.1 UX layout
Default 3D HUD: top left current mission and next action; top right simulated clock and project-health summary; bottom centre contextual interaction prompt; optional compact mini-map; tab opens project tablet with inbox, board, schedule, RAID, stakeholders, reports and career. Avoid permanent dense spreadsheet overlays on the 3D view.
13.2 Project dashboard
Display baseline vs forecast and confidence, not only arbitrary red/green meters. Schedule variance, budget, quality, team wellbeing, sponsor confidence and risk exposure are surfaced with tooltips stating the underlying causes. Explain that game metrics are simplified proxies for learning.
13.3 Interaction accessibility
Full keyboard navigation through 2D management panels; remappable 3D controls.
Subtitles, adjustable text size, high-contrast modes and non-colour status indicators.
No mission requires sound cues alone; captions describe relevant audio alerts.
Pause/slow simulation and remove countdown urgency in accessibility settings.
Reduced-motion and camera sensitivity settings; optional click-to-move.
Screen-reader-friendly semantic UI where platform permits; text alternative for key 3D investigations.
Save and resume within a mission; autosave after reversible milestones.
13.4 Onboarding
Introduce controls contextually, one new interaction per task. Let experienced PMs skip explanatory narration, but not required simulation affordances. Provide a “why does this matter?” drawer instead of a compulsory lesson screen.
14. Economy, rewards and retention
14.1 Non-monetary reward systems
Award XP for participation, competency mastery for demonstrated judgement, role credentials for promotion gates, fictional salary for career fantasy, optional cosmetics for expression, and portfolio case studies for meaningful history. Achievements reward constructive behaviours: “Source Checker,” “Early Escalator,” “Recovery Planner.”
14.2 Retention loops
Weekly mission series, branching project arcs, career milestones, optional daily practice tasks, new industry transfers and peer comparison. Do not punish missed days by reducing hard-earned mastery. Leaderboards, if introduced, should compare appropriate skill bands, avoid prestige-only ranking and remain opt-in.
14.3 Monetisation principles
Do not place essential competence feedback behind microtransactions. Viable post-validation options include premium industry packs, institutional licences or a complete-game purchase. Price and business model require user research and are not prerequisites for the vertical slice.
15. Technical architecture and data
15.1 Reference architecture
Client: 3D engine runtime plus integrated accessible 2D UI. Domain layer: project simulator, time/event scheduler, mission state machine, NPC dialogue, competency engine and persistence. Content layer: versioned industry packs and localisation. Optional backend: account sync, analytics, content updates, organisational cohorts and AI proxy. Authoritative simulation state remains controlled by deterministic game code.
15.2 Stack options and trade-offs
Option
Advantages
Trade-offs
Recommendation
Godot 4 desktop/web export
Integrated 3D, open source, scripted systems
Web compatibility/performance must be tested for target devices
Strong candidate for focused game-first prototype
Three.js / React Three Fiber
Web-native, strong UI integration, modern web deployment
More bespoke simulation, animation and authoring tooling
Strong candidate for browser-first product
Unity
Established authoring workflows and ecosystem
Runtime footprint, licensing review, web tuning
Evaluate if team expertise favours it
Technical selection gate: create the same ten-minute mission in top two candidate stacks and measure load time, frame rate, UI accessibility, build complexity and maintainability on representative machines. No final engine commitment is assumed by this document.
15.3 Component model
Service/module
Responsibility
Inputs / outputs
World interaction
Movement, targets, 3D cues
Interact command -> action event
Mission manager
Objective graph and states
Events -> objective completion / unlock
Project simulator
Schedule/cost/quality/risk rules
Approved action -> canonical state delta
Dialogue manager
NPC knowledge and branches
Player response -> info / social delta
Learning assessor
Capture evidence and score rubrics
Telemetry -> competencies and feedback
Save system
Persist reproducible state
Profile + seed + versioned snapshot
Content loader
Validate sector packs
Data schema -> missions, locations, roles
Analytics
Consent-aware product signals
Event log -> aggregate insights
15.4 Data integrity
All state-mutating commands pass role permissions, preconditions and validators. UI may request a change but cannot independently change canonical project state. Store event journal and seeded randomness so outcomes can be replayed for debugging. Content references stable IDs; migrations protect saved games when scenarios change.
15.5 Security and privacy
Collect minimal personal data. No real workplace documents are required to play. AI conversations, if enabled, must clearly disclose storage and retention, allow opt-out, and avoid submitting sensitive information to third parties without consent. Enterprise reports show learner progress only with transparent institutional permissions.
16. Content authoring and AI policy
16.1 Mission schema
Every mission is authored with IDs, prerequisites, setting, briefing, player authority, start state, sources, objectives, event triggers, allowed actions, outcomes, recovery routes, rubric, reflections and tests. Missions should support multiple valid approaches. Editors preview causality and balance before publishing.
16.2 AI assistance boundaries
Optional AI can paraphrase mentor hints, roleplay bounded NPC conversations and provide personalised debriefs from verified events. It cannot invent authoritative facts, approve budget changes, override rubrics, create unsafe compliance instructions or silently advance project state. Output is grounded in scenario documents and vetted templates; grading uses logged actions plus reviewed rubric logic.
16.3 Content quality workflow
Learning designer defines measurable competency and evidence.
PM subject-matter expert writes scenario constraints and credible trade-offs.
Narrative designer creates character motivation and branching scenes.
Systems designer encodes mechanics and expected state transitions.
QA validates solvability, branch fairness and recovery paths.
Learners playtest; team tests learning gains and fun separately.
Industry reviewer signs off regulated or domain-specific assumptions.
17. Multiplayer and enterprise extensions
17.1 Cooperative gameplay (post-MVP)
Two to five players form a delivery team with distributed responsibilities. Success requires coordination, evidence sharing, role clarity and negotiation; the design guards against one player doing all work. Asynchronous team play is preferable to forced real-time scheduling for professional learners.
17.2 Enterprise mode (post-MVP)
Organisations assign learning tracks, view mastery evidence, run team simulations and export completion reports. Provide explicit consent, role-based access and no invasive surveillance. Avoid asserting psychometric validity or job-selection suitability without robust validation.
17.3 Community and creator content
A curated scenario editor may let educators build missions from safe templates. User-created scenarios require moderation, licensing and validation; rankings should distinguish official from community content.
18. MVP and production roadmap
18.1 Full product vs MVP
Capability
Vertical slice
MVP
Long-term
Industry selection
2 visible, 1 fully playable
Construction + software intern arcs
6+ industries
3D environments
One compact hub + contextual site
Two sector variants
Multiple hubs/sites
Missions
One 15–25-minute scenario
5-day campaigns per sector
Career-spanning campaigns
Career
Intern only
Intern + coordinator readiness
Intern through executive branches
PM tools
Task board + issue log + basic schedule
Add changes, meeting notes and reporting
Budgets, procurement, portfolio governance
NPCs
3–5 authored characters
Core casts per sector
Persistent relationships and bounded AI
Assessment
3–4 scored competencies
8–10 competency domains
Longitudinal validated learning analytics
Save
Local checkpoint
Profiles and resumable campaigns
Cloud, organisation sync
18.2 Phased milestones
Phase
Exit artefacts
Gate
Discovery
Learner interviews, competency map, platform proof of concept
Evidence of audience demand and manageable tech
Pre-production
Playable paper prototype, scenario schema, 3D greybox, UI kit
Clear fun/learning loop in moderated tests
Vertical slice
One complete, polished first-day mission
Playable without facilitation; decisions matter
MVP
Two industry paths and five-day arcs
Retention, clarity, learning and stability thresholds
Expansion
More career tiers, industries, content pipeline
Unit economics and content throughput sustainable
18.3 Workstreams
Game design: core economy, rules, progression, balancing and mission systems.
Learning design: taxonomy, rubrics, feedback and transfer testing.
Engineering: 3D, UI, simulator, content loader, saves, telemetry and tools.
Art/audio: modular environments, characters, animation, VFX and sound.
Narrative/content: sector arcs, NPCs, branching dialogue and localisation.
QA/research: usability, performance, accessibility, scenario consistency and educational outcomes.
18.4 Prototype acceptance gate
A new player must be able to move, inspect three sources, update one project artefact, submit a recommendation, see a meaningful consequence and understand the debrief in a complete end-to-end loop. The prototype can use placeholder assets; interaction quality and learning evidence take priority.
19. Quality, analytics and success criteria
19.1 Quality dimensions
Evaluate engagement, usability, learning, authenticity, fairness, accessibility and technical stability as independent dimensions. A fun game that teaches little fails. A rigorous lesson that is tedious also fails.
19.2 Candidate measures (hypotheses, not commitments)
Dimension
Proposed measure
Initial test question
Activation
Complete first action within 5 min
Can players become productive quickly?
Engagement
First mission completion; voluntary next mission
Do players want to continue?
Learning
Pre/post scenario transfer task
Do decisions improve beyond repetition?
Authenticity
SME rubric on scenario credibility
Would a PM recognise the trade-offs?
Comprehension
Can player explain decision consequence?
Are causal relationships understandable?
Accessibility
Task completion using alternative controls
Can diverse users finish core missions?
Stability
Crash-free runs, save/reload correctness
Is the experience dependable?
19.3 Instrumentation examples
Record mission_started, evidence_inspected, question_asked, artefact_updated, proposal_submitted, approval_requested, event_resolved, feedback_viewed, mission_completed. Attach scenario version and anonymised event context. Never treat click counts as proof of learning.
19.4 Test plan
Conduct task walkthroughs with novice and experienced PM players.
A/B test hint styles for understanding, not simply completion speed.
Compare pre/post transfer tasks with novel contexts rather than repeated questions.
Assess whether learners can explain differences between risks, issues and assumptions.
Run deterministic state/replay tests for all authored branches.
Perform performance and accessibility passes on documented minimum hardware.
20. Risks and open decisions
20.1 Risk register
Risk
Severity
Mitigation
Industry breadth dilutes first release
High
Shared core, deep one-mission vertical slice, phased packs
3D feels ornamental / slow
High
3D as contextual interaction; efficient 2D tools
Educational content becomes preachy
High
Action-first design; short optional explanations
Simulations become opaque or unfair
High
Causal logs, visible inputs, robust debrief
AI gives inconsistent or risky advice
High
Bounded use, grounded retrieval, deterministic grade
Too much authoring per mission
High
Reusable templates, data-driven content, editor
Learners misread game as credential
Medium
Explicit limits and accurate marketing
Hardware limits accessibility
Medium
Performance budget, fallback low-spec settings
Sector safety inaccuracies
High
SME and jurisdiction review
Scope exceeds solo/team capacity
High
Strict release gates and no premature live-service features
20.2 Decisions to validate
Name, brand, visual identity and target age rating.
Primary launch geography and default currency; currencies are fictional unless configured.
First playable industry: construction is visually rewarding; software may be quicker to build.
Game engine and deployment strategy after benchmark.
Dialogue mix: authored branches only for MVP vs bounded AI later.
Depth of avatar customisation and accessibility fallback.
Exact senior-career hierarchy and industry-specific nomenclature.
Business model, institutional reporting, multiplayer and mobile timing.

Appendix A — Design vocabulary
Term
Meaning
Competency evidence
Logged player behaviour linked to a defined rubric
Canonical state
The authoritative simulated project data, not NPC speculation
Industry pack
Content bundle adding sector, visuals, rules, missions and rubrics
Vertical slice
One complete high-quality end-to-end experience
Mission graph
Prerequisites, objectives, choices, triggers and outcomes
Recovery path
Gameplay enabling analysis and correction after a setback
Decision authority
Actions a player role may legitimately approve
Transfer task
New scenario testing an acquired skill in another context
Appendix B — Example mission data contract
Illustrative JSON-like schema for engineering alignment:
mission_id: "CONST-I01"version: 1industry: "construction"role_required: "intern"scene_id: "site_office_01"start_state: "briefed"authority: ["inspect", "log_issue", "recommend"]objectives:  - inspect_schedule  - speak_to_foreman  - confirm_supplier_status  - log_issue_with_owner  - submit_mentor_recommendationstate_triggers:  - when: recommendation_submitted    validate: evidence_complete    then: advance_to_reviewcompetency_tags:  - issue_management  - dependency_awareness  - communication  - governancefailure_policy: "recoverable"
Appendix C — Worked project state example
Variable
Start
After credible early escalation
After unsupported promise
Foundation milestone forecast
Day 12
Day 13, alternatives reviewed
Day 12 shown, later corrected to Day 14
Stakeholder trust
60
65
44
Issue severity
Unknown
High, owner assigned
Unrecorded until impact
Governance compliance
Pass
Pass
Fail if false claim is knowingly entered
All example numbers above are fictional balancing placeholders. They are not genuine project estimates or empirically validated scoring values.
Appendix D — Definition of done for Day 1
A new save starts with industry selection, avatar and intern role.
Player can navigate to office, mentor, board and one industry context without breaking the camera.
At least three independent sources provide distinct and causally relevant information.
Issue log validates required fields and provides readable errors.
Player can propose at least two legitimate response paths and one governance-violating path.
Simulation applies distinct, repeatable outcomes and can be reset/replayed.
Feedback cites actions actually performed and maps to four defined rubric criteria.
Project state survives save/reload and does not duplicate events.
Core objective can be completed using accessible interaction alternatives.
First-time users understand the relationship between choice and consequence in playtest.
Appendix E — Sample backlog (priority ordered)
Priority
Feature
Acceptance summary
P0
Third-person office controller
Movement, collision, camera and interaction focus
P0
Mission state machine
Objective transitions, checkpoints, validation
P0
Canonical project state
Schedule, issue, stakeholder and event data
P0
Project tablet UI
Readable board, issue register and status
P0
Branching dialogue
Role-based questions, evidence and outcomes
P0
Competency evidence / feedback
Captures actions and explains consequences
P0
Save/replay
Reproducible mission state and recovery
P1
Character animation / audio
Responsive feedback and captions
P1
Industry selection UI
Selection persists and loads sector pack
P1
Simple schedule visualisation
Dependency and forecast effects visible
P2
Cosmetics and achievements
Non-essential rewards
P2
AI dialogue
Guarded optional experiment after core loop
Appendix F — Sample sprint sequence
Illustrative order, not a calendar estimate: (1) interaction sandbox; (2) task/issue tablet; (3) mission event and save; (4) dialogue and evidence; (5) simulation outcomes; (6) competency feedback; (7) art polish and accessibility; (8) moderated vertical-slice playtest. Each milestone should produce a runnable build and a concrete acceptance demonstration.
Appendix G — Guiding principles for subject-matter review
No mission teaches that a PM can independently waive legally required safety or clinical processes.
Authority, uncertainty, dependencies, approvals and change control are explicitly represented.
There may be several defensible decisions depending on evidence and constraints.
Consequence framing distinguishes a decision that is ethically sound from one that is merely profitable or fast.
The game teaches general skills; rules, standards and laws vary by jurisdiction and must be reviewed for the chosen setting.
Rubric review includes experienced practising PMs and representative novice learners.
End of document — this GDD should be managed as a version-controlled living specification. Next companion artefacts: Product Requirements Document, technical architecture decision record, content schema, 3D interaction prototype, and Day 1 mission implementation brief.