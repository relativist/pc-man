import type { Book } from "./books";
import type { Company, Vacancy } from "./career";
import type { Order } from "./orders";
import type { PcComponentCatalogItem } from "./pc";
import type { ShopLot, ShopSectionId } from "./shop";

export type WorldState = {
  companies: Company[];
  activeVacancies: Vacancy[];
  availableBooks: Book[];
  availablePcParts: PcComponentCatalogItem[];
  orderPool: Order[];
  shopCatalogs: Record<ShopSectionId, ShopLot[]>;
};
