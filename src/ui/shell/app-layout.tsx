import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useGameStore } from "../store-hooks";

const navItems = [
  { to: "/hero", label: "Герой" },
  { to: "/pc", label: "ПК и Заказы" },
  { to: "/career", label: "Карьера" },
  { to: "/learning", label: "Обучение" },
  { to: "/social", label: "Хобби и Соцжизнь" },
  { to: "/life", label: "Быт и Здоровье" },
];

export function AppLayout() {
  const player = useGameStore((state) => state.game.player);
  const career = useGameStore((state) => state.game.career);
  const pc = useGameStore((state) => state.game.pc);
  const orders = useGameStore((state) => state.game.orders);
  const settleToNow = useGameStore((state) => state.actions.settleToNow);

  useEffect(() => {
    settleToNow();
  }, [settleToNow]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Idle Sim / Browser MVP</p>
          <h1>Компьютерщик</h1>
        </div>
        <div className="topbar-stats">
          <span>{player.name}</span>
          <span>${player.money}</span>
          <span>{player.ageYears} лет</span>
          <span>{career.currentJobId ? "Работает" : "Без работы"}</span>
          <span>{pc.ratingScore} PC score</span>
          <span>{orders.activeOrderId ? "Есть активный заказ" : "Заказ свободен"}</span>
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
    </div>
  );
}
