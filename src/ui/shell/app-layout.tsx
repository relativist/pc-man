import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import type { PendingSocialEncounter } from "../../domain";
import { formatUiAgeYears } from "../display-format";
import { useGameStore } from "../store-hooks";

const navItems = [
  { to: "/hero", label: "Герой" },
  { to: "/pc", label: "ПК и Заказы" },
  { to: "/shop", label: "Магазин" },
  { to: "/career", label: "Карьера" },
  { to: "/learning", label: "Обучение" },
  { to: "/social", label: "Хобби и Соцжизнь" },
  { to: "/life", label: "Быт и Здоровье" },
];

const trackTitles: Record<string, string> = {
  qa: "QA",
  backend: "Backend",
  frontend: "Frontend",
  pm: "PM",
  pentester: "Pentester",
  analyst: "Analyst",
};

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

  if (reason === "illness") {
    return "Критическое здоровье";
  }

  if (reason === "old_age") {
    return "Старость";
  }

  return "Неизвестная причина";
}

export function AppLayout() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);
  const [isNotificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const previousUnreadCountRef = useRef(0);
  const notificationAutoOpenedRef = useRef(false);

  const { player, career, pc, orders, timers, logs, social, meta } = game;
  const pendingEncounter = social.pendingEncounters[0] ?? null;
  const lastViewedLogAtMs = meta.lastViewedLogAt ? new Date(meta.lastViewedLogAt).getTime() : 0;
  const unreadLogs = logs.filter((entry) => new Date(entry.at).getTime() > lastViewedLogAtMs);
  const unreadCount = unreadLogs.length;
  const latestLogAt = logs[0]?.at ?? null;

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

  if (meta.isGameOver || !player.isAlive) {
    const qualificationSummary = Object.values(game.skills.tracks)
      .sort((left, right) => right.points - left.points)
      .filter((track) => track.points > 0)
      .map((track) => ({
        label: trackTitles[track.track] ?? track.track,
        value: `lvl ${track.level} / ${track.points} QP`,
      }));

    return (
      <div className="app-shell game-over-shell">
        <section className="panel game-over-panel">
          <p className="eyebrow">Game Over</p>
          <h1>{player.name}</h1>
          <p className="lede">
            Игра завершена. Обычный интерфейс скрыт, пока не будет запущена новая сессия.
          </p>

          <div className="hero-metrics">
            <div>
              <span className="metric-label">Причина смерти</span>
              <strong>{getGameOverReasonLabel(meta.gameOverReason)}</strong>
            </div>
            <div>
              <span className="metric-label">Возраст</span>
              <strong>{formatUiAgeYears(player.ageYears)}</strong>
            </div>
            <div>
              <span className="metric-label">Деньги</span>
              <strong>${player.money}</strong>
            </div>
            <div>
              <span className="metric-label">Капитал</span>
              <strong>${player.capital}</strong>
            </div>
          </div>

          <div className="game-over-grid">
            <div className="timer-card">
              <strong>Итоги прохождения</strong>
              <div className="stat-list compact-stats">
                <div className="stat-item">
                  <span>Прочитано книг</span>
                  <strong>{game.learning.completedBookIds.length}</strong>
                </div>
                <div className="stat-item">
                  <span>Выполнено заказов</span>
                  <strong>{game.orders.completedOrderIds.length}</strong>
                </div>
                <div className="stat-item">
                  <span>Провалено заказов</span>
                  <strong>{game.orders.failedOrderIds.length}</strong>
                </div>
                <div className="stat-item">
                  <span>Работа</span>
                  <strong>{career.currentJobId ? "Была активна" : "Не устроился"}</strong>
                </div>
              </div>
            </div>

            <div className="timer-card">
              <strong>Семья и окружение</strong>
              <div className="stat-list compact-stats">
                <div className="stat-item">
                  <span>Супруга</span>
                  <strong>{social.spouse ? social.spouse.name : "Нет"}</strong>
                </div>
                <div className="stat-item">
                  <span>Дети</span>
                  <strong>{social.childrenCount}</strong>
                </div>
                <div className="stat-item">
                  <span>Друзья</span>
                  <strong>{social.friends.filter((friend) => friend.isActive).length}</strong>
                </div>
                <div className="stat-item">
                  <span>Питомцы</span>
                  <strong>{social.pets.filter((pet) => pet.isAlive).length}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="panel game-over-summary">
            <h3>Квалификации</h3>
            {qualificationSummary.length > 0 ? (
              <div className="chips">
                {qualificationSummary.map((item) => (
                  <div key={item.label} className="chip">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Квалификации не успели вырасти до заметного результата.</p>
            )}
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
        <div>
          <p className="eyebrow">Idle Sim / Browser MVP</p>
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
                {item.label}
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

      {pendingEncounter ? (
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
