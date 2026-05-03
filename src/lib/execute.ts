import { urlsConstructor } from "@/src/lib/urlConstructors";
import { HUBS } from "@/src/lib/constants";
import { settings } from "@/src/lib/settings";
import { IHistory, IOrder } from "../types/interfaces";
import { getNeighborSystems, jumpFilter } from "./location";
import {
  ordersHandler,
  addHistoryToItems,
  addInfoToItem,
} from "./dataHandlers";
// import { dropDb, initDb } from "./dbHandlers";

import { priceFilter, marginFilter, volFilter, ordersFilter } from "./filtres";
import { queryHandler, getItemsHistory, getItemsInfo } from "./querysHandler";

export async function executeGetData() {
  // dropDb
  // initDb();
  const currentRegion = settings.region; // Сохраняем локально для стабильности
  const regionId = HUBS[currentRegion].region.id;
  const hubSystemId = HUBS[currentRegion].system.id;

  const firstPageUrl = urlsConstructor.orders(regionId, 1)[0];

  // Делаем HEAD запрос только если нам реально нужно знать количество страниц
  const initialResp = await fetch(firstPageUrl, { method: "HEAD" });
  const quantity = Number(initialResp.headers.get("x-pages")) || 1;

  // 2. Формируем список всех URL и запускаем массовый запрос
  const urls = urlsConstructor.orders(regionId, quantity);
  const rawOrders: IOrder[][] = await queryHandler<IOrder[]>(urls);

  // 3. Обработка данных
  const orders = rawOrders.flat();

  const neighbors = await getNeighborSystems(hubSystemId);
  const orders1jump = jumpFilter(orders, neighbors);
  const itemGen1 = ordersHandler(orders1jump);
  const itemGen1Filtred1 = priceFilter(itemGen1);
  const itemGen1Filtred2 = marginFilter(itemGen1Filtred1);
  const history: IHistory[][] = await getItemsHistory(
    itemGen1Filtred2 as { type_id: number }[],
    regionId,
  );
  const itemGen2 = addHistoryToItems(itemGen1Filtred2, history);
  const itemGen2Filtred1 = ordersFilter(itemGen2);
  const itemGen2Filtred2 = volFilter(itemGen2Filtred1) as {
    type_id: number;
  }[];
  const info = await getItemsInfo(itemGen2Filtred2 as { type_id: number }[]);
  const itemGen3 = addInfoToItem(itemGen2Filtred2, info);
  console.log(itemGen3);
  return itemGen3;
}
