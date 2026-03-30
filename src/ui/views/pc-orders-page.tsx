import {
  getNextPcTier,
  getOrderLevelByPcScore,
  hasFriendOrderMarketAccess,
  meetsOrderPcRequirements,
  meetsOrderQualificationRequirements,
  pcScoreRangesByOrderLevel,
  type GameState,
  type PcSpecs,
  type QualificationLevel,
} from "../../domain";
import { getActivityProgress, useNow } from "../activity-progress";
import { formatUiPercent } from "../display-format";
import { InfoHint } from "../info-hint";
import { useGameStore } from "../store-hooks";

const pcSpecLabels: Record<keyof PcSpecs, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "Storage",
  motherboard: "Motherboard",
  psu: "PSU",
  cooling: "Cooling",
  case: "Case",
  monitor: "Monitor",
  peripherals: "Периферия",
};

function getOrderAvailabilityHint(game: GameState): string {
  if (!hasFriendOrderMarketAccess(game) && game.orders.discoveredOrderIds.length === 0) {
    return "Рынок заказов откроется после первого друга. Прогулка тоже может принести отдельный заказ.";
  }

  if (!game.pc.isWorkingPcReady) {
    return "Заказы откроются после покупки первого ПК.";
  }

  const inactiveOrders = game.world.orderPool.filter((order) => game.orders.activeOrderId !== order.id);
  const qualificationReadyOrders = inactiveOrders.filter((order) =>
    meetsOrderQualificationRequirements(game, order),
  );
  const nextPcBlockedOrder = qualificationReadyOrders.find(
    (order) => !meetsOrderPcRequirements(game, order),
  );

  if (qualificationReadyOrders.length === 0) {
    return "По квалификации заказы пока закрыты. Сначала подними нужный трек.";
  }

  if (nextPcBlockedOrder) {
    return `Следующий заказ откроется от PC score ${nextPcBlockedOrder.requirements.minPcScore}.`;
  }

  if (game.orders.discoveredOrderIds.length > 0) {
    return "В списке есть заказы, найденные на прогулках. Друзья продолжают открывать основной рынок.";
  }

  return "Заказы ротируются и могут возвращаться в витрину. Обновляй список, чтобы ловить повторы и более выгодные варианты.";
}

function renderPcSpecs(specs: PcSpecs) {
  return (
    <div className="pc-spec-list">
      {Object.entries(specs).map(([key, value]) => (
        <div key={key} className="stat-item">
          <strong>{pcSpecLabels[key as keyof PcSpecs]}</strong>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

export function PcOrdersPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);
  const now = useNow();

  const currentBuild = game.pc.currentBuild;
  const nextBuild = getNextPcTier(game);
  const visibleOrders = game.orders.availableOrderIds
    .map((id) => game.world.orderPool.find((order) => order.id === id))
    .filter((order): order is NonNullable<typeof order> => Boolean(order));
  const activeOrder = game.orders.activeOrderId
    ? game.world.orderPool.find((order) => order.id === game.orders.activeOrderId) ?? null
    : null;
  const activeOrderProgress =
    game.timers.activeOrder && activeOrder
      ? getActivityProgress(game.timers.activeOrder, now)
      : null;
  const currentOrderTier = getOrderLevelByPcScore(game.pc.ratingScore);
  const nextOrderTier: QualificationLevel | null =
    currentOrderTier === null
      ? 1
      : currentOrderTier < 5
        ? (currentOrderTier + 1) as QualificationLevel
        : null;
  const nextOrderScore = nextOrderTier ? pcScoreRangesByOrderLevel[nextOrderTier].minScore : null;
  const pcLevelHint = currentBuild
    ? "Каждый апгрейд меняет весь ПК сразу. PC level теперь равен уровню текущей сборки."
    : "Первый апгрейд сразу покупает полный рабочий ПК.";
  const orderAvailabilityHint = getOrderAvailabilityHint(game);
  const friendMarketStatus = hasFriendOrderMarketAccess(game)
    ? "Рынок друзей открыт"
    : game.orders.discoveredOrderIds.length > 0
      ? "Только заказы с прогулок"
      : "Нужен первый друг";

  return (
    <section className="page-grid pc-grid">
      <div className="panel pc-stage wide-panel">
        <p className="eyebrow">ПК / Заказы</p>
        <h2>Рабочее место</h2>
        <div className="pc-figure">
          <div className="monitor-shell">
            <div className="monitor-screen">
              <p>pc-man@workspace</p>
              <p>pc_level: {game.pc.level}</p>
              <p>rating_score: {game.pc.ratingScore}</p>
              <p>build: {currentBuild?.title ?? "none"}</p>
              <p>working_pc_ready: {String(game.pc.isWorkingPcReady)}</p>
              <p>active_order: {game.orders.activeOrderId ?? "none"}</p>
              <p>order_progress: {activeOrderProgress?.percent ?? 0}%</p>
            </div>
          </div>
          <div className="pc-stand" />
          <div className="pc-desk-line" />
        </div>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">PC level</span>
            <strong>{game.pc.level}</strong>
          </div>
          <div>
            <span className="metric-label">PC score</span>
            <strong>{game.pc.ratingScore}</strong>
          </div>
          <div>
            <span className="metric-label">Сборка</span>
            <strong>{currentBuild?.title ?? "ПК не куплен"}</strong>
          </div>
          <div>
            <span className="metric-label">Рынок заказов</span>
            <strong>{friendMarketStatus}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Доступные заказы</h3>
              <InfoHint text="Пул ротируется раз в 10 минут. Одновременно можно вести только один заказ." />
            </div>
          </div>
          <div className="badge-row">
            <button className="primary-button" onClick={() => actions.refreshOrders()}>
              Обновить заказы
            </button>
            <span className="badge">Видно: {visibleOrders.length}/10</span>
            <span className="badge">
              Следующее обновление: {game.orders.nextRefreshAt ? "запланировано" : "нет"}
            </span>
          </div>
        </div>

        <div className="timer-card compact-card">
          <div className="stat-list compact-stats">
            <div className="stat-item">
              <span>PC level</span>
              <strong>{game.pc.level}</strong>
            </div>
            <div className="stat-item">
              <span>Текущий tier заказов</span>
              <strong>{currentOrderTier ? `lvl ${currentOrderTier}` : "Закрыт"}</strong>
            </div>
            <div className="stat-item">
              <span>Следующий порог</span>
              <strong>{nextOrderScore ? `${nextOrderScore} PC score` : "Максимум"}</strong>
            </div>
            <div className="stat-item">
              <span>Активный заказ</span>
              <strong>{activeOrder ? activeOrder.title : "Нет"}</strong>
            </div>
          </div>
          <p className="muted">{pcLevelHint}</p>
          <p className="muted">{orderAvailabilityHint}</p>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="empty-state">
            <h4>Пока нет доступных заказов</h4>
            <p>{orderAvailabilityHint}</p>
          </div>
        ) : (
          <div className="order-list">
            {visibleOrders.map((order) => (
              <article key={order.id} className="order-card compact-card">
                <div className="order-meta">
                  <span className="badge">lvl {order.level}</span>
                  {order.isGolden ? <span className="badge gold-badge">gold</span> : null}
                  <span className="badge">{order.track}</span>
                </div>
                <h4>{order.title}</h4>
                <p>{order.funnyTitle}</p>
                <div className="pc-spec-list">
                  <div className="stat-item">
                    <strong>Время</strong>
                    <span>{order.durationDays} дн.</span>
                  </div>
                  <div className="stat-item">
                    <strong>Награда</strong>
                    <span>${order.rewardMoney}</span>
                  </div>
                  <div className="stat-item">
                    <strong>QP</strong>
                    <span>+{order.rewardQualificationPoints}</span>
                  </div>
                  <div className="stat-item">
                    <strong>Риск</strong>
                    <span>{formatUiPercent(order.failureChancePct)}</span>
                  </div>
                  <div className="stat-item">
                    <strong>Мин. ПК</strong>
                    <span>{order.requirements.minPcScore}</span>
                  </div>
                </div>
                <button
                  className="primary-button"
                  onClick={() => actions.startOrder(order.id)}
                  disabled={Boolean(game.orders.activeOrderId)}
                >
                  Взять заказ
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Текущий ПК</h3>
              <InfoHint text="Теперь ПК покупается целиком. Один апгрейд меняет всю сборку сразу." />
            </div>
          </div>
          <span className="badge">{currentBuild ? `tier ${currentBuild.level}` : "нет ПК"}</span>
        </div>

        {nextBuild ? (
          <div className="risk-list">
            <article className="timer-card compact-card">
              <strong>{currentBuild ? currentBuild.title : "ПК ещё не куплен"}</strong>
              <p>{currentBuild ? currentBuild.funnyTitle : "Первый апгрейд соберёт базовую рабочую машину целиком."}</p>
              <p className="muted">
                {currentBuild
                  ? `PC score: ${currentBuild.score}. Следующий апгрейд поднимет его до ${nextBuild.score}.`
                  : `Первый апгрейд сразу даст PC score ${nextBuild.score}.`}
              </p>
            </article>
            {currentBuild ? renderPcSpecs(currentBuild.specs) : null}
            <button
              className="primary-button"
              onClick={() => actions.buyNextPcTier()}
              disabled={game.player.money < nextBuild.price}
            >
              Купить апгрейд за ${nextBuild.price}
            </button>
          </div>
        ) : (
          currentBuild ? (
            <div className="risk-list">
              <article className="timer-card compact-card">
                <strong>{currentBuild.title}</strong>
                <p>{currentBuild.funnyTitle}</p>
                <p className="muted">PC score: {currentBuild.score}. Это максимальная сборка.</p>
              </article>
              {renderPcSpecs(currentBuild.specs)}
            </div>
          ) : (
            <div className="empty-state">
              <h4>ПК ещё не куплен</h4>
              <p>Первый апгрейд соберёт базовую рабочую машину целиком.</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
