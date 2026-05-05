import { urlsConstructor } from "@/src/lib/urlConstructors";
import { HUBS } from "@/src/lib/constants";
import { tradeSettings } from "@/src/lib/settings";
import { IHistory, IOrder, IInfo } from "../types/interfaces";
import { getNeighborSystems, jumpFilter } from "./location";
import {
  ordersHandler,
  addHistoryToItems,
  addInfoToItem,
} from "./dataHandlers";
import { priceFilter, marginFilter, volFilter, ordersFilter } from "./filtres";
import { queryHandler } from "./querysHandler";
import { profitCalc } from "./profitCalculations";

export async function executeGetData() {
  const regionId: number = HUBS[tradeSettings.region].region.id;
  const hubSystemId: number = HUBS[tradeSettings.region].system.id;
  const firstPageUrl: string = urlsConstructor.orders(regionId, 1)[0];
  const initialResp: Awaited<Response> = (await fetch(firstPageUrl, {
    method: "HEAD",
  })) as Response;
  const quantity: number = Number(initialResp.headers.get("x-pages")) || 1;
  const orderUrls: string[] = urlsConstructor.orders(regionId, quantity);
  const orders: IOrder[] = (await queryHandler<IOrder[]>(orderUrls)).flat();
  const neighborSystems: number[] = await getNeighborSystems(hubSystemId);
  const orders1jump: IOrder[] = jumpFilter(orders, neighborSystems);
  const itemGen1 = ordersHandler(orders1jump);
  const itemGen1Filtred1 = priceFilter(itemGen1);
  const itemGen1Filtred2 = marginFilter(itemGen1Filtred1);
  const historyUrls: string[] = urlsConstructor.history(
    itemGen1Filtred2,
    regionId,
  );
  const historyData = await queryHandler<IHistory[]>(historyUrls);
  const itemGen2 = addHistoryToItems(itemGen1Filtred2, historyData);
  const itemGen2Filtred1 = ordersFilter(itemGen2);
  const itemGen2Filtred2 = volFilter(itemGen2Filtred1) as {
    type_id: number;
  }[];
  const itemGen3 = profitCalc(itemGen2Filtred2);
  const infoUrls: string[] = urlsConstructor.info(itemGen3);
  const infoData: IInfo[] = (await queryHandler<IInfo[]>(infoUrls)).flat();
  const itemGen4 = addInfoToItem(itemGen2Filtred2, infoData);
  return itemGen4;
}
