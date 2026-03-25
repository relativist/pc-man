import type { IsoDateString } from "./common";

export type SpouseState = {
  id: string;
  name: string;
  relationshipLevel: number;
  giftCount: number;
  canSuggestChild: boolean;
};

export type FriendState = {
  id: string;
  name: string;
  ordersGivenCount: number;
  maxOrdersGiven: 3;
  isActive: boolean;
};

export type PetState = {
  id: string;
  name: string;
  species: string;
  acquiredAt: IsoDateString;
  expectedLifeYears: number;
  isAlive: boolean;
};

export type SocialState = {
  spouse: SpouseState | null;
  childrenCount: number;
  friends: FriendState[];
  pets: PetState[];
};

