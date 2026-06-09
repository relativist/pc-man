import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import type { GameState, PendingSocialEncounter } from "../../domain";
import { formatUiAgeYears } from "../display-format";
import { useGameStore } from "../store-hooks";

const navItems = [
  { to: "/hero", label: "Герой", code: "ID" },
  { to: "/pc", label: "ПК и Заказы", code: "PC" },
  { to: "/shop", label: "Магазин", code: "MK" },
  { to: "/career", label: "Карьера", code: "CV" },
  { to: "/learning", label: "Обучение", code: "XP" },
  { to: "/social", label: "Соцжизнь", code: "NET" },
];

const trackTitles: Record<string, string> = {
  qa: "QA",
  backend: "Backend",
  frontend: "Frontend",
  pm: "PM",
  pentester: "Pentester",
  analyst: "Analyst",
};

const passiveLifeSettleIntervalMs = 10_000;

function formatBuildDate(buildDateIso: string): string {
  const buildDate = new Date(buildDateIso);

  return Number.isNaN(buildDate.getTime())
    ? buildDateIso
    : new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(buildDate);
}

function getEncounterName(encounter: PendingSocialEncounter): string {
  if (encounter.kind === "friend") {
    return encounter.friend.name;
  }

  if (encounter.kind === "spouse") {
    return encounter.spouse.name;
  }

  return `${encounter.pet.species} ${encounter.pet.name}`;
}

function getEncounterBadge(encounter: PendingSocialEncounter): string {
  if (encounter.kind === "friend") {
    return "Друг";
  }

  if (encounter.kind === "spouse") {
    return "Супруга";
  }

  return "Питомец";
}

function getGameOverReasonLabel(reason: string | null): string {
  if (reason === "hunger") {
    return "Голод";
  }

  if (reason === "obesity") {
    return "Ожирение";
  }

  if (reason === "illness") {
    return "Критическое здоровье";
  }

  if (reason === "old_age") {
    return "Старость";
  }

  return "Неизвестная причина";
}

type DeathRiskWarning = {
  key: string;
  eyebrow: string;
  title: string;
  message: string;
  advice: string;
};

function getDeathRiskWarning(game: GameState): DeathRiskWarning | null {
  if (game.meta.isGameOver || !game.player.isAlive) {
    return null;
  }

  if (game.player.hunger >= 90) {
    return {
      key: "hunger-critical",
      eyebrow: "Риск смерти",
      title: "Критический голод",
      message: `Голод достиг ${game.player.hunger}%. Герой близок к смерти от истощения.`,
      advice: "Срочно покорми героя. Иначе следующий прогон времени может закончиться смертью от голода.",
    };
  }

  if (game.player.health <= 25) {
    return {
      key: "health-critical",
      eyebrow: "Риск смерти",
      title: "Критическое здоровье",
      message: `Здоровье упало до ${game.player.health}%. Организм уже на грани отказа.`,
      advice: "Нужно быстро поднять здоровье: лечение в приоритете, дальше еда и восстановление формы.",
    };
  }

  if (game.player.weight >= 95) {
    return {
      key: game.player.weight >= 100 ? "weight-critical" : "weight-danger",
      eyebrow: "Риск смерти",
      title: "Опасный вес",
      message: `Вес героя ${game.player.weight.toFixed(1)} кг. До смертельного ожирения осталось совсем немного.`,
      advice: "Останови набор веса: меньше еды без необходимости, больше тренировок и контроль здоровья.",
    };
  }

  if (game.player.ageYears >= 85) {
    return {
      key: "age-critical",
      eyebrow: "Риск смерти",
      title: "Критический возраст",
      message: `Герою уже ${formatUiAgeYears(game.player.ageYears)}. Любое проседание здоровья теперь особенно опасно.`,
      advice: "Держи здоровье высоким и не откладывай дорогое лечение, чтобы не поймать смерть от старости.",
    };
  }

  if (game.player.hunger >= 70) {
    return {
      key: "hunger-danger",
      eyebrow: "Предупреждение",
      title: "Сильный голод",
      message: `Голод уже ${game.player.hunger}%. Если запустить это состояние, герой умрет от голода.`,
      advice: "Поесть сейчас дешевле, чем потом разгребать критическое здоровье.",
    };
  }

  if (game.player.health <= 45) {
    return {
      key: "health-danger",
      eyebrow: "Предупреждение",
      title: "Здоровье проседает",
      message: `Здоровье упало до ${game.player.health}%. Следующий виток ухудшения может стать критическим.`,
      advice: "Подними здоровье заранее: лечение, еда и нормальный ритм жизни сейчас важнее прокачки.",
    };
  }

  return null;
}

export function AppLayout() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);
  const [isNotificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [dismissedDeathRiskKey, setDismissedDeathRiskKey] = useState<string | null>(null);
  const previousUnreadCountRef = useRef(0);
  const notificationAutoOpenedRef = useRef(false);

  const { player, career, pc, orders, timers, logs, social, meta } = game;
  const pendingEncounter = social.pendingEncounters[0] ?? null;
  const lastViewedLogAtMs = meta.lastViewedLogAt ? new Date(meta.lastViewedLogAt).getTime() : 0;
  const unreadLogs = logs.filter((entry) => new Date(entry.at).getTime() > lastViewedLogAtMs);
  const unreadCount = unreadLogs.length;
  const latestLogAt = logs[0]?.at ?? null;
  const deathRiskWarning = getDeathRiskWarning(game);
  const isIntroModalOpen = !meta.hasSeenIntro;
  const isDeathRiskModalOpen =
    Boolean(deathRiskWarning) && deathRiskWarning?.key !== dismissedDeathRiskKey;
  const buildLabel = formatBuildDate(__APP_BUILD_DATE__);

  useEffect(() => {
    actions.settleToNow();
  }, [actions]);

  useEffect(() => {
    const dueTimers = Object.values(timers).filter(
      (timer): timer is NonNullable<(typeof timers)[keyof typeof timers]> => Boolean(timer),
    );

    if (dueTimers.length === 0) {
      return undefined;
    }

    const nextDueAt = dueTimers.reduce((earliest, timer) => {
      const endsAt = new Date(timer.endsAt).getTime();
      return endsAt < earliest ? endsAt : earliest;
    }, new Date(dueTimers[0].endsAt).getTime());

    const timeoutMs = Math.max(0, nextDueAt - Date.now() + 80);
    const timeoutId = window.setTimeout(() => {
      actions.settleToNow();
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [actions, timers]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      actions.settleToNow();
    }, passiveLifeSettleIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [actions]);

  useEffect(() => {
    if (unreadCount > previousUnreadCountRef.current) {
      notificationAutoOpenedRef.current = true;
      setNotificationDrawerOpen(true);
    }

    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!isNotificationDrawerOpen || !notificationAutoOpenedRef.current) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      notificationAutoOpenedRef.current = false;
      setNotificationDrawerOpen(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [isNotificationDrawerOpen, unreadCount]);

  useEffect(() => {
    if (isNotificationDrawerOpen && latestLogAt && meta.lastViewedLogAt !== latestLogAt) {
      actions.markNotificationsSeen(latestLogAt);
    }
  }, [actions, isNotificationDrawerOpen, latestLogAt, meta.lastViewedLogAt]);

  useEffect(() => {
    if (!deathRiskWarning) {
      setDismissedDeathRiskKey(null);
    }
  }, [deathRiskWarning]);

  if (meta.isGameOver || !player.isAlive) {
    const qualificationSummary = Object.values(game.skills.tracks)
      .sort((left, right) => right.points - left.points)
      .filter((track) => track.points > 0)
      .map((track) => ({
        label: trackTitles[track.track] ?? track.track,
        value: `lvl ${track.level} / ${track.points} QP`,
      }));
    const gameOverSummaryItems = [
      { label: "Причина смерти", value: getGameOverReasonLabel(meta.gameOverReason) },
      { label: "Возраст", value: formatUiAgeYears(player.ageYears) },
      { label: "Деньги", value: `$${player.money}` },
      { label: "Капитал", value: `$${player.capital}` },
      { label: "Прочитано книг", value: String(game.learning.completedBookIds.length) },
      { label: "Выполнено заказов", value: String(game.orders.completedOrderIds.length) },
      { label: "Провалено заказов", value: String(game.orders.failedOrderIds.length) },
      { label: "Работа", value: career.currentJobId ? "Была активна" : "Не устроился" },
      { label: "Супруга", value: social.spouse ? social.spouse.name : "Нет" },
      { label: "Дети", value: String(social.childrenCount) },
      { label: "Друзья", value: String(social.friends.length) },
      { label: "Питомцы", value: String(social.pets.filter((pet) => pet.isAlive).length) },
      ...(
        qualificationSummary.length > 0
          ? qualificationSummary.map((item) => ({
              label: `Квалификация: ${item.label}`,
              value: item.value,
            }))
          : [{ label: "Квалификации", value: "Нет заметного прогресса" }]
      ),
    ];

    return (
      <div className="app-shell game-over-shell">
        <section className="panel game-over-panel">
          <p className="eyebrow">Game Over</p>
          <h1>{player.name}</h1>

          <div className="timer-card">
            <div className="pc-spec-list">
              {gameOverSummaryItems.map((item) => (
                <div key={item.label} className="stat-item">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="game-over-actions">
            <button className="primary-button" onClick={() => actions.resetGame()}>
              Начать заново
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="eyebrow">v{__APP_VERSION__} build {buildLabel}</p>
          <h1>Компьютерщик</h1>
        </div>

        <div className="topbar-controls">
          <div className="topbar-stats">
            <span>{player.name}</span>
            <span>${player.money}</span>
            <span>{formatUiAgeYears(player.ageYears)}</span>
            <span>{career.currentJobId ? "Работает" : "Без работы"}</span>
            <span>{pc.ratingScore} PC score</span>
            <span>{orders.activeOrderId ? "Есть активный заказ" : "Заказ свободен"}</span>
          </div>

          <button
            className="notification-toggle"
            onClick={() => {
              notificationAutoOpenedRef.current = false;
              setNotificationDrawerOpen((current) => !current);
            }}
          >
            Уведомления
            <span className="badge">{unreadCount} новых</span>
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav className="nav-grid">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "nav-card nav-card-active" : "nav-card"
                }
              >
                <span className="nav-mark">{item.code}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <aside
        className={
          isNotificationDrawerOpen
            ? "notification-drawer notification-drawer-open"
            : "notification-drawer"
        }
      >
        <div className="notification-head">
          <div>
            <p className="eyebrow">Уведомления</p>
            <h3>Глобальная лента событий</h3>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              notificationAutoOpenedRef.current = false;
              setNotificationDrawerOpen(false);
            }}
          >
            Скрыть
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="muted">Пока тихо. Важные события будут появляться здесь автоматически.</p>
        ) : (
          <div className="notification-list">
            {logs.slice(0, 10).map((entry) => {
              const isUnread = new Date(entry.at).getTime() > lastViewedLogAtMs;

              return (
                <article
                  key={entry.id}
                  className={isUnread ? "log-item notification-item notification-item-unread" : "log-item notification-item"}
                >
                  <span className="log-kind">{entry.kind}</span>
                  <p>{entry.message}</p>
                  <time>{new Date(entry.at).toLocaleString("ru-RU")}</time>
                </article>
              );
            })}
          </div>
        )}
      </aside>

      {isIntroModalOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Как играть</p>
                <h3>Первые шаги в "Компьютерщике"</h3>
              </div>
              <span className="badge">Новая игра</span>
            </div>

            <p>
              Твоя цель проста: вырасти из новичка без нормальной работы и слабого ПК в
              уверенного специалиста с сильным доходом, хорошим железом и сетью полезных знакомых.
            </p>

            <div className="stat-list">
              <article className="stat-item">
                <strong>1. Учись</strong>
                <span>
                  Покупай книги и читай их, чтобы поднимать квалификацию и открывать путь к
                  более сильным вакансиям и заказам.
                </span>
              </article>
              <article className="stat-item">
                <strong>2. Ищи работу</strong>
                <span>
                  Заходи в "Карьеру", запускай поиск и выбирай предложения, которые соответствуют
                  твоим навыкам.
                </span>
              </article>
              <article className="stat-item">
                <strong>3. Улучшай ПК и бери заказы</strong>
                <span>
                  В разделе "ПК и Заказы" собирай рабочий компьютер, повышай PC score и закрывай
                  более дорогие задачи.
                </span>
              </article>
              <article className="stat-item">
                <strong>4. Заводи знакомства</strong>
                <span>
                  Через прогулки и соцжизнь находи друзей и контакты: они помогают получать новые
                  заказы и двигают прогресс быстрее.
                </span>
              </article>
            </div>

            <p className="muted">
              Следи за голодом, здоровьем и весом. Если полностью игнорировать быт, герой может
              умереть раньше, чем доберется до хорошей карьеры.
            </p>

            <div className="modal-actions">
              <button className="primary-button" onClick={() => actions.dismissIntro()}>
                Погнали
              </button>
            </div>
          </div>
        </div>
      ) : isDeathRiskModalOpen && deathRiskWarning ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">{deathRiskWarning.eyebrow}</p>
                <h3>{deathRiskWarning.title}</h3>
              </div>
              <span className="badge">Важно</span>
            </div>

            <p>{deathRiskWarning.message}</p>
            <p className="muted">{deathRiskWarning.advice}</p>

            <div className="modal-actions">
              <button
                className="primary-button"
                onClick={() => setDismissedDeathRiskKey(deathRiskWarning.key)}
              >
                Понял
              </button>
            </div>
          </div>
        </div>
      ) : pendingEncounter ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Социальное решение</p>
                <h3>{pendingEncounter.title}</h3>
              </div>
              <span className="badge">{getEncounterBadge(pendingEncounter)}</span>
            </div>

            <strong>{getEncounterName(pendingEncounter)}</strong>
            <p>{pendingEncounter.story}</p>
            <p className="muted">
              Событие сохраняется в состоянии игры и не потеряется при переходе между страницами.
              {social.pendingEncounters.length > 1
                ? ` После этого решения в очереди останется еще ${social.pendingEncounters.length - 1}.`
                : null}
            </p>

            <div className="modal-actions">
              <button
                className="primary-button"
                onClick={() => actions.rejectPendingSocialEncounter(pendingEncounter.id)}
              >
                Отклонить
              </button>
              <button
                className="primary-button"
                onClick={() => actions.acceptPendingSocialEncounter(pendingEncounter.id)}
              >
                Принять
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
