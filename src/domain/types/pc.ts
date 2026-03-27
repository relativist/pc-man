export type PcSpecs = {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  motherboard: string;
  psu: string;
  cooling: string;
  case: string;
  monitor: string;
  peripherals: string;
};

export type PcTierCatalogItem = {
  id: string;
  level: number;
  title: string;
  funnyTitle: string;
  score: number;
  price: number;
  specs: PcSpecs;
};

export type PcState = {
  isWorkingPcReady: boolean;
  level: number;
  ratingScore: number;
  currentTierId: string | null;
  currentBuild: PcTierCatalogItem | null;
};
