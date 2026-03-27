export type IsoDateString = string;

export type Currency = "usd";

export type GameOverReason = "hunger" | "obesity" | "illness" | "old_age" | "other" | null;

export type CareerTrackId =
  | "qa"
  | "backend"
  | "frontend"
  | "pm"
  | "pentester"
  | "analyst"
  | "cto";

export type SkillTrackId =
  | "qa"
  | "backend"
  | "frontend"
  | "pm"
  | "pentester"
  | "analyst";

export type QualificationLevel = 1 | 2 | 3 | 4 | 5;

export type CareerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PcComponentSlot =
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "ssd"
  | "power_supply"
  | "case"
  | "cooling"
  | "monitor"
  | "keyboard"
  | "mouse";

export type TimerKind =
  | "learning"
  | "job_search"
  | "salary_cycle"
  | "order"
  | "walk"
  | "healing";
