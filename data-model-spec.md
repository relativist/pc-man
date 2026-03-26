# Спецификация структуры данных игры "Компьютерщик"

## 1. Назначение

Документ фиксирует минимальную структуру данных для реализации MVP:

- состояние игрока;
- карьера и вакансии;
- квалификации и книги;
- заказы;
- ПК и комплектующие;
- таймеры;
- друзья, семья, питомцы;
- события и сохранение.

Документ дополняет:

- [game-requirements.md](/home/rest/intabia/pc-man/game-requirements.md)
- [career-ladders.md](/home/rest/intabia/pc-man/career-ladders.md)
- [career-and-content-tables.md](/home/rest/intabia/pc-man/career-and-content-tables.md)
- [learning-and-skill-tables.md](/home/rest/intabia/pc-man/learning-and-skill-tables.md)
- [branch-vacancies-and-orders.md](/home/rest/intabia/pc-man/branch-vacancies-and-orders.md)
- [pc-catalog-spec.md](/home/rest/intabia/pc-man/pc-catalog-spec.md)

## 2. Общие принципы

- Состояние игры хранится как один корневой объект `GameState`.
- Справочники контента отделены от прогресса игрока.
- Таймеры хранятся через `startedAt` и `endsAt`, а не через счетчик тиков.
- Все сущности имеют строковый `id`.
- Денежная единица: `Котики`.

### 2.1. Модель игрового времени

- Базовая единица для MVP: `1 реальная минута = 1 игровой месяц`.
- Производные единицы:
  - `10 реальных минут = 1 игровой год`;
  - `1 игровой месяц = 30 игровых дней`;
  - `1 игровой день = 2 реальные секунды`.
- Источник истины по времени хранится в ISO timestamp-полях:
  - `meta.updatedAt`;
  - `meta.lastOpenedAt`;
  - `timers.*.startedAt`;
  - `timers.*.endsAt`.
- Любая длинная активность моделируется абсолютным таймером, а не количеством прошедших тиков.
- Время должно прокручиваться от `meta.lastOpenedAt` до `now` как при гидратации сохранения, так и перед пользовательским действием.

### 2.2. Системы, зависящие от времени

Пассивный прогресс:

- возраст героя;
- голод;
- здоровье;
- вес;
- физическая активность;
- настроение.

Таймерные процессы:

- чтение книг;
- поиск работы;
- зарплатный цикл;
- активный заказ;
- прогулка;
- лечение.

Периодические пересчеты:

- обновление доступных заказов;
- проверка наступления `game over`;
- пересчет производных состояний после завершения таймеров.

## 3. Корневой объект

```ts
type GameState = {
  meta: MetaState
  player: PlayerState
  career: CareerState
  skills: SkillState
  learning: LearningState
  pc: PcState
  orders: OrderState
  social: SocialState
  world: WorldState
  timers: TimerState
  logs: EventLogEntry[]
}
```

## 4. MetaState

```ts
type MetaState = {
  version: string
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
  saveSlotId: string
  isGameOver: boolean
  gameOverReason: "hunger" | "illness" | "old_age" | "other" | null
}
```

## 5. PlayerState

```ts
type PlayerState = {
  id: string
  name: string
  ageYears: number
  money: number
  realEstateValue: number
  capital: number
  hunger: number
  health: number
  weight: number
  fitness: number
  mood: number
  education: "university"
  isAlive: boolean
}
```

Пояснения:

- `capital = money + realEstateValue`
- `hunger`, `health`, `fitness`, `mood` удобно хранить в шкале `0-100`
- старт:
  - `ageYears = 21`
  - `money = 1000`
  - `education = "university"`

## 6. CareerState

```ts
type CareerState = {
  employmentStatus: "unemployed" | "employed"
  currentJobId: string | null
  currentCompanyId: string | null
  currentTrack: CareerTrackId | null
  currentCareerLevel: number | null
  monthlySalaryBase: number | null
  monthlySalaryActual: number | null
  promotionAvailable: boolean
  lastPromotionRequestAt: string | null
  jobSearchInProgress: boolean
  jobSearchResultIds: string[]
  previousJobHistory: CareerHistoryEntry[]
}

type CareerHistoryEntry = {
  id: string
  companyId: string
  title: string
  track: CareerTrackId
  level: number
  startedAt: string
  endedAt: string | null
}

type CareerTrackId =
  | "qa"
  | "backend"
  | "frontend"
  | "pm"
  | "pentester"
  | "analyst"
  | "cto"
```

## 7. Vacancy

```ts
type Vacancy = {
  id: string
  companyId: string
  track: CareerTrackId
  formalTitle: string
  funnyTitle: string
  careerLevel: number
  baseSalary: number
  companyModifierPct: number
  finalSalary: number
  isGolden: boolean
  requirements: VacancyRequirements
  validUntil: string
}

type VacancyRequirements = {
  requiredTrack: CareerTrackId
  requiredQualificationLevel: number
  requiredQualificationPoints?: number
  requiredPreviousTrack?: CareerTrackId[]
  requiredPreviousTitle?: string[]
}
```

Правила:

- поиск работы создает `1-3` объекта `Vacancy`
- игрок может принять только одну вакансию
- золотая вакансия имеет `isGolden = true`

## 8. SkillState

```ts
type SkillState = {
  tracks: Record<SkillTrackId, QualificationProgress>
}

type SkillTrackId =
  | "qa"
  | "backend"
  | "frontend"
  | "pm"
  | "pentester"
  | "analyst"

type QualificationProgress = {
  track: SkillTrackId
  level: 1 | 2 | 3 | 4 | 5
  points: number
  booksCompleted: string[]
  practicalTasksCompleted: number
}
```

## 9. LearningState

```ts
type LearningState = {
  activeBookId: string | null
  ownedBookIds: string[]
  completedBookIds: string[]
  availableBookIds: string[]
}
```

Правило:

- одновременно может читаться только одна книга

## 10. Book

```ts
type Book = {
  id: string
  track: SkillTrackId | "universal" | "cto"
  title: string
  funnyTitle: string
  level: 1 | 2 | 3 | 4 | 5
  price: number
  durationDays: number
  qualificationPoints: number
  unlockRequirements?: {
    track?: SkillTrackId
    minLevel?: number
    minPoints?: number
  }
}
```

## 11. PcState

```ts
type PcState = {
  isWorkingPcReady: boolean
  ratingScore: number
  components: Record<PcComponentSlot, InstalledComponent | null>
}

type PcComponentSlot =
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "ssd"
  | "power_supply"
  | "case"
  | "cooling"
  | "monitor"
  | "keyboard"
  | "mouse"

type InstalledComponent = {
  itemId: string
  slot: PcComponentSlot
  level: number
  score: number
  purchasePrice: number
}
```

Правила:

- ПК рабочий, если все обязательные слоты заполнены
- в рейтинг входят:
  - `cpu`
  - `motherboard`
  - `ram`
  - `gpu`
  - `ssd`
  - `power_supply`
  - `case`
  - `cooling`
  - `monitor`
- `keyboard` и `mouse` обязательны, но не входят в `ratingScore`

## 12. PcComponentCatalogItem

```ts
type PcComponentCatalogItem = {
  id: string
  slot: PcComponentSlot
  funnyTitle: string
  level: number
  score: number
  price: number
}
```

Правила:

- на каждый слот можно завести `40` апгрейдов
- линейная схема:
  - `level = 1 -> score = 1`
  - `level = 30 -> score = 30`
  - `level = 40 -> score = 40`

## 13. OrderState

```ts
type OrderState = {
  activeOrderId: string | null
  availableOrderIds: string[]
  completedOrderIds: string[]
  failedOrderIds: string[]
  lastRefreshAt: string | null
  nextRefreshAt: string | null
}
```

Правила:

- одновременно активно только `1` задание
- одновременно доступно до `10` заданий
- невзятые задания обновляются каждые `10` минут

## 14. Order

```ts
type Order = {
  id: string
  track: SkillTrackId
  title: string
  funnyTitle: string
  level: 1 | 2 | 3 | 4 | 5
  durationDays: number
  rewardMoney: number
  rewardQualificationPoints: number
  isGolden: boolean
  failureChancePct: number
  requirements: OrderRequirements
}

type OrderRequirements = {
  minQualificationLevel: number
  minQualificationPoints?: number
  minPcScore: number
  maxPcScore?: number
  requiresWorkingPc: boolean
}
```

## 15. SocialState

```ts
type SocialState = {
  spouse: SpouseState | null
  childrenCount: number
  friends: FriendState[]
  pets: PetState[]
}

type SpouseState = {
  id: string
  name: string
  relationshipLevel: number
  giftCount: number
  canSuggestChild: boolean
}

type FriendState = {
  id: string
  name: string
  ordersGivenCount: number
  maxOrdersGiven: 3
  isActive: boolean
}

type PetState = {
  id: string
  name: string
  species: string
  acquiredAt: string
  expectedLifeYears: number
  isAlive: boolean
}
```

Правила:

- друзей максимум `20`
- питомцев максимум `5`
- друг исчезает после `3` выданных заказов

## 16. WorldState

```ts
type WorldState = {
  companies: Company[]
  activeVacancies: Vacancy[]
  availableBooks: Book[]
  availablePcParts: PcComponentCatalogItem[]
  orderPool: Order[]
}

type Company = {
  id: string
  name: string
  salaryModifierPct: number
  flavorText: string
}
```

## 17. TimerState

```ts
type TimerState = {
  learning: ActivityTimer | null
  jobSearch: ActivityTimer | null
  salaryCycle: ActivityTimer | null
  activeOrder: ActivityTimer | null
  walk: ActivityTimer | null
  healing: ActivityTimer | null
}

type ActivityTimer = {
  id: string
  kind:
    | "learning"
    | "job_search"
    | "salary_cycle"
    | "order"
    | "walk"
    | "healing"
  startedAt: string
  endsAt: string
  referenceId: string | null
}
```

## 18. EventLogEntry

```ts
type EventLogEntry = {
  id: string
  at: string
  kind:
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
    | "game_over"
  message: string
}
```

## 19. Рекомендуемая файловая структура для реализации

```ts
src/
  domain/
    types/
      game-state.ts
      player.ts
      career.ts
      skills.ts
      books.ts
      pc.ts
      orders.ts
      social.ts
      timers.ts
    catalogs/
      companies.ts
      books.ts
      vacancies.ts
      orders.ts
      pc-parts.ts
    rules/
      career-rules.ts
      qualification-rules.ts
      pc-score-rules.ts
      order-rules.ts
      timer-rules.ts
```

## 20. Минимальный seed для MVP

Для запуска MVP достаточно подготовить:

1. `1` стартовый игрок
2. `10` компаний
3. `4-6` веток квалификаций
4. `30-50` книг
5. `11 * 40` комплектующих
6. `30-60` разовых заданий
7. `20-40` вакансий

## 21. Вывод

Эта структура уже достаточна, чтобы:

- проектировать `TypeScript` типы;
- хранить state в `Zustand`;
- держать контент в JSON/TS-каталогах;
- собирать игровой движок без пересборки требований с нуля.
