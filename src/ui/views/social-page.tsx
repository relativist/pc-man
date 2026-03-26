import { maxFriends, maxPets, spouseGiftPrice } from "../../domain";
import { useGameStore } from "../store-hooks";

const socialEventKinds = [
  "walk_completed",
  "friend_found",
  "spouse_found",
  "gift_given",
  "child_born",
  "pet_found",
  "pet_died",
] as const;

function getPetAgeYears(acquiredAt: string): number {
  const elapsedMinutes = Math.max(0, Date.now() - new Date(acquiredAt).getTime()) / 60_000;
  return Number((elapsedMinutes / 10).toFixed(1));
}

export function SocialPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);

  const activeFriends = game.social.friends.filter((friend) => friend.isActive);
  const inactiveFriends = game.social.friends.filter((friend) => !friend.isActive);
  const livingPets = game.social.pets.filter((pet) => pet.isAlive);
  const departedPets = game.social.pets.filter((pet) => !pet.isAlive);
  const spouse = game.social.spouse;
  const recentSocialEvents = game.logs
    .filter((entry) =>
      socialEventKinds.includes(entry.kind as (typeof socialEventKinds)[number]),
    )
    .slice(0, 8);

  return (
    <section className="page-grid">
      <div className="panel hero-headline">
        <p className="eyebrow">Хобби / Социальная жизнь</p>
        <h2>Прогулки, знакомства и семейная ветка</h2>
        <p className="lede">
          Здесь герой уходит в приключения, находит друзей, может встретить супругу и заводит питомцев.
        </p>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Друзья</span>
            <strong>
              {activeFriends.length}/{maxFriends}
            </strong>
          </div>
          <div>
            <span className="metric-label">Питомцы</span>
            <strong>
              {livingPets.length}/{maxPets}
            </strong>
          </div>
          <div>
            <span className="metric-label">Супруга</span>
            <strong>{spouse ? spouse.name : "Нет"}</strong>
          </div>
          <div>
            <span className="metric-label">Дети</span>
            <strong>{game.social.childrenCount}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Прогулка</h3>
            <p className="muted">
              Один выход может принести здоровье, деньги, приключение или небольшой урон кошельку.
            </p>
          </div>
          <div className="badge-row">
            <button
              className="secondary-button"
              onClick={() => actions.startWalk()}
              disabled={Boolean(game.timers.walk)}
            >
              Начать прогулку
            </button>
            <button
              className="primary-button"
              onClick={() => actions.completeWalk()}
              disabled={!game.timers.walk}
            >
              Завершить прогулку
            </button>
          </div>
        </div>

        {game.timers.walk ? (
          <div className="timer-card">
            <strong>Активная прогулка</strong>
            <p>Старт: {new Date(game.timers.walk.startedAt).toLocaleString("ru-RU")}</p>
            <p>Окончание: {new Date(game.timers.walk.endsAt).toLocaleString("ru-RU")}</p>
          </div>
        ) : (
          <p className="muted">
            Сейчас прогулка не запущена. Здесь же герой ищет друзей, питомцев и потенциальную супругу.
          </p>
        )}
      </div>

      <div className="panel wide-panel">
        <div className="section-head">
          <div>
            <h3>Друзья</h3>
            <p className="muted">
              Чем чаще гуляешь, тем больше знакомых находишь. Каждый друг в будущем сможет дать до 3 заказов.
            </p>
          </div>
          <span className="badge">{activeFriends.length} активных</span>
        </div>

        {activeFriends.length === 0 ? (
          <div className="empty-state">
            <h4>Пока пусто</h4>
            <p>Начни прогулки, чтобы собрать сеть знакомых и открыть поток заказов от друзей.</p>
          </div>
        ) : (
          <div className="order-list">
            {activeFriends.map((friend) => {
              const remainingOrders = friend.maxOrdersGiven - friend.ordersGivenCount;

              return (
                <article key={friend.id} className="order-card">
                  <div className="order-meta">
                    <span className="badge">Друг</span>
                    <span className="badge">{remainingOrders} заказов осталось</span>
                  </div>
                  <h4>{friend.name}</h4>
                  <p>
                    Уже выдал: {friend.ordersGivenCount} из {friend.maxOrdersGiven}. После третьего заказа друг
                    пропадет из активного пула.
                  </p>
                </article>
              );
            })}
          </div>
        )}

        {inactiveFriends.length > 0 ? (
          <p className="muted">Отработавшие знакомые: {inactiveFriends.length}. Их еще можно хранить в истории героя.</p>
        ) : null}
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Семья</h3>
            <p className="muted">
              Семья должна давать бонус к обучению и доходу, но увеличивать расходы. В MVP здесь закрепляем базовый
              flow.
            </p>
          </div>
          <span className="badge">{game.social.childrenCount} детей</span>
        </div>

        {spouse ? (
          <div className="risk-list">
            <article className="timer-card">
              <strong>{spouse.name}</strong>
              <p>Уровень отношений: {spouse.relationshipLevel}/100</p>
              <p>Подарков подарено: {spouse.giftCount}</p>
              <p>
                Бонус семьи: обучение быстрее на 10%, но расходы на быт и еду растут с каждым новым членом семьи.
              </p>
            </article>

            <div className="badge-row">
              <button
                className="secondary-button"
                onClick={() => actions.giveSpouseGift()}
                disabled={game.player.money < spouseGiftPrice}
              >
                Подарок за ${spouseGiftPrice}
              </button>
              <button
                className="primary-button"
                onClick={() => actions.acceptChildSuggestion()}
                disabled={!spouse.canSuggestChild}
              >
                Принять идею о ребенке
              </button>
            </div>

            {!spouse.canSuggestChild ? (
              <p className="muted">
                Для следующего шага нужны подарки и более высокий уровень отношений. После этого супруга сама предложит
                завести ребенка.
              </p>
            ) : (
              <p className="muted">
                Супруга уже готова к следующему шагу. Новый ребенок увеличит расходы, но усилит семейные бонусы.
              </p>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <h4>Супруга еще не найдена</h4>
            <p>Гуляй чаще. Знакомство с будущей супругой происходит через прогулки и приключения.</p>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <h3>Питомцы</h3>
            <p className="muted">
              Питомцев может быть несколько. В среднем они живут 2-3 игровых года и иногда уходят случайно.
            </p>
          </div>
          <span className="badge">{livingPets.length} живы</span>
        </div>

        {livingPets.length === 0 ? (
          <div className="empty-state">
            <h4>Пока без питомцев</h4>
            <p>На прогулке можно встретить кота, пса, попугая или что-то более странное.</p>
          </div>
        ) : (
          <div className="order-list">
            {livingPets.map((pet) => (
              <article key={pet.id} className="order-card">
                <div className="order-meta">
                  <span className="badge">{pet.species}</span>
                  <span className="badge">жизнь {pet.expectedLifeYears} г.</span>
                </div>
                <h4>{pet.name}</h4>
                <p>Возраст: около {getPetAgeYears(pet.acquiredAt)} игровых лет.</p>
              </article>
            ))}
          </div>
        )}

        {departedPets.length > 0 ? (
          <p className="muted">Память о питомцах: {departedPets.length}. Они остаются в истории героя.</p>
        ) : null}
      </div>

      <div className="panel wide-panel">
        <h3>Последние социальные события</h3>
        {recentSocialEvents.length === 0 ? (
          <p className="muted">Социальная лента пока пустая. Начни с прогулки.</p>
        ) : (
          <div className="log-list">
            {recentSocialEvents.map((entry) => (
              <article key={entry.id} className="log-item">
                <span className="log-kind">{entry.kind}</span>
                <p>{entry.message}</p>
                <time>{new Date(entry.at).toLocaleString("ru-RU")}</time>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
