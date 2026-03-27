import type {
  IsoDateString,
  QualificationLevel,
  SkillTrackId,
} from "./common";

export type OrderRequirements = {
  minQualificationLevel: QualificationLevel;
  minQualificationPoints?: number;
  minPcScore: number;
  maxPcScore?: number;
  requiresWorkingPc: boolean;
};

export type Order = {
  id: string;
  track: SkillTrackId;
  title: string;
  funnyTitle: string;
  level: QualificationLevel;
  durationDays: number;
  rewardMoney: number;
  rewardQualificationPoints: number;
  isGolden: boolean;
  failureChancePct: number;
  requirements: OrderRequirements;
};

export type OrderTemplate = Omit<Order, "id">;

export type OrderState = {
  activeOrderId: string | null;
  activeOrderSource: "friend" | "walk" | null;
  availableOrderIds: string[];
  discoveredOrderIds: string[];
  completedOrderIds: string[];
  failedOrderIds: string[];
  lastRefreshAt: IsoDateString | null;
  nextRefreshAt: IsoDateString | null;
};
