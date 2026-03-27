import type { GameState, ShopSectionId } from "../../domain";
import { InfoHint } from "../info-hint";
import { useGameStore } from "../store-hooks";

const sectionLabels: Record<ShopSectionId, string> = {
  things: "Крутые вещи",
  housing: "Жилье",
  transport: "Транспорт",
};

const sectionDescriptions: Record<ShopSectionId, string> = {
  things: "Статусные покупки для интерьера, понтов и роста имущественной массы.",
  housing: "От комнаты и съемного угла до резиденции, куда не стыдно заносить сервер.",
  transport: "От кривого велосипеда до барского аппарата для солидного передвижения.",
};

function getCurrentOwnedLot(
  game: GameState,
  section: ShopSectionId,
) {
  const currentLotId = game.shop[section].currentLotId;
  return currentLotId
    ? game.world.shopCatalogs[section].find((lot) => lot.id === currentLotId) ?? null
    : null;
}

export function ShopPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);

  const sections: ShopSectionId[] = ["things", "housing", "transport"];

  return (
    <section className="page-grid dense-grid">
      <div className="panel hero-headline wide-panel">
        <p className="eyebrow">Магазин</p>
        <div className="title-with-help">
          <h2>Недвижимость, транспорт и крутые вещи</h2>
          <InfoHint text="В каждой секции доступен только один следующий лот. Покупка сразу открывает следующий уровень и обновляет имущество героя." />
        </div>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Деньги</span>
            <strong>${game.player.money}</strong>
          </div>
          <div>
            <span className="metric-label">Капитал</span>
            <strong>${game.player.capital}</strong>
          </div>
          <div>
            <span className="metric-label">Недвижимость</span>
            <strong>${game.player.realEstateValue}</strong>
          </div>
          <div>
            <span className="metric-label">Прочее имущество</span>
            <strong>${game.player.propertyValue}</strong>
          </div>
        </div>
      </div>

      {sections.map((section) => {
        const currentLot = getCurrentOwnedLot(game, section);
        const nextLot = game.world.shopCatalogs[section][game.shop[section].nextLotIndex] ?? null;
        return (
          <div key={section} className="panel">
            <div className="section-head">
              <div>
                <div className="title-with-help">
                  <h3>{sectionLabels[section]}</h3>
                  <InfoHint text={sectionDescriptions[section]} />
                </div>
              </div>
              <span className="badge">
                {game.shop[section].nextLotIndex}/{game.world.shopCatalogs[section].length}
              </span>
            </div>

            <div className="shop-list">
              <article className="shop-card compact-card">
                <div className="order-meta">
                  <span className="badge">Текущий актив</span>
                  <span className="badge">
                    {currentLot ? `Лот ${currentLot.tier}` : "пока пусто"}
                  </span>
                </div>
                <h4>{currentLot ? currentLot.title : "Еще ничего не куплено"}</h4>
                <p>{currentLot ? currentLot.funnyTitle : "Первая покупка задаст старт прогрессу в этой секции."}</p>
                <div className="title-with-help">
                  <p className="muted">
                    {currentLot
                      ? "Описание актива скрыто в подсказке, чтобы карточка оставалась компактной."
                      : "После первой покупки здесь появится текущий уровень имущества героя."}
                  </p>
                  {currentLot ? <InfoHint text={currentLot.description} /> : null}
                </div>
                <div className="shop-actions">
                  <button
                    className="primary-button"
                    onClick={() => actions.buyNextShopLot(section)}
                    disabled={!nextLot || game.player.money < nextLot.price}
                  >
                    {nextLot ? `Купить за $${nextLot.price}` : "Каталог завершен"}
                  </button>
                  <p className="muted">
                    {!nextLot
                      ? "Каталог закрыт"
                      : game.player.money < nextLot.price
                        ? "Не хватает денег"
                        : "Покупка сразу обновит актив в этом разделе"}
                  </p>
                </div>
              </article>
            </div>
          </div>
        );
      })}
    </section>
  );
}
