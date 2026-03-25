import { pcSlotCatalogSpec, requiredPcSlots } from "../../domain";
import { useGameStore } from "../store-hooks";

function formatSlotName(slot: keyof typeof pcSlotCatalogSpec): string {
  return pcSlotCatalogSpec[slot].displayName;
}

export function PcOrdersPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);

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

  return (
    <section className="page-grid pc-grid">
      <div className="panel pc-stage">
        <p className="eyebrow">ПК / Заказы</p>
        <h2>Рабочее место</h2>
        <div className="pc-figure">
          <div className="monitor-shell">
            <div className="monitor-screen">
              <p>pc-man@workspace</p>
              <p>rating_score: {game.pc.ratingScore}</p>
              <p>working_pc_ready: {String(game.pc.isWorkingPcReady)}</p>
              <p>active_order: {game.orders.activeOrderId ?? "none"}</p>
            </div>
          </div>
          <div className="pc-stand" />
          <div className="pc-desk-line" />
        </div>

        <div className="hero-metrics">
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
            <strong>{game.orders.activeOrderId ?? "Нет"}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Сборка и апгрейды</h3>
            <p className="muted">Покупка сразу ставит компонент в слот.</p>
          </div>
          <button className="secondary-button" onClick={() => actions.refreshOrders()}>
            Обновить заказы
          </button>
        </div>

        <div className="shop-list">
          {nextPartsBySlot.map(({ slot, installed, installedPart, nextPart }) => (
            <article key={slot} className="shop-card">
              <div>
                <p className="eyebrow">{formatSlotName(slot)}</p>
                <h4>
                  {installedPart?.funnyTitle ?? "Слот пуст"}
                </h4>
                <p className="muted">
                  Текущий уровень: {installed?.level ?? 0}
                  {" · "}
                  Очки: {installed?.score ?? 0}
                </p>
              </div>

              {nextPart ? (
                <>
                  <p>{nextPart.funnyTitle}</p>
                  <div className="shop-actions">
                    <span>{nextPart.price} K</span>
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

      <div className="panel wide-panel">
        <div className="section-head">
          <div>
            <h3>Доступные заказы</h3>
            <p className="muted">
              Пул ротируется раз в 10 минут. Одновременно можно вести только один заказ.
            </p>
          </div>
          <div className="badge-row">
            <span className="badge">Видно: {visibleOrders.length}/10</span>
            <span className="badge">
              Следующее обновление: {game.orders.nextRefreshAt ? "запланировано" : "нет"}
            </span>
          </div>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="empty-state">
            <h4>Пока нет доступных заказов</h4>
            <p>
              Собери рабочий ПК и подтяни квалификацию. После этого раздел начнет заполняться.
            </p>
          </div>
        ) : (
          <div className="order-list">
            {visibleOrders.map((order) => (
              <article key={order.id} className="order-card">
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
                    <strong>{order.rewardMoney} K</strong>
                  </div>
                  <div className="stat-item">
                    <span>QP</span>
                    <strong>+{order.rewardQualificationPoints}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Риск</span>
                    <strong>{order.failureChancePct}%</strong>
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

      <div className="panel wide-panel">
        <div className="section-head">
          <div>
            <h3>Активный заказ</h3>
            <p className="muted">Для MVP здесь доступно ручное завершение активной работы.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => actions.resolveActiveOrder()}
            disabled={!game.orders.activeOrderId}
          >
            Завершить активный заказ
          </button>
        </div>

        {game.orders.activeOrderId ? (
          <div className="active-order-banner">
            <strong>В работе: {game.orders.activeOrderId}</strong>
            <span>
              Таймер: {game.timers.activeOrder?.startedAt ?? "не запущен"} →{" "}
              {game.timers.activeOrder?.endsAt ?? "не запущен"}
            </span>
          </div>
        ) : (
          <p className="muted">Сейчас нет активного разового заказа.</p>
        )}
      </div>
    </section>
  );
}
