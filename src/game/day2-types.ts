import type { OptionComparison, Scores, SourceId } from "./types";
import type { ScheduleInput } from "./schedule";
import type { ScheduleOption } from "./day2-content";
export interface MissionRecord {
  missionId: "CONST-I01" | "CONST-I02";
  title: string;
  day: number;
  xpEarned: number;
  scores: Scores;
  outcome: string;
  forecastFinishDay: number;
  actualCost: number;
  trust: number;
}
export interface SchedulePlan {
  tasks: ScheduleInput[];
  owner: "Sam";
  checkpoint: "11:00";
  evidence: SourceId[];
  chainDays: number;
  forecastFinishDay: number;
}
export interface ScheduleProposal {
  option: ScheduleOption;
  confidence: "estimate" | "guaranteed";
  nextCheck: "11:00";
  comparison: OptionComparison;
  approval: "pending" | "conditional" | "approved" | "rejected";
}
export interface ScheduleMissionState {
  carriedForecastDay: number;
  plan: SchedulePlan | null;
  choice: ScheduleOption | null;
  proposal: ScheduleProposal | null;
}
export type CampaignCommand =
  | { type: "startNextMission" }
  | {
      type: "saveSchedulePlan";
      tasks: ScheduleInput[];
      owner: "Sam" | "Morgan" | "Alex";
      checkpoint: string;
      evidence: SourceId[];
    }
  | { type: "chooseScheduleRecommendation"; option: ScheduleOption }
  | {
      type: "submitScheduleRecommendation";
      option: ScheduleOption;
      confidence: "estimate" | "guaranteed";
      nextCheck: string;
      comparison: OptionComparison;
    };
