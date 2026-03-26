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
- Денежная единица: `доллары США (USD)`.

### 2.1. Модель игрового времени

- Базовая единица для MVP: `1 реальная минута = 1 игровой месяц`.
- Производные единицы:
  - `12 реальных минут = 1 игровой год`;
  - `1 игровой месяц = 30 игровых дней`;
  - `1 игровой день = 2 реальные секунды`.
- Формальные пересчеты:
  - `gameDays / 30 = realMinutes`;
  - `realMinutes = gameMonths`;
  - `realMinutes / 12 = gameYears`.
- Источник истины по времени хранится в ISO timestamp-полях:
  - `meta.updatedAt`;
  - `meta.lastOpenedAt`;
  - `timers.*.startedAt`;
  - `timers.*.endsAt`.
- Любая длинная активность моделируется абсолютным таймером, а не количеством прошедших тиков.
- Время должно прокручиваться от `meta.lastOpenedAt` до `now` как при гидратации сохранения, так и перед пользовательским действием.

Уточнения для единиц времени:

- таймеры длительных действий удобно хранить в реальных минутах;
- пользовательские длительности контента можно задавать в игровых днях и конвертировать по формуле `durationDays / 30`;
- возраст героя логично считать в игровых годах, производных от общей минутной шкалы;
- отдельного независимого "тика дня" в MVP не требуется: день является расчетной, а не базовой системной единицей.

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

Уточнение по классам систем:

- пассивный прогресс не требует отдельного активного таймера на каждую систему;
- таймерные процессы обязаны иметь явно хранимые `startedAt` / `endsAt`;
- периодические пересчеты запускаются при догоне времени и после завершения таймеров.

Формальный перечень time-dependent систем MVP:

- `player.ageYears`;
- `player.hunger`;
- `player.health`;
- `player.weight`;
- `player.fitness`;
- `player.mood`;
- `learning.activeBookId` и `timers.learning`;
- `career.jobSearchInProgress` и `timers.jobSearch`;
- `career.monthlySalaryActual` и `timers.salaryCycle`;
- `orders.activeOrderId` и `timers.activeOrder`;
- `timers.walk` и социальные последствия прогулки;
- `timers.healing` и последствия лечения;
- `orders.lastRefreshAt` / `orders.nextRefreshAt`;
- `meta.isGameOver` и `meta.gameOverReason`.

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
  propertyValue: number
  capital: number
  hunger: number
  health: number
  weight: number
  fitness: number
  mood: number
  education: "university"
  housingStatus: "with_parents" | "rent" | "own_home"
  isAlive: boolean
}
```

Пояснения:

- `capital = money + realEstateValue + propertyValue`
- `realEstateValue` хранит стоимость недвижимости героя
- `propertyValue` хранит стоимость прочего имущества, которое тоже участвует в капитале
- отдельной сущности `wealth` или `netWorth` в MVP нет
- `hunger`, `health`, `fitness`, `mood` удобно хранить в шкале `0-100`
- `housingStatus` фиксирует базовый жилищный статус героя и используется в бытовых и семейных ветках
- `PlayerState` хранит только базовый персональный, жизненный и имущественный срез героя
- навыки и прогресс специализаций лежат в `SkillState`
- работа, должность, зарплата и поиск вакансий лежат в `CareerState`
- друзья, отношения, семья, питомцы и прогулочные события лежат в `SocialState`
- активные заказы и их награды лежат в `OrderState`
- активные эффекты, таймеры и глобальные флаги прогресса лежат в `GameTimerState` и `MetaState`
- старт:
  - `ageYears = 21`
  - `money = 1000`
  - `realEstateValue = 0`
  - `propertyValue = 0`
  - `capital = 1000`
  - `hunger = 20`
  - `health = 100`
  - `weight = 72`
  - `fitness = 45`
  - `mood = 65`
  - `education = "university"`
  - `housingStatus = "with_parents"`
  - `isAlive = true`

## 5.1. Производные показатели героя

В текущей модели нужно различать два класса derived-значений:

- materialized-поля, которые кэшируются прямо в save-state для удобства UI и rule-слоя;
- on-demand показатели, которые считаются из текущего состояния, но пока не вынесены в отдельные persisted-поля.

Materialized derived-поля MVP:

- `player.capital = money + realEstateValue + propertyValue`
- `learning.availableBookIds = getAvailableBookIds(world.availableBooks, skills)`
- `pc.isWorkingPcReady = requiredPcSlots.every(slot => components[slot] !== null)`
- `pc.ratingScore = sum(components[slot].score)` только по rated-слотам
- `orders.availableOrderIds = selectVisibleOrders(gameState, now).map(order => order.id)`

On-demand derived-показатели MVP:

- `alivePetsCount = social.pets.filter(pet => pet.isAlive).length`
- `familyMembersCount = (social.spouse ? 1 : 0) + social.childrenCount + alivePetsCount`
- `monthlyFamilyExpenses = (social.spouse ? 180 : 0) + social.childrenCount * 140 + alivePetsCount * 35`
- `monthlyNetIncome = (career.monthlySalaryActual ?? 0) - monthlyFamilyExpenses`
- `learningSpeedMultiplier = min(1.30, 1 + (social.spouse ? 0.10 : 0) + social.childrenCount * 0.05)`

Правила:

- `normalizeGameState()` обязателен после любых изменений игрока, навыков или ПК, потому что он пересчитывает `capital`, `availableBookIds`, `isWorkingPcReady` и `ratingScore`
- `orders.availableOrderIds` не нормализуется в `normalizeGameState()`, а обновляется отдельным order-refresh циклом
- `monthlyFamilyExpenses`, `monthlyNetIncome` и `learningSpeedMultiplier` пока не имеют собственных полей в `GameState`; rule-слой должен вычислять их из `SocialState`, `CareerState` и `PlayerState` в момент применения эффекта
- доступность заказа определяется как производное правило: заказ должен пройти проверки по квалификации, состоянию ПК, диапазону `ratingScore`, отсутствию другого активного заказа и статусу `completed/failed`
- семейные бонусы и расходы используют только текущих живых питомцев; будущие "другие члены семьи" в MVP в формулу не входят
- `monthlyNetIncome` может быть отрицательным и показывает, как семья влияет на свободный денежный поток героя без отдельного баффа к зарплате
- отдельного persisted-поля `familyDiscountPct` или любого другого family price modifier в MVP нет; цены действий и покупок берутся из базовых каталогов/констант

Правила для голода и смерти в MVP:

- `hunger = 0` означает сытое и безопасное состояние;
- `hunger = 100` означает мгновенный `game over` по причине `hunger`;
- начиная примерно с `hunger >= 80`, здоровье должно дополнительно ухудшаться при прокрутке времени;
- поле `isAlive` переключается в `false` только при наступлении смерти;
- после смерти состояние игрока больше не должно продолжать обычный жизненный прогресс.

## 5.1. Game Over от голода

Для смерти от голода в модели данных важно зафиксировать следующее:

- `meta.isGameOver = true`;
- `meta.gameOverReason = "hunger"`;
- `player.isAlive = false`;
- все активные таймеры очищаются;
- сохранение должно содержать финальное состояние, чтобы итоговый экран можно было восстановить после перезагрузки.

## 5.2. Возраст и смерть от старости

Для старения в модели данных важно закрепить:

- `player.ageYears` растет автоматически при любой прокрутке времени;
- значение может храниться с десятичной частью, чтобы не терять точность между месяцами и годами;
- начиная примерно с `ageYears >= 60` здоровье должно получать дополнительный возрастной штраф;
- при `ageYears >= 85` и критически низком здоровье герой может умереть раньше естественного предела;
- при `ageYears >= 100` наступает гарантированный `game over` по причине `old_age`.

При смерти от старости модель должна фиксировать:

- `meta.isGameOver = true`;
- `meta.gameOverReason = "old_age"`;
- `player.isAlive = false`;
- остановку всех таймеров;
- финальное сохранение состояния для восстановления итогового экрана после перезагрузки.

## 5.3. Здоровье, вес и спорт

Для MVP здоровье и форма героя должны следовать детерминированной модели:

- `player.health`, `player.hunger`, `player.fitness` и `player.mood` хранятся по шкале `0-100`
- `player.weight` хранится отдельным числом в диапазоне `40-180`
- при passive time advance за `1` игровой месяц применяются базовые коэффициенты:
  - `hunger += 6`
  - `fitness -= 0.8`
  - `mood -= 1.2`
  - `weight += max(0.08, 0.22 - fitness / 300)`
  - `health -= 0.25`
- дополнительные штрафы к здоровью за `1` игровой месяц:
  - `+0.75`, если `ageYears >= 60`
  - `+1.4`, если `hunger >= 80`
  - `+0.65`, если `weight >= 110`
  - `+0.4`, если `weight <= 50`

Активные действия MVP:

- `eatMeal()`:
  - `money -= 35`
  - `hunger -= 28`
  - `health += 4`
  - `mood += 3`
  - `weight += 1`
- `doWorkout()`:
  - `fitness += 10`
  - `health += 6`
  - `hunger += 10`
  - `mood += 4` net
  - `weight -= 1`
- `completeHealing()`:
  - `health += 30`
  - `mood += 10`
  - `fitness += 4`
  - `ageYears -= 10`

Правила:

- все изменения этих показателей clamp-ятся в допустимые диапазоны
- `health <= 0` переводит игру в `meta.gameOverReason = "illness"`
- отсутствие спорта влияет на здоровье не отдельным флагом, а через комбинацию `fitness` decay, набора веса, возраста, голода и базового жизненного износа
- прогулки и тренировки являются основными активными способами удерживать `fitness`, вес и здоровье в безопасной зоне
- `startHealing()` разрешен только если у героя хватает `$650` и слот `timers.healing` сейчас пуст
- `startHealing()` сразу списывает `$650` и создает таймер лечения на `7` игровых дней
- `completeHealing()` разрешен только при активном `timers.healing` и после применения эффекта очищает слот обратно в `null`
- омоложение clamp-ится по нижней границе `18` лет, поэтому лечение не может сделать героя моложе этого возраста

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

Пояснения для карьерного цикла MVP:

- `monthlySalaryBase` хранит базовую зарплату должности;
- `monthlySalaryActual` хранит фактическую зарплату выбранной вакансии с учетом компании;
- `promotionAvailable` означает, что герой уже выполнил условия следующего перехода, но сам еще не принял решение;
- `currentJobId` ссылается на принятую вакансию или текущую должность как источник активного зарплатного цикла;
- `previousJobHistory` накапливает прошлые места работы и использованные карьерные переходы;
- отдельного persisted-поля `careerStability` в MVP нет;
- после первого трудоустройства обычный игровой цикл не должен автоматически возвращать героя в `employmentStatus = "unemployed"`.

## 6.1. Зарплатный цикл и переходы

Для MVP в модели данных важно закрепить:

- принятие вакансии переводит героя в `employmentStatus = "employed"`;
- одновременно с принятием вакансии стартует `timers.salaryCycle`;
- когда таймер заканчивается, игрок автоматически получает `monthlySalaryActual`;
- после выплаты создается следующий `salaryCycle`, пока герой остается трудоустроенным;
- при смене вакансии или должности значения `monthlySalaryBase`, `monthlySalaryActual`, `currentCompanyId`, `currentTrack` и `currentCareerLevel` обновляются сразу;
- `promotionAvailable` не переводит героя автоматически на следующую ступень, а лишь открывает действие перехода;
- в текущем MVP нет автоматического перехода `employmentStatus: "employed" -> "unemployed"`;
- отказ во внутреннем повышении не очищает текущую работу и не должен останавливать `timers.salaryCycle`;
- влияние семьи на карьеру идет не через изменение `monthlySalaryActual`, а через `learningSpeedMultiplier` и on-demand показатель `monthlyNetIncome`.

## 7. Vacancy

```ts
type Vacancy = {
  id: string
  companyId: string
  track: CareerTrackId
  formalTitle: string
  funnyTitle: string
  careerLevel: CareerLevel
  baseSalary: number
  companyModifierPct: number
  finalSalary: number
  isGolden: boolean
  requirements: VacancyRequirements
  validUntil: string
}

type VacancyRequirements = {
  requiredTrack: CareerTrackId
  requiredQualificationLevel: QualificationLevel
  requiredQualificationPoints?: number
  requiredPreviousTrack?: CareerTrackId[]
  requiredPreviousTitle?: string[]
}

type VacancyTemplate = Omit<Vacancy, "id" | "companyId" | "finalSalary" | "validUntil">
```

Правила:

- `src/domain/catalogs/vacancies.ts` хранит seed-справочник `VacancyTemplate[]`
- поиск работы создает `1-3` runtime-объекта `Vacancy` из шаблонов и компаний
- игрок может принять только одну вакансию
- золотая вакансия имеет `isGolden = true`
- `companyId`, `finalSalary` и `validUntil` появляются только после генерации runtime-вакансии

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

Правила для MVP:

- `SkillTrackId` описывает только базовые развиваемые специализации;
- поздняя `cto`-ветка существует в карьере и книгах, но не хранится как отдельный базовый `SkillTrackId`;
- каждый трек прогрессирует независимо через собственные `level`, `points`, `booksCompleted` и `practicalTasksCompleted`;
- герой может развивать несколько треков параллельно, без жесткого лимита на их количество.

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
type BookUnlockCondition = {
  track: SkillTrackId
  minLevel?: QualificationLevel
  minPoints?: number
}

type BookUnlockRequirements = {
  track?: SkillTrackId
  minLevel?: QualificationLevel
  minPoints?: number
  allOf?: BookUnlockCondition[]
  anyOf?: BookUnlockCondition[]
}

type Book = {
  id: string
  track: SkillTrackId | "universal" | "cto"
  title: string
  funnyTitle: string
  level: QualificationLevel
  price: number
  durationDays: number
  qualificationPoints: number
  unlockRequirements?: BookUnlockRequirements
}
```

Правила:

- `src/domain/catalogs/books.ts` хранит seed-справочник книг как `Book[]`
- `track = "universal"` означает книгу без жесткой привязки к одному треку награды
- `track = "cto"` допустим в каталоге книг, но не заводит отдельный `SkillTrackId`
- простые `track/minLevel/minPoints` можно использовать напрямую, а `allOf/anyOf` нужны для составных правил открытия книги

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

- `src/domain/catalogs/pc-parts.ts` генерирует каталог из всех `requiredPcSlots`
- на каждый слот создается ровно `40` уровней апгрейда
- для rated-слотов `score = level`
- для `keyboard` и `mouse` `score = 0`, хотя они обязательны для рабочего ПК
- `price` считается по нелинейной формуле `basePrice + level * linearStep + level^2 * quadraticFactor`, затем округляется
- список rated-слотов и ценовые коэффициенты живут в seed-спецификации каталога, а не в save-state

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
  level: QualificationLevel
  durationDays: number
  rewardMoney: number
  rewardQualificationPoints: number
  isGolden: boolean
  failureChancePct: number
  sourceFriendId?: string
  requirements: OrderRequirements
}

type OrderRequirements = {
  minQualificationLevel: number
  minQualificationPoints?: number
  minPcScore: number
  maxPcScore?: number
  requiresWorkingPc: boolean
}

type OrderTemplate = Omit<Order, "id" | "sourceFriendId">
```

Правила:

- для runtime-`Order` обязательны все поля верхнего уровня: `id`, `track`, `title`, `funnyTitle`, `level`, `durationDays`, `rewardMoney`, `rewardQualificationPoints`, `isGolden`, `failureChancePct`, `requirements`
- внутри `requirements` обязательны `minQualificationLevel`, `minPcScore`, `requiresWorkingPc`
- внутри `requirements` опциональны только `minQualificationPoints` и `maxPcScore`
- `src/domain/catalogs/orders.ts` хранит seed-справочник `OrderTemplate[]`
- в `world.orderPool` лежат runtime-объекты `Order` с уже присвоенным `id`
- `sourceFriendId` является опциональным только для runtime-`Order` и используется, когда заказ пришел из социального канала друга
- `requiresWorkingPc`, `minPcScore` и `maxPcScore` ограничивают доступность заказа по состоянию ПК
- золотые заказы помечаются `isGolden = true`, но используют ту же структуру, что и обычные
- `track` задает специализацию заказа, `level` задает квалификационную сложность, `durationDays` управляет длительностью таймера заказа
- `rewardMoney` и `rewardQualificationPoints` выдаются только при успешном завершении заказа
- `failureChancePct` хранится как вероятность провала в процентах `0-100`
- квалификационная проверка заказа всегда берет только `skills.tracks[order.track]`
- `requirements.minQualificationLevel` сравнивается с текущим `QualificationProgress.level` этого трека
- `requirements.minQualificationPoints`, если задан, сравнивается с `QualificationProgress.points` того же трека
- progress других специализаций не может открыть заказ чужого `track`
- PC-проверка заказа использует только `pc.isWorkingPcReady` и `pc.ratingScore`
- если `requirements.requiresWorkingPc = true`, заказ блокируется до полной сборки обязательных слотов
- `requirements.minPcScore` задает нижнюю границу допустимого `ratingScore`
- `requirements.maxPcScore`, если задан, задает верхнюю границу допустимого `ratingScore`
- `keyboard` и `mouse` обязательны для `isWorkingPcReady`, но не участвуют в расчете `ratingScore`
- базовая шкала `PC score` для order-gating:
  - `level 1` -> `9-80`
  - `level 2` -> `81-140`
  - `level 3` -> `141-200`
  - `level 4` -> `201-260`
  - `level 5` -> `261-360`
- базовая шкала уровней для order-gating:
  - `level 1` -> `0-79 QP`
  - `level 2` -> `80-179 QP`
  - `level 3` -> `180-319 QP`
  - `level 4` -> `320-499 QP`
  - `level 5` -> `500+ QP`
- базовая шкала длительностей заказов по `level`:
  - `level 1` -> `1-2` дней
  - `level 2` -> `3-7` дней
  - `level 3` -> `8-14` дней
  - `level 4` -> `15-21` дней
  - `level 5` -> `22-30` дней
- success-path заказа:
  - `player.money += rewardMoney`
  - `skills.tracks[order.track].points += rewardQualificationPoints`
  - `skills.tracks[order.track].practicalTasksCompleted += 1`
  - `orders.completedOrderIds` пополняется `order.id`
  - `orders.activeOrderId` и `timers.activeOrder` очищаются
- fail-path заказа:
  - `orders.failedOrderIds` пополняется `order.id`
  - `orders.activeOrderId` и `timers.activeOrder` очищаются
  - деньги, QP и дополнительные штрафы не применяются
- если у заказа есть `sourceFriendId`, он все равно проходит те же qualification/PC-проверки, что и обычный заказ
- `failureChancePct` интерпретируется как проверка `randomValue < failureChancePct / 100`
- при завершении заказа в event log пишется либо `order_completed`, либо `order_failed`

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

- одновременно активных друзей максимум `20`
- `childrenCount` в MVP ограничен диапазоном `0-4`
- питомцев максимум `5`
- друг перестает быть активным после `3` принятых заказов из социального канала
- `timers.walk` запускает отдельный social-resolution цикл на `2` игровых дня
- по завершении `walk` всегда создается один `walk_completed` log
- базовый прогулочный исход меняет `player.money`, `player.health` и `player.mood`
- каждая прогулка дополнительно применяет:
  - `player.hunger += 8`
  - `player.fitness += 6`
  - `player.weight -= 1`
- прогулка может создать:
  - `FriendState`, если активных друзей меньше `20`
  - `SpouseState`, если `social.spouse === null`
  - `PetState`, если живых питомцев меньше `5`
- базовые шансы MVP в текущей реализации:
  - новый друг: `32%`
  - жена: `15%`
  - новый питомец: `22%`
- найденный на прогулке друг стартует с `ordersGivenCount = 0`, `maxOrdersGiven = 3`, `isActive = true`
- активным источником социальных заказов считается только друг с `isActive = true` и `ordersGivenCount < maxOrdersGiven`
- друг может одновременно держать не более одного активного friend-order в витрине
- runtime-заказ от друга получает `sourceFriendId = friend.id`
- при принятии такого заказа связанный `FriendState.ordersGivenCount += 1`
- когда `ordersGivenCount >= maxOrdersGiven`, друг переводится в `isActive = false` и больше не участвует в выдаче заказов
- неактивные друзья могут оставаться в `social.friends` для истории, но не участвуют в лимите активных друзей и в дальнейшем пополнении социального канала
- найденная на прогулке жена стартует с `relationshipLevel = 35`, `giftCount = 0`, `canSuggestChild = false`
- жена может появиться только если `social.spouse === null`
- базовый шанс появления жены в текущей реализации: `15%` на завершение прогулки
- `giveSpouseGift()` работает только если жена уже есть и у героя хватает `$180`
- после подарка:
  - `player.money -= 180`
  - `player.mood += 5`
  - `spouse.giftCount += 1`
  - `spouse.relationshipLevel += 14`
- `spouse.canSuggestChild = true` только если одновременно выполнены условия:
  - `social.childrenCount < 4`
  - `spouse.giftCount >= 2`
  - `spouse.relationshipLevel >= 55`
- `acceptChildSuggestion()` разрешен только если `spouse.canSuggestChild === true`
- после принятия предложения ребенка:
  - `social.childrenCount += 1`
  - `player.mood += 8`
  - `spouse.relationshipLevel += 6`
  - `spouse.canSuggestChild = false`
- найденный питомец получает `expectedLifeYears = 2` или `3`
- питомец может появиться только если живых питомцев сейчас меньше `5`
- базовый шанс появления нового питомца в текущей реализации: `22%` на завершение прогулки
- живые питомцы участвуют в `familyMembersCount` и `monthlyFamilyExpenses`, мертвые остаются только в истории `social.pets`
- во время завершения прогулки уже существующие питомцы могут умереть от возраста:
  - до зоны риска смерти нет
  - за `0.5` игрового года до ожидаемого конца жизни включается проверка с шансом смерти `16%`
  - после expected life years шанс смерти повышается до `55%`

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

Правила:

- `companies`, `availableBooks` и `availablePcParts` загружаются в initial state прямо из seed-каталогов
- `activeVacancies` и `orderPool` содержат runtime-объекты, созданные на основе `VacancyTemplate[]` и `OrderTemplate[]`
- export-индекс `src/domain/catalogs/index.ts` собирает единый набор справочников: `books`, `companies`, `vacancyTemplates`, `orderTemplates`, `pcPartsCatalog`

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

- `gameState.timers` хранится как фиксированный объект из шести nullable-слотов, а не как массив или словарь произвольных таймеров.
- `null` в слоте означает, что соответствующая activity сейчас не выполняется.
- В каждом слоте одновременно может лежать только один `ActivityTimer`; параллельные таймеры одного типа в MVP не поддерживаются.
- `startedAt` и `endsAt` сериализуются как ISO UTC строки и используются в offline-progress для поиска ближайшего истечения.
- `id` генерируется в формате `timer-${kind}-${startedAtUnixMs}` и нужен для детерминированных ссылок на конкретный запуск активности.
- Имена слотов и `ActivityTimer.kind` не всегда совпадают; каноническое соответствие такое:
  - `learning` -> `kind: "learning"` -> `referenceId = bookId`
  - `jobSearch` -> `kind: "job_search"` -> `referenceId = "job-search"`
  - `salaryCycle` -> `kind: "salary_cycle"` -> `referenceId = currentJobId`
  - `activeOrder` -> `kind: "order"` -> `referenceId = orderId`
  - `walk` -> `kind: "walk"` -> `referenceId = "walk"`
  - `healing` -> `kind: "healing"` -> `referenceId = "healing-course"`
- Длительности вычисляются не в самом таймере, а при создании:
  - `learning` берет `book.durationDays`
  - `jobSearch` длится `1-3` игровых дня
  - `salaryCycle` всегда длится `1` игровой месяц
  - `activeOrder` берет `order.durationDays`
  - `walk` длится `2` игровых дня
  - `healing` длится `7` игровых дней
- При завершении активности слот обычно очищается в `null`; исключение: `salaryCycle`, который после выплаты сразу пересоздается на следующий месяц, пока герой трудоустроен.
- Обновление пула заказов не входит в `TimerState`: для него используются `orders.lastRefreshAt` и `orders.nextRefreshAt`.

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
    | "walk_completed"
    | "friend_found"
    | "spouse_found"
    | "gift_given"
    | "child_born"
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
