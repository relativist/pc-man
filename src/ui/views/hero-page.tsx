import { useGameStore } from "../store-hooks";

const timerLabels = {
  learning: "Чтение",
  jobSearch: "Поиск работы",
  salaryCycle: "Зарплатный цикл",
  activeOrder: "Разовый заказ",
  walk: "Прогулка",
  healing: "Лечение",
} as const;

const housingLabels = {
  with_parents: "С родителями",
  rent: "Съемное жилье",
  own_home: "Свое жилье",
} as const;

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
  const livingPets = game.social.pets.filter((pet) => pet.isAlive);
  const propertyValue = game.player.propertyValue + game.player.realEstateValue;

  const indicators = [
    { label: "Здоровье", value: game.player.health },
    { label: "Голод", value: 100 - game.player.hunger },
    { label: "Спорт", value: game.player.fitness },
    { label: "Настроение", value: game.player.mood },
  ];

  const heroProfile = [
    { label: "Возраст", value: `${game.player.ageYears} лет` },
    { label: "Вес", value: `${game.player.weight} кг` },
    { label: "Образование", value: "IT-вышка" },
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
    game.player.weight >= 110
      ? {
          title: "Опасный вес",
          description: "Высокий вес должен бить по здоровью и ускорять проблемы с возрастом.",
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

  const activeTimers = Object.entries(game.timers)
    .filter((entry): entry is [keyof typeof timerLabels, NonNullable<(typeof game.timers)[keyof typeof game.timers]>] => Boolean(entry[1]))
    .map(([key, timer]) => ({
      key,
      label: timerLabels[key],
      startedAt: new Date(timer.startedAt).toLocaleString("ru-RU"),
      endsAt: new Date(timer.endsAt).toLocaleString("ru-RU"),
      referenceId: timer.referenceId,
    }));

  return (
    <section className="page-grid">
      <div className="panel hero-headline">
        <p className="eyebrow">Главная / Герой</p>
        <h2>{game.player.name}</h2>
        <p className="lede">
          Выпускник IT-направления, 21 год, стартует без работы, без собственного ПК и пока живет с родителями.
        </p>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Деньги</span>
            <strong>{game.player.money} K</strong>
          </div>
          <div>
            <span className="metric-label">Капитал</span>
            <strong>{game.player.capital} K</strong>
          </div>
          <div>
            <span className="metric-label">Имущество</span>
            <strong>{propertyValue} K</strong>
          </div>
          <div>
            <span className="metric-label">Жилье</span>
            <strong>{housingLabels[game.player.housingStatus]}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Жизненные показатели</h3>
        <div className="progress-list">
          {indicators.map((indicator) => (
            <div key={indicator.label} className="progress-row">
              <div className="progress-label">
                <span>{indicator.label}</span>
                <span>{indicator.value}%</span>
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

      <div className="panel">
        <h3>Базовые характеристики</h3>
        <div className="stat-list">
          {heroProfile.map((item) => (
            <div key={item.label} className="stat-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel wide-panel">
        <h3>Квалификации</h3>
        <div className="chips">
          {activeSpecialties.map((track) => (
            <div key={track.track} className="chip">
              <span>{track.track}</span>
              <strong>
                lvl {track.level} / {track.points} QP
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
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

      <div className="panel">
        <h3>Активные таймеры</h3>
        {activeTimers.length === 0 ? (
          <p className="muted">
            Сейчас нет активных процессов. Здесь появятся чтение, поиск работы, заказ, прогулка или лечение.
          </p>
        ) : (
          <div className="timer-list">
            {activeTimers.map((timer) => (
              <article key={timer.key} className="timer-card">
                <strong>{timer.label}</strong>
                <p>Старт: {timer.startedAt}</p>
                <p>Окончание: {timer.endsAt}</p>
                <p className="muted">Связанный объект: {timer.referenceId ?? "нет"}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel wide-panel">
        <h3>Журнал событий</h3>
        {game.logs.length === 0 ? (
          <p className="muted">
            Пока пусто. Здесь появятся завершенные заказы, провалы и другие игровые события.
          </p>
        ) : (
          <div className="log-list">
            {game.logs.slice(0, 8).map((entry) => (
              <article key={entry.id} className="log-item">
                <span className="log-kind">{entry.kind}</span>
                <p>{entry.message}</p>
                <time>{new Date(entry.at).toLocaleString("ru-RU")}</time>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
