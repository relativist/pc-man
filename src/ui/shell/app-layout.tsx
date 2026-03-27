import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import type { PendingSocialEncounter } from "../../domain";
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

export function AppLayout() {
  const game = useGameStore((state) => state.game);
  const settleToNow = useGameStore((state) => state.actions.settleToNow);
  const acceptEncounter = useGameStore((state) => state.actions.acceptPendingSocialEncounter);
  const rejectEncounter = useGameStore((state) => state.actions.rejectPendingSocialEncounter);
  const markNotificationsSeen = useGameStore((state) => state.actions.markNotificationsSeen);
  const [isNotificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const previousUnreadCountRef = useRef(0);

  const { player, career, pc, orders, timers, logs, social, meta } = game;
  const pendingEncounter = social.pendingEncounters[0] ?? null;
  const lastViewedLogAtMs = meta.lastViewedLogAt ? new Date(meta.lastViewedLogAt).getTime() : 0;
  const unreadLogs = logs.filter((entry) => new Date(entry.at).getTime() > lastViewedLogAtMs);
  const unreadCount = unreadLogs.length;
  const latestLogAt = logs[0]?.at ?? null;

  useEffect(() => {
    settleToNow();
  }, [settleToNow]);

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
      settleToNow();
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [settleToNow, timers]);

  useEffect(() => {
    if (unreadCount > previousUnreadCountRef.current) {
      setNotificationDrawerOpen(true);
    }

    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (isNotificationDrawerOpen && latestLogAt && meta.lastViewedLogAt !== latestLogAt) {
      markNotificationsSeen(latestLogAt);
    }
  }, [isNotificationDrawerOpen, latestLogAt, markNotificationsSeen, meta.lastViewedLogAt]);

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
            <span>{player.ageYears} лет</span>
            <span>{career.currentJobId ? "Работает" : "Без работы"}</span>
            <span>{pc.ratingScore} PC score</span>
            <span>{orders.activeOrderId ? "Есть активный заказ" : "Заказ свободен"}</span>
          </div>

          <button
            className="notification-toggle"
            onClick={() => setNotificationDrawerOpen((current) => !current)}
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
            className="secondary-button"
            onClick={() => setNotificationDrawerOpen(false)}
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
                className="secondary-button"
                onClick={() => rejectEncounter(pendingEncounter.id)}
              >
                Отклонить
              </button>
              <button
                className="primary-button"
                onClick={() => acceptEncounter(pendingEncounter.id)}
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
