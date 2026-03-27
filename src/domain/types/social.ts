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

export type PendingFriendEncounter = {
  id: string;
  kind: "friend";
  createdAt: IsoDateString;
  title: string;
  story: string;
  friend: FriendState;
};

export type PendingSpouseEncounter = {
  id: string;
  kind: "spouse";
  createdAt: IsoDateString;
  title: string;
  story: string;
  spouse: SpouseState;
};

export type PendingPetEncounter = {
  id: string;
  kind: "pet";
  createdAt: IsoDateString;
  title: string;
  story: string;
  pet: PetState;
};

export type PendingSocialEncounter =
  | PendingFriendEncounter
  | PendingSpouseEncounter
  | PendingPetEncounter;

export type SocialState = {
  spouse: SpouseState | null;
  childrenCount: number;
  friends: FriendState[];
  pets: PetState[];
  pendingEncounters: PendingSocialEncounter[];
};
