import type { ShopLot, ShopSectionId } from "../types";

const thingAdjectives = [
  "Пыльный",
  "Кричащий",
  "Трофейный",
  "Дерзкий",
  "Легендарный",
  "Турбированный",
  "VIP",
  "Шальной",
  "Референсный",
  "Бархатный",
];

const thingBases = [
  "диван для важного безделья",
  "кофейный столик для митапов с котом",
  "лампа, которая знает твой дедлайн",
  "шкаф для свитеров и несбывшихся pet-проектов",
  "коллекционный гаджет для понтов в зуме",
];

const housingPlaces = [
  "в панельке у метро",
  "над автомойкой с вайбом стартапа",
  "у ТЦ и вечного ремонта",
  "с видом на шиномонтаж мечты",
  "рядом с круглосуточной шавермой",
];

const housingFormats = [
  "Комната",
  "Студия",
  "Однушка",
  "Двушка",
  "Лофт",
  "Таунхаус",
  "Коттедж",
  "Пентхаус",
  "Особняк",
  "Резиденция",
];

const transportAdjectives = [
  "Шатающийся",
  "Бодрый",
  "Хромированный",
  "Ралли",
  "Городской",
  "Премиальный",
  "Тревожный",
  "Космический",
  "Эпичный",
  "Барский",
];

const transportBases = [
  "велосипед с амбициями",
  "мопед для срочных дедлайнов",
  "седан офисной славы",
  "кроссовер родительских чатов",
  "купе для слишком уверенных решений",
];

function createThingLots(): ShopLot[] {
  return thingAdjectives.flatMap((adjective, adjectiveIndex) =>
    thingBases.map((base, baseIndex) => {
      const tier = adjectiveIndex * thingBases.length + baseIndex + 1;
      const price = 120 + tier * 145 + adjectiveIndex * 30;

      return {
        id: `thing-${tier}`,
        section: "things",
        tier,
        title: `${adjective} ${base}`,
        funnyTitle: `Лот ${tier}: интерьерный артефакт для героя, который хочет выглядеть богаче своих багов.`,
        description:
          "Крутая вещь для статуса, комфорта и уважительного кивка от гостей, которые пришли посмотреть не только на монитор.",
        price,
        value: Math.round(price * 0.72),
      };
    }),
  );
}

function createHousingLots(): ShopLot[] {
  return housingFormats.flatMap((format, formatIndex) =>
    housingPlaces.map((place, placeIndex) => {
      const tier = formatIndex * housingPlaces.length + placeIndex + 1;
      const price = 420 + tier * 780 + formatIndex * 320;
      const isOwnedHome = tier >= 16;

      return {
        id: `housing-${tier}`,
        section: "housing",
        tier,
        title: `${format} ${place}`,
        funnyTitle: `Лот ${tier}: квадратные метры, где можно хранить мечту, зарядки и моральную усталость.`,
        description:
          "Жилье повышает статус героя, убирает часть бытового стыда и выглядит все дороже с каждым следующим апгрейдом.",
        price,
        value: Math.round(price * 0.91),
        housingStatus: isOwnedHome ? "own_home" : "rent",
      };
    }),
  );
}

function createTransportLots(): ShopLot[] {
  return transportAdjectives.flatMap((adjective, adjectiveIndex) =>
    transportBases.map((base, baseIndex) => {
      const tier = adjectiveIndex * transportBases.length + baseIndex + 1;
      const price = 180 + tier * 210 + adjectiveIndex * 90;

      return {
        id: `transport-${tier}`,
        section: "transport",
        tier,
        title: `${adjective} ${base}`,
        funnyTitle: `Лот ${tier}: средство передвижения, чтобы герой доезжал до жизни чуть солиднее, чем вчера.`,
        description:
          "Транспорт нужен для ощущения взрослой жизни, внезапных поездок и общего роста имущественного пафоса.",
        price,
        value: Math.round(price * 0.8),
      };
    }),
  );
}

export const shopCatalogs: Record<ShopSectionId, ShopLot[]> = {
  things: createThingLots(),
  housing: createHousingLots(),
  transport: createTransportLots(),
};
