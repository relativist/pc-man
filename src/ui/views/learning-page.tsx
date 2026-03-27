import { getActivityProgress, useNow } from "../activity-progress";
import { useGameStore } from "../store-hooks";

const trackTitles: Record<string, string> = {
  qa: "QA",
  backend: "Backend",
  frontend: "Frontend",
  pm: "PM",
  pentester: "Pentester",
  analyst: "Analyst",
  universal: "Universal",
  cto: "CTO",
};

const learningTracks = [
  "universal",
  "qa",
  "backend",
  "frontend",
  "pm",
  "analyst",
  "pentester",
  "cto",
] as const;

type CatalogEntry = {
  book: {
    id: string;
    title: string;
    funnyTitle: string;
    track: string;
    level: number;
    price: number;
    durationDays: number;
    qualificationPoints: number;
  };
  catalogIndex: number;
  isOwned: boolean;
  isCompleted: boolean;
  isReading: boolean;
  isAvailable: boolean;
};

export function LearningPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);
  const now = useNow();

  const qualificationCards = Object.values(game.skills.tracks).sort(
    (left, right) => right.points - left.points,
  );

  const catalog: CatalogEntry[] = game.world.availableBooks.map((book, catalogIndex) => {
    const isOwned = game.learning.ownedBookIds.includes(book.id);
    const isCompleted = game.learning.completedBookIds.includes(book.id);
    const isReading = game.learning.activeBookId === book.id;
    const isAvailable = game.learning.availableBookIds.includes(book.id);

    return {
      book,
      catalogIndex,
      isOwned,
      isCompleted,
      isReading,
      isAvailable,
    };
  });

  const activeEntry = catalog.find((entry) => entry.isReading) ?? null;
  const activeBook = activeEntry?.book ?? null;
  const queuedOwnedEntries = catalog.filter((entry) => entry.isOwned && !entry.isCompleted && !entry.isReading);
  const blockingEntry = activeEntry ?? queuedOwnedEntries[0] ?? null;
  const queuedBook = queuedOwnedEntries[0]?.book ?? null;
  const learningProgress = game.timers.learning
    ? getActivityProgress(game.timers.learning, now)
    : null;
  const availableTrackEntries = learningTracks
    .map((track) => {
      const hasPendingTrackBook = catalog.some(
        (entry) => entry.book.track === track && entry.isOwned && !entry.isCompleted,
      );

      if (hasPendingTrackBook) {
        return null;
      }

      return (
        catalog
          .filter(
            (entry) =>
              entry.book.track === track &&
              entry.isAvailable &&
              !entry.isOwned &&
              !entry.isCompleted,
          )
          .sort((left, right) => {
            if (left.book.level !== right.book.level) {
              return left.book.level - right.book.level;
            }

            return left.catalogIndex - right.catalogIndex;
          })[0] ?? null
      );
    })
    .filter((entry): entry is CatalogEntry => Boolean(entry));
  const completedCountByTrack = learningTracks
    .map((track) => ({
      track,
      count: catalog.filter((entry) => entry.book.track === track && entry.isCompleted).length,
    }))
    .filter((item) => item.count > 0);
  const completedEntriesCount = catalog.filter((entry) => entry.isCompleted).length;

  function renderBookCard(
    entry: CatalogEntry,
    options?: {
      actionLabel: string;
      actionKind: "primary" | "secondary";
      actionDisabled?: boolean;
      actionHint?: string;
      onAction: () => void;
    },
  ) {
    const statusBadges = [];

    if (entry.isReading) {
      statusBadges.push("Читается");
    } else if (entry.isCompleted) {
      statusBadges.push("Прочитано");
    } else if (entry.isOwned) {
      statusBadges.push("Куплена");
    } else if (entry.isAvailable) {
      statusBadges.push("Можно купить");
    } else {
      statusBadges.push("Закрыто");
    }

    return (
      <article key={entry.book.id} className="order-card compact-card">
        <div className="order-meta">
          <span className="badge">{trackTitles[entry.book.track] ?? entry.book.track}</span>
          <span className="badge">lvl {entry.book.level}</span>
          {statusBadges.map((badge) => (
            <span key={badge} className="badge">
              {badge}
            </span>
          ))}
        </div>

        <h4>{entry.book.title}</h4>
        <p className="muted compact-copy">{entry.book.funnyTitle}</p>

        <div className="stat-list compact-stats compact-book-stats">
          <div className="stat-item">
            <span>$</span>
            <strong>${entry.book.price}</strong>
          </div>
          <div className="stat-item">
            <span>Срок</span>
            <strong>{entry.book.durationDays} дн.</strong>
          </div>
          <div className="stat-item">
            <span>QP</span>
            <strong>+{entry.book.qualificationPoints} QP</strong>
          </div>
        </div>

        {!entry.isAvailable && !entry.isOwned ? (
          <p className="muted">Сначала нужно добрать нужную квалификацию.</p>
        ) : null}

        {options ? (
          <div className="shop-actions">
            <button
              className={options.actionKind === "primary" ? "primary-button" : "secondary-button"}
              onClick={options.onAction}
              disabled={options.actionDisabled}
            >
              {options.actionLabel}
            </button>
            {options.actionHint ? <p className="muted">{options.actionHint}</p> : null}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel hero-headline">
        <p className="eyebrow">Обучение</p>
        <h2>Книги и рост квалификации</h2>
        <p className="lede">
          Покупка книги сразу запускает чтение. Пока текущая книга не завершена, следующую купить
          нельзя.
        </p>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Деньги</span>
            <strong>${game.player.money}</strong>
          </div>
          <div>
            <span className="metric-label">По трекам</span>
            <strong>{availableTrackEntries.length}</strong>
          </div>
          <div>
            <span className="metric-label">Прочитано</span>
            <strong>{completedEntriesCount}</strong>
          </div>
          <div>
            <span className="metric-label">Текущая книга</span>
            <strong>{activeBook ? activeBook.title : queuedBook ? queuedBook.title : "Нет"}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Текущее чтение</h3>
            <p className="muted">В библиотеке всегда только одна незавершенная книга.</p>
          </div>
          <span className="badge">{activeBook ? "Авточтение" : "Свободно"}</span>
        </div>

        {activeBook && learningProgress ? (
          <div className="timer-card">
            <strong>{activeBook.title}</strong>
            <p>{activeBook.funnyTitle}</p>
            <p>Трек: {trackTitles[activeBook.track] ?? activeBook.track}</p>
            <p>QP: +{activeBook.qualificationPoints}</p>
            <div className="progress-bar">
              <div
                className="progress-fill progress-good"
                style={{ width: `${learningProgress.percent}%` }}
              />
            </div>
            <p>Прогресс: {learningProgress.percent}%</p>
            <p className="muted">
              Осталось примерно {learningProgress.remainingLabel}. Книга завершится автоматически.
            </p>
          </div>
        ) : queuedBook ? (
          <div className="timer-card">
            <strong>{queuedBook.title}</strong>
            <p>{queuedBook.funnyTitle}</p>
            <p className="muted">
              Книга уже куплена в сохранении, но еще не читалась. Сначала дочитай ее, потом покупай
              следующую.
            </p>
            <div className="shop-actions">
              <button
                className="primary-button"
                onClick={() => actions.startReadingBook(queuedBook.id)}
              >
                Начать читать
              </button>
            </div>
          </div>
        ) : (
          <p className="muted">
            Свободно. Выбери книгу из доступных ниже: покупка сразу переведет ее в active reading.
          </p>
        )}
      </div>

      <div className="panel wide-panel">
        <h3>Квалификации</h3>
        <div className="chips">
          {qualificationCards.map((track) => (
            <div key={track.track} className="chip">
              <span>{trackTitles[track.track] ?? track.track}</span>
              <strong>
                lvl {track.level} / {track.points} QP
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel wide-panel">
        <div className="section-head">
          <div>
            <h3>Книги по трекам</h3>
            <p className="muted">
              В каждом направлении показывается только ближайшая доступная книга. Закрытые книги не
              выводятся.
            </p>
          </div>
          <span className="badge">{availableTrackEntries.length} на экране</span>
        </div>

        <div className="learning-section-grid">
          <section className="learning-section">
            <h4>Доступно</h4>
            <p className="muted">
              {blockingEntry
                ? "Покупка новых книг заблокирована, пока не завершена текущая."
                : "Книги идут по возрастанию уровня внутри каждого трека."}
            </p>

            {availableTrackEntries.length > 0 ? (
              <div className="order-list">
                {availableTrackEntries.map((entry) =>
                  renderBookCard(entry, {
                    actionLabel: "Купить и читать",
                    actionKind: "primary",
                    actionDisabled: Boolean(blockingEntry) || game.player.money < entry.book.price,
                    actionHint: blockingEntry
                      ? `Сначала заверши: ${blockingEntry.book.title}`
                      : game.player.money < entry.book.price
                        ? "Не хватает денег"
                        : undefined,
                    onAction: () => actions.buyBook(entry.book.id),
                  }),
                )}
              </div>
            ) : (
              <p className="muted">Сейчас нет новых книг, которые можно купить прямо сейчас.</p>
            )}
          </section>

          <section className="learning-section">
            <h4>Куплены, но не завершены</h4>
            <p className="muted">
              Здесь лежит текущая книга и редкие старые покупки из сохранений до нового flow.
            </p>

            {activeEntry || queuedOwnedEntries.length > 0 ? (
              <div className="order-list">
                {activeEntry ? renderBookCard(activeEntry) : null}
                {queuedOwnedEntries.map((entry) =>
                  renderBookCard(entry, {
                    actionLabel: "Начать читать",
                    actionKind: "secondary",
                    onAction: () => actions.startReadingBook(entry.book.id),
                  }),
                )}
              </div>
            ) : (
              <p className="muted">Незавершенных книг нет.</p>
            )}
          </section>

          <section className="learning-section">
            <h4>Архив</h4>
            <p className="muted">Вместо длинного списка здесь только короткая сводка по прочитанному.</p>

            {completedCountByTrack.length > 0 ? (
              <div className="chips">
                {completedCountByTrack.map((item) => (
                  <div key={item.track} className="chip">
                    <span>{trackTitles[item.track] ?? item.track}</span>
                    <strong>{item.count} проч.</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Пока нет завершенных книг.</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
