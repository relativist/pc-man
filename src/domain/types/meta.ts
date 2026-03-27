import type { GameOverReason, IsoDateString } from "./common";

export type MetaState = {
  version: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  lastOpenedAt: IsoDateString;
  lastViewedLogAt: IsoDateString | null;
  saveSlotId: string;
  isGameOver: boolean;
  gameOverReason: GameOverReason;
};
