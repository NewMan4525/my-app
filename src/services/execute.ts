// ./src/services/execute.ts
import { urlsConstructor } from '@/src/lib/urlConstructors';
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
import { getNeighborSystems, jumpFilter } from '@/src/lib/location';
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
} from '@/src/lib/filtres';
import { queryHandler } from '@/src/lib/querysHandler';
import { profitCalc } from '@/src/lib/profitCalculations';

export async function executeGetData(
    activeSettings: ITradeSettings,
    activeStats: IUserStats,
    activeSkills: IUserSkills,
): Promise<IMarketItem[]> {
    const regionId: number = HUBS[activeSettings.region].region.id;
    const hubSystemId: number = HUBS[activeSettings.region].system.id;

    // 1. ПОЛУЧЕНИЕ ДАННЫХ ОРДЕРОВ: Стягиваем ВСЕ сырые ордера региона целиком
    const firstPageUrl: string = urlsConstructor.orders(regionId, 1)[0];
    const initialResp = await fetch(firstPageUrl, { method: 'HEAD' });
    const quantity: number = Number(initialResp.headers.get('x-pages')) || 1;

    const orderUrls: string[] = urlsConstructor.orders(regionId, quantity);

    // Получаем массив, который может содержать массивы ордеров или null
    const ordersResponsesRaw = await queryHandler<IOrder[]>(orderUrls);

    // БЕЗОПАСНАЯ ИЗОЛЯЦИЯ NULL ДЛЯ ОРДЕРОВ: Оставляем только успешные страницы
    const ordersResponses: IOrder[][] = ordersResponsesRaw.filter(
        (page): page is IOrder[] => page !== null,
    );
    const orders: IOrder[] = ordersResponses.flat();

    if (!orders || orders.length === 0) return [];

    // 2. ДИСТАНЦИОННАЯ ФИЛЬТРАЦИЯ: Оставляем ордера хаба + 1 прыжок
    const neighborSystems: number[] = await getNeighborSystems(hubSystemId);
    const orders1jump: IOrder[] = jumpFilter(orders, neighborSystems);

    // 3. АГРЕГАЦИЯ ОРДЕРОВ: Вычисляем лучшие buy/sell цены для каждого товара хаба
    const itemGen1Raw = ordersHandler(orders1jump);

    // Очищаем промежуточный массив от null значений бэкенда через Type Guard
    const itemGen1: INumObj[] = itemGen1Raw.filter(
        (item): item is INumObj => item !== null,
    );

    if (itemGen1.length === 0) return [];

    // 4. ДОЗАГРУЗКА ИСТОРИИ ПОШТУЧНО: Передаем активное время третьим аргументом (Фикс ошибки 2)
    const historyUrls: string[] = urlsConstructor.history(itemGen1, regionId);
    const historyResponses = await queryHandler<IHistory[]>(historyUrls);
    const itemGen2Raw = addHistoryToItems(
        itemGen1,
        historyResponses,
        activeSettings.time,
    );

    const itemGen2: INumObj[] = itemGen2Raw.filter(
        (item): item is INumObj => item !== null,
    );

    // 5. РАСЧЕТ МАРЖИНАЛЬНОСТИ И КОМИССИЙ: Считаем ROI/IPM с учетом персональных скиллов игрока
    const currentHubStats = activeStats[activeSettings.region];
    const itemGen3 = profitCalc(
        itemGen2,
        activeSettings,
        currentHubStats,
        activeSkills,
    );

    if (itemGen3.length === 0) return [];

    // 6. ОБОГАЩЕНИЕ СТАТИЧЕСКИМИ ИМЕНАМИ: Передаем тип IInfo без массивов (Фикс ошибки 3)
    const infoUrls: string[] = urlsConstructor.info(itemGen3);
    const infoResponses = await queryHandler<IInfo>(infoUrls);
    const itemGen4Raw = addInfoToItem(itemGen3, infoResponses);

    // Переводим через safe cast в unknown -> IMarketItem[] для строгой типизации вывода
    const itemGen4 = itemGen4Raw as unknown as IMarketItem[];

    // 7. ИЗОЛИРОВАННАЯ ПОЛЬЗОВАТЕЛЬСКАЯ ФИЛЬТРАЦИЯ: Применяем кастомные фильтры формы в последнюю очередь
    const filterInput = itemGen4 as unknown as (INumObj | null)[];

    const filterStep1 = priceFilter(filterInput, activeSettings);
    const filterStep2 = marginFilter(filterStep1, activeSettings);
    const filterStep3 = ordersFilter(filterStep2, activeSettings);
    const filterStep4 = volFilter(filterStep3, activeSettings);

    const finalResult = filterStep4 as unknown as IMarketItem[];

    return finalResult;
}
