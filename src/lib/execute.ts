// src/lib/execute.ts
import { urlsConstructor } from '@/src/lib/urlConstructors';
import { HUBS } from '@/src/lib/constants';
import { IHistory, IOrder, IInfo, ITradeSettings } from '../types/interfaces'; // Импортируем интерфейс настроек
import { getNeighborSystems, jumpFilter } from './location';
import {
    ordersHandler,
    addHistoryToItems,
    addInfoToItem,
} from './dataHandlers';
import { priceFilter, marginFilter, volFilter, ordersFilter } from './filtres';
import { queryHandler } from './querysHandler';
import { profitCalc } from './profitCalculations';

// Функция теперь принимает динамический объект настроек с фронтенда
export async function executeGetData(activeSettings: ITradeSettings) {
    const regionId: number = HUBS[activeSettings.region].region.id;
    const hubSystemId: number = HUBS[activeSettings.region].system.id;

    const firstPageUrl: string = urlsConstructor.orders(regionId, 1)[0];
    const initialResp: Awaited<Response> = (await fetch(firstPageUrl, {
        method: 'HEAD',
    })) as Response;

    const quantity: number = Number(initialResp.headers.get('x-pages')) || 1;
    const orderUrls: string[] = urlsConstructor.orders(regionId, quantity);
    const orders: IOrder[] = (await queryHandler<IOrder[]>(orderUrls)).flat();
    const neighborSystems: number[] = await getNeighborSystems(hubSystemId);
    const orders1jump: IOrder[] = jumpFilter(orders, neighborSystems);

    const itemGen1 = ordersHandler(orders1jump);

    // ПЕРЕДАЕМ АРГУМЕНТЫ ДАЛЬШЕ ПО ЦЕПОЧКЕ:
    const itemGen1Filtred1 = priceFilter(itemGen1, activeSettings);
    const itemGen1Filtred2 = marginFilter(itemGen1Filtred1, activeSettings);

    const historyUrls: string[] = urlsConstructor.history(
        itemGen1Filtred2,
        regionId,
    );
    const historyData = await queryHandler<IHistory[]>(historyUrls);
    const itemGen2 = addHistoryToItems(itemGen1Filtred2, historyData);

    const itemGen2Filtred1 = ordersFilter(itemGen2, activeSettings);
    const itemGen2Filtred2 = volFilter(itemGen2Filtred1, activeSettings) as {
        type_id: number;
    }[];

    const itemGen3 = profitCalc(itemGen2Filtred2, activeSettings);

    const infoUrls: string[] = urlsConstructor.info(itemGen3);
    const infoData: IInfo[] = (await queryHandler<IInfo[]>(infoUrls)).flat();
    const itemGen4 = addInfoToItem(itemGen3, infoData);

    return itemGen4;
}
