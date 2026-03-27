export type HousingStatus = "with_parents" | "rent" | "own_home";

export type PlayerState = {
  id: string;
  name: string;
  ageYears: number;
  money: number;
  realEstateValue: number;
  propertyValue: number;
  capital: number;
  hunger: number;
  health: number;
  weight: number;
  fitness: number;
  mood: number;
  education: string;
  housingStatus: HousingStatus;
  isAlive: boolean;
};
