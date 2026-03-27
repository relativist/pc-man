import type { HousingStatus } from "./player";

export type ShopSectionId = "things" | "housing" | "transport";

export type ShopLot = {
  id: string;
  section: ShopSectionId;
  title: string;
  funnyTitle: string;
  description: string;
  price: number;
  value: number;
  tier: number;
  housingStatus?: HousingStatus;
};

export type ShopSectionProgress = {
  currentLotId: string | null;
  nextLotIndex: number;
};

export type ShopState = Record<ShopSectionId, ShopSectionProgress>;
