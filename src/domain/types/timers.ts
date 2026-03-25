import type { IsoDateString, TimerKind } from "./common";

export type ActivityTimer = {
  id: string;
  kind: TimerKind;
  startedAt: IsoDateString;
  endsAt: IsoDateString;
  referenceId: string | null;
};

export type TimerState = {
  learning: ActivityTimer | null;
  jobSearch: ActivityTimer | null;
  salaryCycle: ActivityTimer | null;
  activeOrder: ActivityTimer | null;
  walk: ActivityTimer | null;
  healing: ActivityTimer | null;
};

