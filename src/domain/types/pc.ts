import type { PcComponentSlot } from "./common";

export type InstalledComponent = {
  itemId: string;
  slot: PcComponentSlot;
  level: number;
  score: number;
  purchasePrice: number;
};

export type PcState = {
  isWorkingPcReady: boolean;
  level: number;
  ratingScore: number;
  components: Record<PcComponentSlot, InstalledComponent | null>;
};

export type PcComponentCatalogItem = {
  id: string;
  slot: PcComponentSlot;
  funnyTitle: string;
  level: number;
  score: number;
  price: number;
};
