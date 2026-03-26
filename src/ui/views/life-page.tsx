import { useGameStore } from "../store-hooks";

function getHealthStatus(value: number): string {
  if (value >= 70) {
    return "Стабильно";
  }

  if (value >= 40) {
    return "Нужно внимание";
  }

  return "Опасная зона";
}

export function LifePage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);

  const healthMetrics = [
    { label: "Здоровье", value: game.player.health },
    { label: "Голод", value: 100 - game.player.hunger },
    { label: "Форма", value: game.player.fitness },
    { label: "Настроение", value: game.player.mood },
  ];

  return (
    <section className="page-grid">
      <div className="panel hero-headline">
        <p className="eyebrow">Быт и Здоровье</p>
        <h2>Тело, режим и лечение</h2>
        <p className="lede">
          Здесь герой ест, тренируется, следит за весом и запускает дорогое лечение с омоложением.
        </p>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Возраст</span>
            <strong>{game.player.ageYears} лет</strong>
          </div>
          <div>
            <span className="metric-label">Вес</span>
            <strong>{game.player.weight} кг</strong>
          </div>
          <div>
            <span className="metric-label">Статус здоровья</span>
            <strong>{getHealthStatus(game.player.health)}</strong>
          </div>
          <div>
            <span className="metric-label">Лечение</span>
            <strong>{game.timers.healing ? "Идет" : "Не запущено"}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Показатели состояния</h3>
        <div className="progress-list">
          {healthMetrics.map((metric) => (
            <div key={metric.label} className="progress-row">
              <div className="progress-label">
                <span>{metric.label}</span>
                <span>{metric.value}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    metric.value >= 70
                      ? "progress-good"
                      : metric.value >= 40
                        ? "progress-mid"
                        : "progress-bad"
                  }`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Повседневные действия</h3>
            <p className="muted">Минимальный слой быта для MVP.</p>
          </div>
        </div>
        <div className="order-list">
          <article className="order-card">
            <h4>Поесть</h4>
            <p>Снимает голод, слегка повышает здоровье и настроение, но может добавить вес.</p>
            <button
              className="primary-button"
              onClick={() => actions.eatMeal()}
              disabled={game.player.money < 35}
            >
              Поесть за $35
            </button>
          </article>
          <article className="order-card">
            <h4>Тренировка</h4>
            <p>Улучшает форму и здоровье, уменьшает вес, но повышает голод.</p>
            <button className="secondary-button" onClick={() => actions.doWorkout()}>
              Сделать тренировку
            </button>
          </article>
          <article className="order-card">
            <h4>Дорогое лечение</h4>
            <p>Стоит дорого, идет по таймеру и после завершения омолаживает героя на 10 лет.</p>
            <div className="shop-actions">
              <button
                className="primary-button"
                onClick={() => actions.startHealing()}
                disabled={Boolean(game.timers.healing) || game.player.money < 650}
              >
                Начать лечение
              </button>
              <button
                className="secondary-button"
                onClick={() => actions.completeHealing()}
                disabled={!game.timers.healing}
              >
                Завершить лечение
              </button>
            </div>
          </article>
        </div>
      </div>

      <div className="panel wide-panel">
        <h3>Риски возраста и самочувствия</h3>
        <div className="risk-list">
          <article className={`risk-card ${game.player.hunger >= 70 ? "risk-high" : "risk-low"}`}>
            <strong>Голод</strong>
            <p>
              Текущий уровень голода: {game.player.hunger}%. При критических значениях герой может
              умереть.
            </p>
          </article>
          <article className={`risk-card ${game.player.health <= 45 ? "risk-high" : "risk-low"}`}>
            <strong>Здоровье</strong>
            <p>
              Текущее здоровье: {game.player.health}%. Плохое здоровье усиливает риски старения.
            </p>
          </article>
          <article className={`risk-card ${game.player.weight >= 110 ? "risk-mid" : "risk-low"}`}>
            <strong>Вес</strong>
            <p>
              Текущий вес: {game.player.weight} кг. Избыточный вес должен ухудшать жизненные
              показатели.
            </p>
          </article>
          <article className={`risk-card ${game.player.ageYears >= 60 ? "risk-mid" : "risk-low"}`}>
            <strong>Старение</strong>
            <p>
              Возраст героя: {game.player.ageYears}. После 60 лет старение должно ощущаться сильнее.
            </p>
          </article>
        </div>
      </div>

      <div className="panel wide-panel">
        <h3>Таймер лечения</h3>
        {game.timers.healing ? (
          <div className="timer-card">
            <strong>Активен курс лечения</strong>
            <p>Старт: {new Date(game.timers.healing.startedAt).toLocaleString("ru-RU")}</p>
            <p>Окончание: {new Date(game.timers.healing.endsAt).toLocaleString("ru-RU")}</p>
          </div>
        ) : (
          <p className="muted">Сейчас лечение не запущено.</p>
        )}
      </div>
    </section>
  );
}
