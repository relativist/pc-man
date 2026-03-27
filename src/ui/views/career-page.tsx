import { getActivityProgress, useNow } from "../activity-progress";
import { InfoHint } from "../info-hint";
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
  const now = useNow();

  const currentVacancy = game.career.currentJobId
    ? game.world.activeVacancies.find((vacancy) => vacancy.id === game.career.currentJobId) ?? null
    : null;

  const searchResults = game.career.jobSearchResultIds
    .map((id) => game.world.activeVacancies.find((vacancy) => vacancy.id === id))
    .filter((vacancy): vacancy is NonNullable<typeof vacancy> => Boolean(vacancy));
  const jobSearchProgress = game.timers.jobSearch
    ? getActivityProgress(game.timers.jobSearch, now)
    : null;

  return (
    <section className="page-grid dense-grid">
      <div className="panel hero-headline wide-panel">
        <p className="eyebrow">Карьера</p>
        <div className="title-with-help">
          <h2>Работа и вакансии</h2>
          <InfoHint text="Здесь герой ищет офферы, выбирает компанию и двигается по карьерной лестнице." />
        </div>

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

      <div className="panel compact-panel wide-panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Текущая должность</h3>
              <InfoHint text="Основная работа не теряется, но можно искать более выгодную компанию." />
            </div>
          </div>
          <div className="badge-row">
            {game.career.jobSearchInProgress ? <span className="badge">Поиск идет</span> : null}
            {game.career.promotionAvailable ? <span className="badge">Можно просить повышение</span> : null}
            <button
              className="primary-button"
              onClick={() => actions.startJobSearch()}
              disabled={game.career.jobSearchInProgress}
            >
              Запустить поиск
            </button>
          </div>
        </div>

        {currentVacancy ? (
          <div className="order-card compact-card">
            <div className="order-meta">
              <span className="badge">{trackLabels[currentVacancy.track] ?? currentVacancy.track}</span>
              <span className="badge">ступень {currentVacancy.careerLevel}</span>
              {currentVacancy.isGolden ? <span className="badge gold-badge">gold</span> : null}
            </div>
            <h4>{currentVacancy.formalTitle}</h4>
            <p>{currentVacancy.funnyTitle}</p>
            <div className="pc-spec-list">
              <div className="stat-item">
                <strong>Компания</strong>
                <span>
                  {game.world.companies.find((company) => company.id === currentVacancy.companyId)?.name ??
                    currentVacancy.companyId}
                </span>
              </div>
              <div className="stat-item">
                <strong>База</strong>
                <span>${currentVacancy.baseSalary}</span>
              </div>
              <div className="stat-item">
                <strong>Итог</strong>
                <span>${currentVacancy.finalSalary}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted">
            Герой пока без работы. Ниже можно запустить поиск и выбрать один из офферов.
          </p>
        )}

        {game.timers.jobSearch && jobSearchProgress ? (
          <div className="timer-card">
            <strong>Активный поиск работы</strong>
            <div className="progress-bar">
              <div
                className="progress-fill progress-mid"
                style={{ width: `${jobSearchProgress.percent}%` }}
              />
            </div>
            <p>Прогресс: {jobSearchProgress.percent}%</p>
            <p className="muted">
              Осталось примерно {jobSearchProgress.remainingLabel}. Результаты появятся автоматически.
            </p>
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
          <div className="vacancy-grid">
            {searchResults.map((vacancy) => {
              const company = game.world.companies.find(
                (item) => item.id === vacancy.companyId,
              );

              return (
                <article key={vacancy.id} className="order-card compact-card vacancy-card">
                  <div className="order-meta">
                    <span className="badge">{trackLabels[vacancy.track] ?? vacancy.track}</span>
                    <span className="badge">ступень {vacancy.careerLevel}</span>
                    {vacancy.isGolden ? <span className="badge gold-badge">gold</span> : null}
                  </div>
                  <h4>{vacancy.formalTitle}</h4>
                  <p className="muted compact-copy">{vacancy.funnyTitle}</p>
                  <div className="pc-spec-list">
                    <div className="stat-item">
                      <strong>Компания</strong>
                      <span>{company?.name ?? vacancy.companyId}</span>
                    </div>
                    <div className="stat-item">
                      <strong>Оклад</strong>
                      <span>${vacancy.finalSalary}</span>
                    </div>
                    <div className="stat-item">
                      <strong>Нужен lvl</strong>
                      <span>{vacancy.requirements.requiredQualificationLevel}</span>
                    </div>
                    <div className="stat-item">
                      <strong>Нужен QP</strong>
                      <span>{vacancy.requirements.requiredQualificationPoints ?? 0}</span>
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
