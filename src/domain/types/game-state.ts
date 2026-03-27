import type { LearningState } from "./books";
import type { CareerState } from "./career";
import type { EventLogEntry } from "./events";
import type { MetaState } from "./meta";
import type { OrderState } from "./orders";
import type { PcState } from "./pc";
import type { PlayerState } from "./player";
import type { SkillState } from "./skills";
import type { ShopState } from "./shop";
import type { SocialState } from "./social";
import type { TimerState } from "./timers";
import type { WorldState } from "./world";

export type GameState = {
  meta: MetaState;
  player: PlayerState;
  career: CareerState;
  skills: SkillState;
  learning: LearningState;
  pc: PcState;
  orders: OrderState;
  shop: ShopState;
  social: SocialState;
  world: WorldState;
  timers: TimerState;
  logs: EventLogEntry[];
};
