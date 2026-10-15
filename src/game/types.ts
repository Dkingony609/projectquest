export type SourceId = "schedule" | "lead" | "supplier" | "safety";
export type NpcId = "lead" | "supplier" | "safety";
export type ProposalOption = "wait" | "alternate" | "promise" | "unauthorised";
export type Confidence = "estimate" | "guaranteed";
export type Impact = "foundation" | "delivery";
export type ReviewAnswer = "conditional" | "guarantee" | "defer";
export type OwnerId = "Sam" | "Morgan" | "Alex";
export interface Appearance {
  skin: string;
  shirt: string;
  hair: string;
}
export interface Profile {
  name: string;
  industry: "construction";
  appearance: Appearance;
  assistance: "guided" | "standard";
}
export interface Position {
  x: number;
  z: number;
  yaw: number;
}
export interface Issue {
  title: string;
  owner: OwnerId;
  severity: "low" | "medium" | "high";
  dueDay: number;
  evidence: SourceId[];
  impact: Impact;
  uncertainty: Confidence;
  nextCheck: string;
}
export interface Task {
  id: string;
  title: string;
  owner: OwnerId;
  status: "not_started" | "in_progress" | "blocked" | "done";
  dueDay: number;
  blocker: string;
  evidence: SourceId[];
  dependencies: string[];
  acceptance: string;
}
export interface OptionComparison {
  waitFinishDay: number;
  waitCost: number;
  alternateFinishDay: number;
  alternateCost: number;
}
export interface Proposal {
  comparison?: OptionComparison;
  option: ProposalOption;
  confidence: Confidence;
  impact: Impact;
  nextCheck: string;
  approval: "pending" | "conditional" | "rejected" | "approved";
}
export interface Project {
  name: string;
  baselineFinishDay: number;
  forecastFinishDay: number;
  budgetBaseline: number;
  forecastCost: number;
  actualCost: number;
  quality: number;
  wellbeing: number;
  stakeholderTrust: number;
  riskExposure: number;
  governance: "compliant" | "breach";
  delivery: "unconfirmed" | "confirmed" | "late";
  explanation: string;
}
export interface Scores {
  accuracy: number;
  impact: number;
  authority: number;
  followUp: number;
}
export interface Career {
  role: "Junior PM Intern";
  xp: number;
  reputation: number;
  competencies: Scores;
  achievements: string[];
  completedMissionIds: string[];
  nextAssignment: string | null;
}
export interface GameEvent {
  seq: number;
  type: string;
  summary: string;
  day: number;
  minutes: number;
}
export type Command =
  | { type: "brief" }
  | { type: "inspect"; source: SourceId }
  | { type: "ask"; npc: NpcId; choice: "facts" | "pressure" }
  | { type: "followUp"; npc: NpcId }
  | { type: "chooseRecommendation"; option: ProposalOption }
  | {
      type: "updateTask";
      taskId: string;
      status: "blocked" | "in_progress" | "done";
      owner: OwnerId;
      dueDay: number;
      blocker: string;
      evidence: SourceId[];
    }
  | { type: "logIssue"; issue: Issue }
  | {
      type: "submitRecommendation";
      comparison?: OptionComparison;
      option: ProposalOption;
      confidence: Confidence;
      impact: Impact;
      nextCheck: string;
    }
  | { type: "answerReview"; answer: ReviewAnswer }
  | { type: "advanceTime" };
export interface GameState {
  version: 1;
  profile: Profile;
  position: Position;
  missionId: "CONST-I01";
  seed: number;
  phase: "arrival" | "investigating" | "review" | "debrief";
  day: number;
  minutes: number;
  evidence: SourceId[];
  tasks: Task[];
  issue: Issue | null;
  proposal: Proposal | null;
  reviewAnswer: ReviewAnswer | null;
  project: Project;
  career: Career;
  relationships: Record<"Alex" | "Sam" | "Morgan" | "Taylor", number>;
  events: GameEvent[];
  journal: Command[];
}
export interface CommandResult {
  state: GameState;
  error?: string;
  notice?: string;
}
export interface Objective {
  id: string;
  label: string;
  complete: boolean;
}
export interface RubricFeedback {
  id: keyof Scores;
  label: string;
  score: number;
  detail: string;
  citations: GameEvent[];
}
export interface Feedback {
  title: string;
  summary: string;
  criteria: RubricFeedback[];
  xpEarned: number;
  reflection: string;
  next: string;
  governancePassed: boolean;
}
export interface Source {
  id: SourceId;
  title: string;
  detail: string[];
  provenance: string;
}
export interface Npc {
  id: NpcId;
  name: string;
  role: string;
  greeting: string;
  facts: string;
  pressure: string;
}
export interface IndustryCard {
  id: string;
  name: string;
  description: string;
  example: string;
  available: boolean;
  skills: string[];
}
export interface IndustryPack {
  id: "construction";
  title: string;
  mission: {
    id: "CONST-I01";
    version: 1;
    title: string;
    briefing: string;
    authority: string[];
    rubric: string[];
    recovery: string;
    setting: string;
    roleRequired: "intern";
    prerequisites: string[];
    startState: "arrival";
    objectiveIds: string[];
    events: {
      id: string;
      trigger: string;
      minutes: number;
      priority: number;
      once: boolean;
    }[];
    allowedActions: string[];
    outcomes: string[];
    recoveryRoutes: string[];
    reflections: string[];
    acceptanceTests: string[];
  };
  sources: Record<SourceId, Source>;
  npcs: Record<NpcId, Npc>;
  options: Record<
    ProposalOption,
    { label: string; description: string; forecastDay: number; cost: number }
  >;
}
