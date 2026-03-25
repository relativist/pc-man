import type { PcComponentCatalogItem, PcComponentSlot } from "../types";

export const ratedPcSlots: PcComponentSlot[] = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "ssd",
  "power_supply",
  "case",
  "cooling",
  "monitor",
];

export const requiredPcSlots: PcComponentSlot[] = [...ratedPcSlots, "keyboard", "mouse"];

export const pcProgressionLabels = [
  "Подвальный",
  "Хрипящий",
  "Скрипучий",
  "Сонный",
  "Уставший",
  "Живучий",
  "Бюджетный",
  "Терпеливый",
  "Аккуратный",
  "Шустрый",
  "Бодрый",
  "Собранный",
  "Ровный",
  "Уверенный",
  "Рабочий",
  "Крепкий",
  "Плотный",
  "Скоростной",
  "Прокачанный",
  "Смелый",
  "Турбированный",
  "Горячий",
  "Точный",
  "Зубастый",
  "Мощный",
  "Реактивный",
  "Инженерный",
  "Безжалостный",
  "Ультра",
  "Монструозный",
  "Легендарный",
  "Техно-баронский",
  "Орбитальный",
  "Квантовый",
  "Императорский",
  "Мифический",
  "Космический",
  "Галактический",
  "Трансцендентный",
  "Запредельный",
] as const;

type PcSlotCatalogSpec = {
  displayName: string;
  funnyTail: string;
  role: string;
  rated: boolean;
  basePrice: number;
  linearStep: number;
  quadraticFactor: number;
};

export const pcSlotCatalogSpec: Record<PcComponentSlot, PcSlotCatalogSpec> = {
  cpu: {
    displayName: "Процессор",
    funnyTail: "Считалец котиков",
    role: "Главный вычислительный компонент и важная часть любого апгрейда.",
    rated: true,
    basePrice: 120,
    linearStep: 20,
    quadraticFactor: 2.8,
  },
  motherboard: {
    displayName: "Материнка",
    funnyTail: "Печатный трон логики",
    role: "Основа сборки, держит систему собранной и не дает ей расползтись.",
    rated: true,
    basePrice: 95,
    linearStep: 17,
    quadraticFactor: 2.1,
  },
  ram: {
    displayName: "Оперативка",
    funnyTail: "Хранитель табов",
    role: "Память для рабочих задач, таблиц и десятка открытых вкладок.",
    rated: true,
    basePrice: 80,
    linearStep: 15,
    quadraticFactor: 1.8,
  },
  gpu: {
    displayName: "Видеокарта",
    funnyTail: "Разгонщик пикселей",
    role: "Ускоряет сложные визуальные задачи и поднимает престиж сборки.",
    rated: true,
    basePrice: 130,
    linearStep: 22,
    quadraticFactor: 3.1,
  },
  ssd: {
    displayName: "SSD",
    funnyTail: "Носитель боли и данных",
    role: "Хранит систему, проекты и дедлайны быстрее старых решений.",
    rated: true,
    basePrice: 70,
    linearStep: 14,
    quadraticFactor: 1.7,
  },
  power_supply: {
    displayName: "Блок питания",
    funnyTail: "Кормилец электронов",
    role: "Питает сборку и позволяет держать апгрейды без нервного тика.",
    rated: true,
    basePrice: 60,
    linearStep: 12,
    quadraticFactor: 1.5,
  },
  case: {
    displayName: "Корпус",
    funnyTail: "Ящик судьбы",
    role: "Физическая оболочка ПК, влияет на уровень сборки и ощущение статуса.",
    rated: true,
    basePrice: 55,
    linearStep: 11,
    quadraticFactor: 1.4,
  },
  cooling: {
    displayName: "Охлаждение",
    funnyTail: "Усмиритель пламени",
    role: "Сдерживает перегрев железа и добавляет ощущение серьезной машины.",
    rated: true,
    basePrice: 50,
    linearStep: 10,
    quadraticFactor: 1.3,
  },
  monitor: {
    displayName: "Монитор",
    funnyTail: "Глаз проекта",
    role: "Главное окно в работу, интерфейсы и заказной хаос.",
    rated: true,
    basePrice: 85,
    linearStep: 16,
    quadraticFactor: 1.9,
  },
  keyboard: {
    displayName: "Клавиатура",
    funnyTail: "Печатный скакун",
    role: "Обязательна для рабочего ПК, но не участвует в рейтинге задач.",
    rated: false,
    basePrice: 25,
    linearStep: 6,
    quadraticFactor: 0.8,
  },
  mouse: {
    displayName: "Мышь",
    funnyTail: "Указатель судьбы",
    role: "Обязательна для рабочего ПК, но не участвует в рейтинге задач.",
    rated: false,
    basePrice: 25,
    linearStep: 6,
    quadraticFactor: 0.8,
  },
};

function buildFunnyTitle(slot: PcComponentSlot, level: number): string {
  const spec = pcSlotCatalogSpec[slot];
  const progressionLabel = pcProgressionLabels[level - 1];

  return `${spec.displayName} "${progressionLabel} ${spec.funnyTail}"`;
}

function buildPrice(slot: PcComponentSlot, level: number): number {
  const spec = pcSlotCatalogSpec[slot];
  const price =
    spec.basePrice + level * spec.linearStep + level * level * spec.quadraticFactor;

  return Math.round(price);
}

function buildParts(slot: PcComponentSlot): PcComponentCatalogItem[] {
  const spec = pcSlotCatalogSpec[slot];

  return Array.from({ length: 40 }, (_, index) => {
    const level = index + 1;

    return {
      id: `${slot}-${level}`,
      slot,
      funnyTitle: buildFunnyTitle(slot, level),
      level,
      score: spec.rated ? level : 0,
      price: buildPrice(slot, level),
    };
  });
}

export const pcPartsCatalog: PcComponentCatalogItem[] = requiredPcSlots.flatMap((slot) =>
  buildParts(slot),
);
