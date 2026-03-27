import { getActivityProgress, useNow } from "../activity-progress";
import type { GameState } from "../../domain";
import {
  formatUiAgeYears,
  formatUiPercent,
  formatUiWeight,
  roundUiValue,
} from "../display-format";
import { InfoHint } from "../info-hint";
import { useGameStore } from "../store-hooks";

const housingLabels = {
  with_parents: "С родителями",
  rent: "Съемное жилье",
  own_home: "Свое жилье",
} as const;

const trackLabels: Record<string, string> = {
  qa: "QA",
  backend: "Backend",
  frontend: "Frontend",
  pm: "PM",
  pentester: "Pentester",
  analyst: "Analyst",
};

function getOwnedShopLot(
  game: GameState,
  section: "things" | "housing" | "transport",
) {
  const currentLotId = game.shop[section].currentLotId;
  return currentLotId
    ? game.world.shopCatalogs[section].find((lot) => lot.id === currentLotId) ?? null
    : null;
}

function getProgressTone(value: number): string {
  if (value >= 75) {
    return "good";
  }

  if (value >= 40) {
    return "mid";
  }

  return "bad";
}

function getRiskTone(severity: "low" | "mid" | "high"): string {
  if (severity === "high") {
    return "risk-high";
  }

  if (severity === "mid") {
    return "risk-mid";
  }

  return "risk-low";
}

export function HeroPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);
  const now = useNow();
  const livingPets = game.social.pets.filter((pet) => pet.isAlive);
  const propertyValue = game.player.propertyValue + game.player.realEstateValue;
  const currentHousing = getOwnedShopLot(game, "housing");
  const currentTransport = getOwnedShopLot(game, "transport");
  const currentThing = getOwnedShopLot(game, "things");
  const healingProgress = game.timers.healing
    ? getActivityProgress(game.timers.healing, now)
    : null;

  const indicators = [
    { label: "Здоровье", value: game.player.health },
    { label: "Голод", value: 100 - game.player.hunger },
    { label: "Спорт", value: game.player.fitness },
    { label: "Настроение", value: game.player.mood },
  ];

  const heroProfile = [
    { label: "Возраст", value: formatUiAgeYears(game.player.ageYears) },
    { label: "Вес", value: formatUiWeight(game.player.weight) },
    { label: "Образование", value: game.player.education },
    { label: "Жилье", value: housingLabels[game.player.housingStatus] },
    {
      label: "Семья",
      value: game.social.spouse
        ? `${game.social.spouse.name}, ${game.social.childrenCount} детей`
        : game.social.childrenCount > 0
          ? `${game.social.childrenCount} детей`
          : "Пока без семьи",
    },
    {
      label: "Питомцы",
      value:
        livingPets.length > 0
          ? `${livingPets.length} активных из ${game.social.pets.length}`
          : "Нет питомцев",
    },
  ];

  const activeSpecialties = Object.values(game.skills.tracks)
    .filter((track) => track.points > 0 || track.track === "qa")
    .sort((left, right) => right.points - left.points);

  const risks = [
    game.player.hunger >= 90
      ? {
          title: "Критический голод",
          description: "Герой близок к смертельному состоянию из-за голода.",
          severity: "high" as const,
        }
      : null,
    game.player.hunger >= 70 && game.player.hunger < 90
      ? {
          title: "Сильный голод",
          description: "Пора закладывать механику еды в быт, иначе состояние быстро ухудшится.",
          severity: "mid" as const,
        }
      : null,
    game.player.health <= 25
      ? {
          title: "Опасное здоровье",
          description: "Низкое здоровье повышает риск ранней смерти и требует лечения.",
          severity: "high" as const,
        }
      : null,
    game.player.health <= 45 && game.player.health > 25
      ? {
          title: "Здоровье проседает",
          description: "Нужны спорт, отдых или лечение, чтобы не свалиться в критическую зону.",
          severity: "mid" as const,
        }
      : null,
    game.player.weight > 100
      ? {
          title: "Смертельное ожирение",
          description: "Вес перевалил за 100 кг. По текущим правилам это мгновенный game over.",
          severity: "high" as const,
        }
      : game.player.weight >= 90
        ? {
            title: "Опасный вес",
            description: "Вес опасно близок к 100 кг. Пора срочно снижать его тренировками.",
            severity: "mid" as const,
        }
      : null,
    game.player.ageYears >= 75
      ? {
          title: "Риск старости",
          description: "Возраст уже высокий, без поддержки здоровья герой быстрее выйдет в game over.",
          severity: "high" as const,
        }
      : null,
    game.player.ageYears >= 60 && game.player.ageYears < 75
      ? {
          title: "Старение усиливается",
          description: "Нужно следить за лечением и формой, чтобы не попасть в поздние риски.",
          severity: "low" as const,
        }
      : null,
  ].filter((risk): risk is NonNullable<typeof risk> => Boolean(risk));

  return (
    <section className="page-grid dense-grid">
      <div className="panel hero-headline wide-panel">
        <p className="eyebrow">Главная / Герой</p>
        <div className="title-with-help">
          <h2>{game.player.name}</h2>
          <InfoHint text="Герой строит карьеру, собирает активы и постепенно меняет уровень жизни от стартового быта к более солидной версии себя." />
        </div>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Деньги</span>
            <strong>${game.player.money}</strong>
          </div>
          <div>
            <span className="metric-label">Капитал</span>
            <strong>${game.player.capital}</strong>
          </div>
          <div>
            <span className="metric-label">Имущество</span>
            <strong>${propertyValue}</strong>
          </div>
          <div>
            <span className="metric-label">Жилье</span>
            <strong>{housingLabels[game.player.housingStatus]}</strong>
          </div>
        </div>
      </div>

      <div className="hero-column-stack">
        <div className="panel compact-panel">
          <h3>Жизненные показатели</h3>
          <div className="progress-list">
            {indicators.map((indicator) => (
              <div key={indicator.label} className="progress-row">
                <div className="progress-label">
                  <span>{indicator.label}</span>
                  <span>{formatUiPercent(indicator.value)}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill progress-${getProgressTone(indicator.value)}`}
                    style={{ width: `${indicator.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel compact-panel">
          <div className="section-head">
            <div>
              <div className="title-with-help">
                <h3>Повседневные действия</h3>
                <InfoHint text="Минимальный слой быта для MVP." />
              </div>
            </div>
          </div>
          <div className="order-list life-action-list hero-action-list">
            <article className="order-card compact-card">
              <div className="title-with-help">
                <h4>Поесть</h4>
                <InfoHint text="Снимает голод, слегка повышает здоровье и настроение." />
              </div>
              <button
                className="primary-button"
                onClick={() => actions.eatMeal()}
                disabled={game.player.money < 35}
              >
                Поесть за $35
              </button>
            </article>
            <article className="order-card compact-card">
              <div className="title-with-help">
                <h4>Тренировка</h4>
                <InfoHint text="Улучшает форму и здоровье, уменьшает вес, но повышает голод." />
              </div>
              <button className="primary-button" onClick={() => actions.doWorkout()}>
                Сделать тренировку
              </button>
            </article>
            <article className="order-card compact-card">
              <div className="title-with-help">
                <h4>Дорогое лечение</h4>
                <InfoHint text="Идет по таймеру и после завершения автоматически омолаживает героя на 10 лет." />
              </div>
              <div className="shop-actions compact-actions">
                {healingProgress ? (
                  <div
                    className="healing-ring"
                    style={{
                      background: `conic-gradient(#7fda89 ${healingProgress.percent}%, rgba(255, 255, 255, 0.08) ${healingProgress.percent}% 100%)`,
                    }}
                  >
                    <div className="healing-ring-inner">
                      <strong>{roundUiValue(healingProgress.percent)}%</strong>
                    </div>
                  </div>
                ) : null}
                <button
                  className="primary-button"
                  onClick={() => actions.startHealing()}
                  disabled={Boolean(game.timers.healing) || game.player.money < 650}
                >
                  Начать лечение за $650
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className="panel compact-panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Базовые характеристики и имущество</h3>
              <InfoHint text="Здесь собраны основные параметры героя и его крупные покупки из магазина." />
            </div>
          </div>
        </div>
        <div className="pc-spec-list">
          {heroProfile.map((item) => (
            <div key={item.label} className="stat-item">
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          ))}
          <div className="stat-item">
            <strong>Жилье</strong>
            <span>{currentHousing?.title ?? "Пока без покупки"}</span>
          </div>
          <div className="stat-item">
            <strong>Транспорт</strong>
            <span>{currentTransport?.title ?? "Пока пешком"}</span>
          </div>
          <div className="stat-item">
            <strong>Крутая вещь</strong>
            <span>{currentThing?.title ?? "Пусто"}</span>
          </div>
        </div>
      </div>

      <div className="hero-side-stack">
        <div className="panel compact-panel">
          <h3>Риски</h3>
          {risks.length === 0 ? (
            <p className="muted">
              Критических рисков сейчас нет. Герой находится в стабильном состоянии.
            </p>
          ) : (
            <div className="risk-list">
              {risks.map((risk) => (
                <article key={risk.title} className={`risk-card ${getRiskTone(risk.severity)}`}>
                  <strong>{risk.title}</strong>
                  <p>{risk.description}</p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="panel compact-panel">
          <h3>Квалификации</h3>
          <div className="pc-spec-list">
            {activeSpecialties.map((track) => (
              <div key={track.track} className="stat-item">
                <strong>{trackLabels[track.track] ?? track.track}</strong>
                <span>
                  lvl {track.level} / {track.points} QP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
