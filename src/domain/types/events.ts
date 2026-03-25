import type { IsoDateString } from "./common";

export type EventLogKind =
  | "salary_paid"
  | "promotion_available"
  | "promotion_accepted"
  | "promotion_rejected"
  | "job_offer_received"
  | "job_changed"
  | "book_completed"
  | "order_completed"
  | "order_failed"
  | "friend_found"
  | "pet_found"
  | "pet_died"
  | "game_over";

export type EventLogEntry = {
  id: string;
  at: IsoDateString;
  kind: EventLogKind;
  message: string;
};

