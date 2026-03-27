import {
  formatUiAgeYears,
  formatUiPercent,
  formatUiWeight,
  roundUiValue,
} from "../display-format";
import { InfoHint } from "../info-hint";
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
        <div className="title-with-help">
          <h2>Тело, режим и лечение</h2>
          <InfoHint text="Здесь герой ест, тренируется, следит за весом и запускает дорогое лечение с омоложением." />
        </div>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Возраст</span>
            <strong>{formatUiAgeYears(game.player.ageYears)}</strong>
          </div>
          <div>
            <span className="metric-label">Вес</span>
            <strong>{formatUiWeight(game.player.weight)}</strong>
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
                <span>{formatUiPercent(metric.value)}</span>
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

      <div className="panel wide-panel">
        <h3>Риски возраста и самочувствия</h3>
        <div className="risk-list">
          <article className={`risk-card ${game.player.hunger >= 70 ? "risk-high" : "risk-low"}`}>
            <strong>Голод</strong>
            <p>
              Текущий уровень голода: {formatUiPercent(game.player.hunger)}. При критических
              значениях герой может умереть.
            </p>
          </article>
          <article className={`risk-card ${game.player.health <= 45 ? "risk-high" : "risk-low"}`}>
            <strong>Здоровье</strong>
            <p>
              Текущее здоровье: {formatUiPercent(game.player.health)}. Плохое здоровье усиливает
              риски старения.
            </p>
          </article>
          <article
            className={`risk-card ${
              game.player.weight > 100 ? "risk-high" : game.player.weight >= 90 ? "risk-mid" : "risk-low"
            }`}
          >
            <strong>Вес</strong>
            <p>
              Текущий вес: {formatUiWeight(game.player.weight)}. После 100 кг герой умирает от
              ожирения, так что это уже не косметическая проблема.
            </p>
          </article>
          <article className={`risk-card ${game.player.ageYears >= 60 ? "risk-mid" : "risk-low"}`}>
            <strong>Старение</strong>
            <p>
              Возраст героя: {roundUiValue(game.player.ageYears)}. После 60 лет старение должно
              ощущаться сильнее.
            </p>
          </article>
        </div>
      </div>

    </section>
  );
}
