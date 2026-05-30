// ./src/services/execute.ts
import {
    ordersUrlConstructor,
    historyUrlConstructor,
    infoUrlConstructor,
} from '@/src/lib/urlConstructors';
import { HUBS } from '@/src/lib/constants';
import {
    IOrder,
    ITradeSettings,
    IUserStats,
    IHistory,
    IInfo,
    IMarketItem,
    INumObj,
} from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';
import { getNeighborSystems } from '@/src/lib/location';
import {
    ordersHandler,
    addHistoryToItems,
    addInfoToItem,
} from '@/src/lib/dataHandlers';
import {
    priceFilter,
    marginFilter,
    volFilter,
    ordersFilter,
    jumpFilter,
} from '@/src/lib/filters';
import { queryHandler } from '@/src/lib/querysHandler';
import { profitCalc } from '@/src/lib/profitCalculations';
import { flattenValidPages } from '@/src/lib/helpers';

export async function executeGetData(
    activeSettings: ITradeSettings,
    activeStats: IUserStats,
    activeSkills: IUserSkills,
): Promise<IMarketItem[]> {
    const regionId: number = HUBS[activeSettings.region].region.id;
    const hubSystemId: number = HUBS[activeSettings.region].system.id;

    // 1. ПОЛУЧЕНИЕ ДАННЫХ ОРДЕРОВ: Стягиваем ВСЕ сырые ордера региона целиком
    const firstPageUrl: string = ordersUrlConstructor(regionId, 1)[0];
    const initialResp = await fetch(firstPageUrl, { method: 'HEAD' });
    const quantity: number = Number(initialResp.headers.get('x-pages')) || 1;

    const orderUrls: string[] = ordersUrlConstructor(regionId, quantity);
    const ordersResponsesRaw = await queryHandler<IOrder[]>(orderUrls);

    // Оптимизация: быстрое слияние страниц ордеров за один проход вместо .filter().flat()
    const orders: IOrder[] = flattenValidPages(ordersResponsesRaw);

    if (orders.length === 0) return [];

    // 2. ДИСТАНЦИОННАЯ ФИЛЬТРАЦИЯ: Оставляем ордера хаба + 1 прыжок
    const neighborSystems: number[] = await getNeighborSystems(hubSystemId);
    const orders1jump: IOrder[] = jumpFilter(orders, neighborSystems);

    // 3. АГРЕГАЦИЯ ОРДЕРОВ: Вычисляем лучшие buy/sell цены для каждого товара хаба
    type IStep1 = INumObj & { buy: number; sell: number; margin: number };
    const itemGen1 = ordersHandler(orders1jump) as IStep1[];

    if (itemGen1.length === 0) return [];

    // 4. ДОЗАГРУЗКА ИСТОРИИ ПОШТУЧНО
    const historyUrls: string[] = historyUrlConstructor(itemGen1, regionId);
    const historyResponses = await queryHandler<IHistory[]>(historyUrls);

    type IStep2 = IStep1 & { vol: number; orders: number };
    const itemGen2 = addHistoryToItems(
        itemGen1,
        historyResponses,
        activeSettings.time,
    ) as IStep2[];

    // 5. РАСЧЕТ МАРЖИНАЛЬНОСТИ И КОМИССИЙ
    const currentHubStats = activeStats[activeSettings.region];
    const itemGen3 = profitCalc(
        itemGen2,
        activeSettings,
        currentHubStats,
        activeSkills,
    ) as IStep2[];

    if (itemGen3.length === 0) return [];

    // 6. ОБОГАЩЕНИЕ СТАТИЧЕСКИМИ ИМЕНАМИ
    const infoUrls: string[] = infoUrlConstructor(itemGen3);
    const infoResponses = await queryHandler<IInfo>(infoUrls);

    type IStep3 = IStep2 & { name: string };
    const itemGen4 = addInfoToItem(itemGen3, infoResponses) as IStep3[];

    // 7. ИЗОЛИРОВАННАЯ ПОЛЬЗОВАТЕЛЬСКАЯ ФИЛЬТРАЦИЯ
    const finalResult = volFilter(
        ordersFilter(
            marginFilter(priceFilter(itemGen4, activeSettings), activeSettings),
            activeSettings,
        ),
        activeSettings,
    ) as unknown as IMarketItem[];

    return finalResult;
}
