import { maxFriends, maxPets, spouseGiftPrice } from "../../domain";
import { getActivityProgress, useNow } from "../activity-progress";
import { roundUiValue } from "../display-format";
import { InfoHint } from "../info-hint";
import { useGameStore } from "../store-hooks";

function getPetAgeYears(acquiredAt: string): number {
  const elapsedMinutes = Math.max(0, Date.now() - new Date(acquiredAt).getTime()) / 60_000;
  return roundUiValue(elapsedMinutes / 10);
}

export function SocialPage() {
  const game = useGameStore((state) => state.game);
  const actions = useGameStore((state) => state.actions);
  const now = useNow();

  const friends = game.social.friends;
  const remainingFriendOrders = friends.reduce(
    (total, friend) => total + (friend.maxOrdersGiven - friend.ordersGivenCount),
    0,
  );
  const livingPets = game.social.pets.filter((pet) => pet.isAlive);
  const departedPets = game.social.pets.filter((pet) => !pet.isAlive);
  const spouse = game.social.spouse;
  const walkProgress = game.timers.walk ? getActivityProgress(game.timers.walk, now) : null;

  return (
    <section className="page-grid dense-grid">
      <div className="panel hero-headline wide-panel">
        <p className="eyebrow">Хобби / Социальная жизнь</p>
        <div className="title-with-help">
          <h2>Прогулки, знакомства и семейная ветка</h2>
          <InfoHint text="Здесь герой уходит в приключения, находит друзей, может встретить супругу и заводит питомцев." />
        </div>

        <div className="hero-metrics">
          <div>
            <span className="metric-label">Друзья</span>
            <strong>
              {friends.length}/{maxFriends}
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
          <div>
            <span className="metric-label">Ждут решения</span>
            <strong>{game.social.pendingEncounters.length}</strong>
          </div>
        </div>
      </div>

      <div className="panel compact-panel social-summary-panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Прогулка</h3>
              <InfoHint text="Один выход может принести здоровье, деньги, приключение или небольшой урон кошельку." />
            </div>
          </div>
          <div className="badge-row">
            <button
              className="primary-button"
              onClick={() => actions.startWalk()}
              disabled={Boolean(game.timers.walk)}
            >
              Начать прогулку
            </button>
            {game.timers.walk ? <span className="badge">Автозавершение включено</span> : null}
          </div>
        </div>

        {game.timers.walk && walkProgress ? (
          <div className="timer-card">
            <strong>Активная прогулка</strong>
            <div className="progress-bar">
              <div
                className="progress-fill progress-good"
                style={{ width: `${walkProgress.percent}%` }}
              />
            </div>
            <p>Прогресс: {walkProgress.percent}%</p>
            <p className="muted">
              Осталось примерно {walkProgress.remainingLabel}. Итоги и новые знакомства прилетят
              автоматически.
            </p>
          </div>
        ) : (
          <div className="risk-list">
            <p className="muted">
              Сейчас прогулка не запущена. Здесь же герой ищет друзей, питомцев и потенциальную
              супругу.
            </p>
            {game.social.pendingEncounters.length > 0 ? (
              <p className="muted">
                Новые знакомства уже ждут решения в модальном окне и не потеряются при переходе по
                страницам.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="panel compact-panel social-summary-panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Друзья</h3>
              <InfoHint text="Чем чаще гуляешь, тем больше знакомых находишь. Каждый друг дает до 3 заказов, после чего исчезает из сети контактов." />
            </div>
          </div>
          <span className="badge">{remainingFriendOrders} заказов осталось</span>
        </div>

        {friends.length === 0 ? (
          <div className="empty-state">
            <h4>Пока пусто</h4>
            <p>Начни прогулки, чтобы собрать сеть знакомых и открыть поток заказов от друзей.</p>
          </div>
        ) : (
          <div className="risk-list">
            <article className="timer-card compact-card">
              <strong>Сеть знакомых работает</strong>
              <p>Друзей в сети: {friends.length}.</p>
              <p>Осталось friend-заказов: {remainingFriendOrders}.</p>
              <p>
                Каждый завершенный или проваленный заказ друзей сжигает один слот. После 3 слотов
                друг исчезает из списка.
              </p>
            </article>
          </div>
        )}
      </div>

      <div className="panel compact-panel social-summary-panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Семья</h3>
              <InfoHint text="Семья должна давать бонус к обучению и доходу, но увеличивать расходы. В MVP здесь закрепляем базовый flow." />
            </div>
          </div>
          <span className="badge">{game.social.childrenCount} детей</span>
        </div>

        {spouse ? (
          <div className="risk-list">
            <article className="timer-card compact-card">
              <strong>{spouse.name}</strong>
              <p>Уровень отношений: {spouse.relationshipLevel}/100</p>
              <p>Подарков подарено: {spouse.giftCount}</p>
              <p>
                Бонус семьи: обучение быстрее на 10%, но расходы на быт и еду растут с каждым новым членом семьи.
              </p>
            </article>

            <div className="badge-row">
              <button
                className="primary-button"
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

      <div className="panel compact-panel">
        <div className="section-head">
          <div>
            <div className="title-with-help">
              <h3>Питомцы</h3>
              <InfoHint text="Питомцев может быть несколько. В среднем они живут 2-3 игровых года и иногда уходят случайно." />
            </div>
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
              <article key={pet.id} className="order-card compact-card">
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
    </section>
  );
}
