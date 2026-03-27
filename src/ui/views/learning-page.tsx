import { getActivityProgress, useNow } from "../activity-progress";
import { formatUiPercent } from "../display-format";
import { InfoHint } from "../info-hint";
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

type LearningTrack = (typeof learningTracks)[number];

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

type TrackGridEntry =
  | {
      kind: "available";
      track: LearningTrack;
      entry: CatalogEntry;
    }
  | {
      kind: "blocked";
      track: LearningTrack;
      entry: CatalogEntry;
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
  const queuedOwnedEntries = catalog.filter(
    (entry) => entry.isOwned && !entry.isCompleted && !entry.isReading,
  );
  const blockingEntry = activeEntry ?? queuedOwnedEntries[0] ?? null;
  const queuedBook = queuedOwnedEntries[0]?.book ?? null;
  const learningProgress = game.timers.learning
    ? getActivityProgress(game.timers.learning, now)
    : null;
  const trackGridEntries = learningTracks
    .map((track) => {
      const pendingTrackEntry =
        catalog.find(
          (entry) => entry.book.track === track && entry.isOwned && !entry.isCompleted,
        ) ?? null;

      if (pendingTrackEntry) {
        return {
          kind: "blocked" as const,
          track,
          entry: pendingTrackEntry,
        };
      }

      const availableEntry =
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
          })[0] ?? null;

      if (!availableEntry) {
        return null;
      }

      return {
        kind: "available" as const,
        track,
        entry: availableEntry,
      };
    })
    .filter((entry): entry is TrackGridEntry => Boolean(entry));
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

        <div className="pc-spec-list">
          <div className="stat-item">
            <strong>Цена</strong>
            <span>${entry.book.price}</span>
          </div>
          <div className="stat-item">
            <strong>Срок</strong>
            <span>{entry.book.durationDays} дн.</span>
          </div>
          <div className="stat-item">
            <strong>QP</strong>
            <span>+{entry.book.qualificationPoints} QP</span>
          </div>
        </div>

        {!entry.isAvailable && !entry.isOwned ? (
          <p className="muted">Сначала нужно добрать нужную квалификацию.</p>
        ) : null}

        {options ? (
          <div className="shop-actions">
            <button
              className="primary-button"
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
      <div className="panel hero-headline learning-summary-panel">
        <p className="eyebrow">Обучение</p>
        <div className="title-with-help">
          <h2>Книги и рост квалификации</h2>
          <InfoHint text="Покупка книги сразу запускает чтение. Пока текущая книга не завершена, следующую купить нельзя." />
        </div>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Деньги</span>
            <strong>${game.player.money}</strong>
          </div>
          <div>
            <span className="metric-label">По трекам</span>
            <strong>{trackGridEntries.length}</strong>
          </div>
          <div>
            <span className="metric-label">Прочитано</span>
            <strong>{completedEntriesCount}</strong>
          </div>
        </div>
      </div>

      <div className="panel learning-current-panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Текущее чтение</h3>
              <InfoHint text="В библиотеке всегда только одна незавершенная книга." />
            </div>
          </div>
          <span className="badge">{activeBook ? "Авточтение" : "Свободно"}</span>
        </div>

        {activeBook && learningProgress ? (
          <div className="timer-card learning-current-card">
            <strong>{activeBook.title}</strong>
            <p className="muted">
              {trackTitles[activeBook.track] ?? activeBook.track} · +{activeBook.qualificationPoints} QP
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill progress-good"
                style={{ width: `${learningProgress.percent}%` }}
              />
            </div>
            <p className="muted">
              Прогресс: {formatUiPercent(learningProgress.percent)}. Осталось примерно {learningProgress.remainingLabel}.
            </p>
          </div>
        ) : queuedBook ? (
          <div className="timer-card learning-current-card">
            <strong>{queuedBook.title}</strong>
            <p className="muted">
              Книга уже куплена и ждёт запуска. Пока она не завершена, следующую купить нельзя.
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
          <div className="timer-card learning-current-card">
            <strong>Сейчас свободно</strong>
            <p className="muted">
              Выбери книгу ниже. После покупки она сразу перейдёт в текущее чтение.
            </p>
          </div>
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
            <div className="title-with-help">
              <h3>Книги по трекам</h3>
              <InfoHint text="В каждом направлении показывается только ближайшая доступная книга. Закрытые книги не выводятся." />
            </div>
          </div>
          <span className="badge">{trackGridEntries.length} на экране</span>
        </div>

        <p className="muted">
          {blockingEntry
            ? "Покупка новых книг заблокирована, пока не завершена текущая."
            : "Книги идут по возрастанию уровня внутри каждого трека."}
        </p>

        {trackGridEntries.length > 0 ? (
          <div className="book-grid">
            {trackGridEntries.map((trackEntry) =>
              trackEntry.kind === "available"
                ? renderBookCard(trackEntry.entry, {
                    actionLabel: "Купить и читать",
                    actionDisabled: Boolean(blockingEntry) || game.player.money < trackEntry.entry.book.price,
                    actionHint:
                      !blockingEntry && game.player.money < trackEntry.entry.book.price
                        ? "Не хватает денег"
                        : undefined,
                    onAction: () => actions.buyBook(trackEntry.entry.book.id),
                  })
                : renderBookCard(trackEntry.entry, {
                    actionLabel: "Ожидает чтения",
                    actionDisabled: true,
                    onAction: () => undefined,
                  }),
            )}
          </div>
        ) : (
          <p className="muted">Сейчас нет новых книг, которые можно купить прямо сейчас.</p>
        )}
      </div>

      <div className="panel wide-panel">
        <div className="title-with-help">
          <h3>Архив</h3>
          <InfoHint text="Вместо длинного списка здесь только короткая сводка по прочитанному." />
        </div>

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
      </div>
    </section>
  );
}
