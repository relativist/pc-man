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

export function LearningPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);

  const activeBook = game.learning.activeBookId
    ? game.world.availableBooks.find((book) => book.id === game.learning.activeBookId) ?? null
    : null;

  const qualificationCards = Object.values(game.skills.tracks).sort(
    (left, right) => right.points - left.points,
  );

  const catalog = game.world.availableBooks.map((book) => {
    const isOwned = game.learning.ownedBookIds.includes(book.id);
    const isCompleted = game.learning.completedBookIds.includes(book.id);
    const isReading = game.learning.activeBookId === book.id;
    const isAvailable = game.learning.availableBookIds.includes(book.id);

    return {
      book,
      isOwned,
      isCompleted,
      isReading,
      isAvailable,
    };
  });

  return (
    <section className="page-grid">
      <div className="panel hero-headline">
        <p className="eyebrow">Обучение</p>
        <h2>Книги и рост квалификации</h2>
        <p className="lede">
          Здесь герой покупает материалы, запускает чтение и набирает QP для повышения квалификации.
        </p>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Деньги</span>
            <strong>{game.player.money} K</strong>
          </div>
          <div>
            <span className="metric-label">Куплено книг</span>
            <strong>{game.learning.ownedBookIds.length}</strong>
          </div>
          <div>
            <span className="metric-label">Прочитано</span>
            <strong>{game.learning.completedBookIds.length}</strong>
          </div>
          <div>
            <span className="metric-label">Активное чтение</span>
            <strong>{activeBook ? activeBook.title : "Нет"}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Текущее чтение</h3>
            <p className="muted">Одновременно читается только одна книга.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => actions.completeActiveBook()}
            disabled={!activeBook}
          >
            Завершить книгу
          </button>
        </div>

        {activeBook ? (
          <div className="timer-card">
            <strong>{activeBook.title}</strong>
            <p>{activeBook.funnyTitle}</p>
            <p>Трек: {trackTitles[activeBook.track] ?? activeBook.track}</p>
            <p>QP: +{activeBook.qualificationPoints}</p>
            <p>
              Таймер: {game.timers.learning?.startedAt ?? "не запущен"} →{" "}
              {game.timers.learning?.endsAt ?? "не запущен"}
            </p>
          </div>
        ) : (
          <p className="muted">
            Сейчас книга не читается. Купи материал ниже и запусти обучение.
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
        <h3>Каталог книг</h3>
        <div className="order-list">
          {catalog.map(({ book, isOwned, isCompleted, isReading, isAvailable }) => (
            <article key={book.id} className="order-card">
              <div className="order-meta">
                <span className="badge">{trackTitles[book.track] ?? book.track}</span>
                <span className="badge">lvl {book.level}</span>
                {isCompleted ? <span className="badge">done</span> : null}
                {isOwned && !isCompleted ? <span className="badge">owned</span> : null}
              </div>
              <h4>{book.title}</h4>
              <p>{book.funnyTitle}</p>
              <div className="stat-list compact-stats">
                <div className="stat-item">
                  <span>Цена</span>
                  <strong>{book.price} K</strong>
                </div>
                <div className="stat-item">
                  <span>Длительность</span>
                  <strong>{book.durationDays} дн.</strong>
                </div>
                <div className="stat-item">
                  <span>Награда</span>
                  <strong>+{book.qualificationPoints} QP</strong>
                </div>
              </div>

              {!isAvailable ? (
                <p className="muted">Пока закрыто по требованиям квалификации.</p>
              ) : null}

              <div className="shop-actions">
                {!isOwned ? (
                  <button
                    className="primary-button"
                    onClick={() => actions.buyBook(book.id)}
                    disabled={!isAvailable || game.player.money < book.price}
                  >
                    Купить
                  </button>
                ) : (
                  <button
                    className="secondary-button"
                    onClick={() => actions.startReadingBook(book.id)}
                    disabled={isCompleted || isReading || Boolean(game.learning.activeBookId)}
                  >
                    {isReading ? "Читается" : isCompleted ? "Прочитано" : "Читать"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
