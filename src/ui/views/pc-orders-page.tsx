import {
  getOrderLevelByPcScore,
  meetsOrderPcRequirements,
  meetsOrderQualificationRequirements,
  pcScoreRangesByOrderLevel,
  pcSlotCatalogSpec,
  requiredPcSlots,
  type GameState,
  type QualificationLevel,
} from "../../domain";
import { getActivityProgress, useNow } from "../activity-progress";
import { formatUiPercent } from "../display-format";
import { InfoHint } from "../info-hint";
import { useGameStore } from "../store-hooks";

function formatSlotName(slot: keyof typeof pcSlotCatalogSpec): string {
  return pcSlotCatalogSpec[slot].displayName;
}

function getOrderAvailabilityHint(game: GameState): string {
  if (!game.pc.isWorkingPcReady) {
    return "Заказы откроются после полной сборки рабочего ПК.";
  }

  const unresolvedOrders = game.world.orderPool.filter(
    (order) =>
      !game.orders.completedOrderIds.includes(order.id) &&
      !game.orders.failedOrderIds.includes(order.id) &&
      game.orders.activeOrderId !== order.id,
  );
  const qualificationReadyOrders = unresolvedOrders.filter((order) =>
    meetsOrderQualificationRequirements(game, order),
  );
  const nextPcBlockedOrder = qualificationReadyOrders.find(
    (order) => !meetsOrderPcRequirements(game, order),
  );

  if (unresolvedOrders.length === 0) {
    return "В пуле больше не осталось новых заказов. Нужен новый контент или сброс прогресса.";
  }

  if (qualificationReadyOrders.length === 0) {
    return "По квалификации заказы пока закрыты. Сначала подними нужный трек.";
  }

  if (nextPcBlockedOrder) {
    return `Следующий заказ откроется от PC score ${nextPcBlockedOrder.requirements.minPcScore}.`;
  }

  return "Пул заказов можно обновлять вручную, чтобы попытаться получить новые варианты.";
}

export function PcOrdersPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);
  const now = useNow();

  const nextPartsBySlot = requiredPcSlots.map((slot) => {
    const installedLevel = game.pc.components[slot]?.level ?? 0;
    const nextPart = game.world.availablePcParts.find(
      (part) => part.slot === slot && part.level === installedLevel + 1,
    );

    return {
      slot,
      installed: game.pc.components[slot],
      installedPart: game.pc.components[slot]
        ? game.world.availablePcParts.find(
            (part) => part.id === game.pc.components[slot]?.itemId,
          ) ?? null
        : null,
      nextPart,
    };
  });

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
  const activeOrderLabel = activeOrder ? activeOrder.title : "Нет";
  const currentOrderTier = getOrderLevelByPcScore(game.pc.ratingScore);
  const nextOrderTier: QualificationLevel | null =
    currentOrderTier === null
      ? 1
      : currentOrderTier < 5
        ? (currentOrderTier + 1) as QualificationLevel
        : null;
  const nextOrderScore = nextOrderTier ? pcScoreRangesByOrderLevel[nextOrderTier].minScore : null;
  const pcLevelHint =
    game.pc.level > 0
      ? `PC level считается по самому слабому компоненту. Чтобы поднять его до ${game.pc.level + 1}, все комплектующие должны быть минимум ${game.pc.level + 1} уровня.`
      : "PC level появится после сборки полного рабочего ПК.";
  const orderAvailabilityHint = getOrderAvailabilityHint(game);

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
            <span className="metric-label">Рейтинг ПК</span>
            <strong>{game.pc.ratingScore}</strong>
          </div>
          <div>
            <span className="metric-label">Статус</span>
            <strong>{game.pc.isWorkingPcReady ? "Готов к работе" : "Нужна сборка"}</strong>
          </div>
          <div>
            <span className="metric-label">Активный заказ</span>
            <strong>{activeOrderLabel}</strong>
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
                <div className="stat-list compact-stats">
                  <div className="stat-item">
                    <span>Время</span>
                    <strong>{order.durationDays} дн.</strong>
                  </div>
                  <div className="stat-item">
                    <span>Награда</span>
                    <strong>${order.rewardMoney}</strong>
                  </div>
                  <div className="stat-item">
                    <span>QP</span>
                    <strong>+{order.rewardQualificationPoints}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Риск</span>
                    <strong>{formatUiPercent(order.failureChancePct)}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Мин. ПК</span>
                    <strong>{order.requirements.minPcScore}</strong>
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
              <h3>Сборка и апгрейды</h3>
              <InfoHint text="Покупка сразу ставит компонент в слот." />
            </div>
          </div>
        </div>

        <div className="shop-list upgrade-grid">
          {nextPartsBySlot.map(({ slot, installed, installedPart, nextPart }) => (
            <article key={slot} className="shop-card compact-card upgrade-card">
              <div>
                <p className="eyebrow">{formatSlotName(slot)}</p>
                <h4>{installedPart?.funnyTitle ?? "Слот пуст"}</h4>
                <p className="muted">LVL: {installed?.level ?? 0}</p>
              </div>

              {nextPart ? (
                <>
                  <p className="muted compact-copy">{nextPart.funnyTitle}</p>
                  <div className="shop-actions compact-actions">
                    <span className="badge">${nextPart.price}</span>
                    <button
                      className="primary-button"
                      onClick={() => actions.buyAndInstallPcPart(nextPart.id)}
                      disabled={game.player.money < nextPart.price}
                    >
                      Купить
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted">Для этого слота достигнут потолок каталога.</p>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Активный заказ</h3>
              <InfoHint text="Активный заказ идет по таймеру и завершится автоматически." />
            </div>
          </div>
        </div>

        {activeOrder && activeOrderProgress ? (
          <div className="risk-list">
            <article className="active-order-banner">
              <strong>В работе: {activeOrder.title}</strong>
              <span>{activeOrder.funnyTitle}</span>
            </article>
            <article className="timer-card compact-card">
              <div className="stat-list compact-stats">
                <div className="stat-item">
                  <span>Награда</span>
                  <strong>${activeOrder.rewardMoney}</strong>
                </div>
                <div className="stat-item">
                  <span>QP</span>
                  <strong>+{activeOrder.rewardQualificationPoints}</strong>
                </div>
                <div className="stat-item">
                  <span>Риск провала</span>
                  <strong>{formatUiPercent(activeOrder.failureChancePct)}</strong>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill progress-mid"
                  style={{ width: `${activeOrderProgress.percent}%` }}
                />
              </div>
              <p>Прогресс: {formatUiPercent(activeOrderProgress.percent)}</p>
              <p className="muted">
                Осталось примерно {activeOrderProgress.remainingLabel}. Заказ завершится
                автоматически.
              </p>
            </article>
          </div>
        ) : (
          <p className="muted">Сейчас нет активного разового заказа.</p>
        )}
      </div>
    </section>
  );
}
