import { useGameStore } from "../store-hooks";

const trackLabels: Record<string, string> = {
  qa: "QA",
  backend: "Backend",
  frontend: "Frontend",
  pm: "PM",
  pentester: "Pentester",
  analyst: "Analyst",
  cto: "CTO",
};

export function CareerPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);

  const currentVacancy = game.career.currentJobId
    ? game.world.activeVacancies.find((vacancy) => vacancy.id === game.career.currentJobId) ?? null
    : null;

  const searchResults = game.career.jobSearchResultIds
    .map((id) => game.world.activeVacancies.find((vacancy) => vacancy.id === id))
    .filter((vacancy): vacancy is NonNullable<typeof vacancy> => Boolean(vacancy));

  return (
    <section className="page-grid">
      <div className="panel hero-headline">
        <p className="eyebrow">Карьера</p>
        <h2>Работа и вакансии</h2>
        <p className="lede">
          Здесь герой ищет офферы, выбирает компанию и двигается по карьерной лестнице.
        </p>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Статус</span>
            <strong>
              {game.career.employmentStatus === "employed" ? "Трудоустроен" : "Безработный"}
            </strong>
          </div>
          <div>
            <span className="metric-label">Текущий трек</span>
            <strong>
              {game.career.currentTrack ? trackLabels[game.career.currentTrack] : "Не выбран"}
            </strong>
          </div>
          <div>
            <span className="metric-label">Зарплата</span>
            <strong>${game.career.monthlySalaryActual ?? 0}/мес</strong>
          </div>
          <div>
            <span className="metric-label">Офферов</span>
            <strong>{searchResults.length}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Текущая должность</h3>
            <p className="muted">Основная работа не теряется, но можно искать более выгодную компанию.</p>
          </div>
          <div className="badge-row">
            <span className="badge">
              {game.career.jobSearchInProgress ? "Поиск идет" : "Поиск не идет"}
            </span>
            <span className="badge">
              {game.career.promotionAvailable ? "Можно просить повышение" : "Повышение не открыто"}
            </span>
          </div>
        </div>

        {currentVacancy ? (
          <div className="order-card">
            <div className="order-meta">
              <span className="badge">{trackLabels[currentVacancy.track] ?? currentVacancy.track}</span>
              <span className="badge">ступень {currentVacancy.careerLevel}</span>
              {currentVacancy.isGolden ? <span className="badge gold-badge">gold</span> : null}
            </div>
            <h4>{currentVacancy.formalTitle}</h4>
            <p>{currentVacancy.funnyTitle}</p>
            <div className="stat-list compact-stats">
              <div className="stat-item">
                <span>Компания</span>
                <strong>
                  {game.world.companies.find((company) => company.id === currentVacancy.companyId)?.name ??
                    currentVacancy.companyId}
                </strong>
              </div>
              <div className="stat-item">
                <span>База</span>
                <strong>${currentVacancy.baseSalary}</strong>
              </div>
              <div className="stat-item">
                <span>Итог</span>
                <strong>${currentVacancy.finalSalary}</strong>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted">
            Герой пока без работы. Ниже можно запустить поиск и выбрать один из офферов.
          </p>
        )}
      </div>

      <div className="panel wide-panel">
        <div className="section-head">
          <div>
            <h3>Поиск работы</h3>
            <p className="muted">
              Поиск занимает 1-3 игровых дня и должен принести от 1 до 3 вакансий.
            </p>
          </div>
          <div className="badge-row">
            <button
              className="secondary-button"
              onClick={() => actions.startJobSearch()}
              disabled={game.career.jobSearchInProgress}
            >
              Запустить поиск
            </button>
            <button
              className="primary-button"
              onClick={() => actions.completeJobSearch()}
              disabled={!game.career.jobSearchInProgress}
            >
              Завершить поиск
            </button>
          </div>
        </div>

        {game.timers.jobSearch ? (
          <div className="timer-card">
            <strong>Активный поиск работы</strong>
            <p>Старт: {new Date(game.timers.jobSearch.startedAt).toLocaleString("ru-RU")}</p>
            <p>Окончание: {new Date(game.timers.jobSearch.endsAt).toLocaleString("ru-RU")}</p>
          </div>
        ) : (
          <p className="muted">Сейчас таймер поиска работы не запущен.</p>
        )}
      </div>

      <div className="panel wide-panel">
        <h3>Найденные вакансии</h3>
        {searchResults.length === 0 ? (
          <div className="empty-state">
            <h4>Пока нет офферов</h4>
            <p>
              Запусти поиск работы. После завершения здесь появятся вакансии от разных компаний.
            </p>
          </div>
        ) : (
          <div className="order-list">
            {searchResults.map((vacancy) => {
              const company = game.world.companies.find(
                (item) => item.id === vacancy.companyId,
              );

              return (
                <article key={vacancy.id} className="order-card">
                  <div className="order-meta">
                    <span className="badge">{trackLabels[vacancy.track] ?? vacancy.track}</span>
                    <span className="badge">ступень {vacancy.careerLevel}</span>
                    {vacancy.isGolden ? <span className="badge gold-badge">gold</span> : null}
                  </div>
                  <h4>{vacancy.formalTitle}</h4>
                  <p>{vacancy.funnyTitle}</p>
                  <div className="stat-list compact-stats">
                    <div className="stat-item">
                      <span>Компания</span>
                      <strong>{company?.name ?? vacancy.companyId}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Оклад</span>
                      <strong>${vacancy.finalSalary}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Мин. lvl</span>
                      <strong>{vacancy.requirements.requiredQualificationLevel}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Мин. QP</span>
                      <strong>{vacancy.requirements.requiredQualificationPoints ?? 0}</strong>
                    </div>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => actions.acceptVacancy(vacancy.id)}
                  >
                    Принять оффер
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
