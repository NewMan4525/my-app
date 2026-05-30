// ./src/lib/dataHandlers.ts
import { TIME } from '@/src/lib/constants';
import {
    calculateMinMaxPrices,
    safeArrayMap,
    fastParseYmd,
} from '@/src/lib/helpers';
import {
    IOrder,
    INumObj,
    IHistory,
    IInfo,
    IWarMarketPrices,
} from '@/src/types/interfaces';

export function getItemIds(orders: IOrder[]): number[] {
    const l = orders.length;
    const s = new Set<number>();
    for (let i = 0; i < l; i++) s.add(orders[i].type_id);
    const r = new Array<number>(s.size);
    let i = 0;
    for (const id of s) {
        r[i++] = id;
    }
    return r;
}

function addOrdersToId(
    orders: IOrder[],
): { type_id: number; orders: IOrder[] }[] {
    const ordersLen = orders.length;
    const ordersIndex = new Map<number, IOrder[]>();

    for (let i = 0; i < ordersLen; i++) {
        const order = orders[i];
        const id = order.type_id;
        let ordersGroup = ordersIndex.get(id);

        if (ordersGroup === undefined) {
            ordersGroup = [];
            ordersIndex.set(id, ordersGroup);
        }
        ordersGroup.push(order);
    }

    const result: { type_id: number; orders: IOrder[] }[] = new Array(
        ordersIndex.size,
    );
    let index = 0;
    for (const [type_id, ordersList] of ordersIndex) {
        result[index++] = { type_id, orders: ordersList };
    }

    return result;
}

function itemOrdersHandler(
    itemsWithOrders: { type_id: number; orders: IOrder[] }[],
): { type_id: number; buy: number; sell: number; margin: number }[] {
    const len = itemsWithOrders.length;
    const result: {
        type_id: number;
        buy: number;
        sell: number;
        margin: number;
    }[] = [];

    for (let i = 0; i < len; i++) {
        const item = itemsWithOrders[i];
        const { maxBuy, minSell } = calculateMinMaxPrices(item.orders);

        if (minSell === Infinity || maxBuy === -Infinity) {
            continue;
        }

        const margin = Math.floor((minSell / maxBuy - 1) * 100);
        result.push({
            type_id: item.type_id,
            buy: maxBuy,
            sell: minSell,
            margin: margin,
        });
    }

    return result;
}

export function ordersHandler(
    orders: IOrder[],
): { type_id: number; buy: number; sell: number; margin: number }[] {
    try {
        const itemsWithOrders = addOrdersToId(orders);
        return itemOrdersHandler(itemsWithOrders);
    } catch (error) {
        console.error(error);
        return [];
    }
}

export function addHistoryToItems<T extends INumObj>(
    items: T[],
    history: (IHistory[] | null)[],
    activeTimeSetting: string,
): (T & { vol: number; orders: number })[] {
    try {
        const windowMs = TIME[activeTimeSetting] || TIME['24h'];
        const safetyBuffer = activeTimeSetting === '24h' ? TIME['24h'] : 0;
        const dateLimit: number = Date.now() - (windowMs + safetyBuffer);

        return safeArrayMap(
            items,
            (item, i) => {
                const itemHistory = history[i];

                if (!itemHistory || itemHistory.length === 0) {
                    return { ...item, vol: 0, orders: 0 };
                }

                let totalVol = 0;
                let totalOrders = 0;
                let count = 0;
                const historyLen = itemHistory.length;

                for (let j = historyLen - 1; j >= 0; j--) {
                    const entry = itemHistory[j];
                    if (!entry) continue;

                    // Оптимизация: Используем сверхбыстрый парсинг дат
                    const entryDate = fastParseYmd(entry.date);
                    if (isNaN(entryDate) || entryDate < dateLimit) continue;

                    totalVol += entry.volume;
                    totalOrders += entry.order_count;
                    count++;
                }

                return {
                    ...item,
                    vol: count > 0 ? Math.floor(totalVol / count) : 0,
                    orders: count > 0 ? Math.floor(totalOrders / count) : 0,
                };
            },
            'addHistoryToItems',
        );
    } catch (error) {
        console.error('Ошибка в addHistoryToItems верхнего уровня:', error);
        return items as unknown as (T & { vol: number; orders: number })[];
    }
}

export function addInfoToItem<T extends INumObj>(
    items: T[],
    info: (IInfo | null)[],
): (T & { name: string })[] {
    const result = safeArrayMap(
        items,
        (item, i) => {
            const itemInfo = info[i];
            return {
                ...item,
                name: itemInfo ? itemInfo.name : 'Unknown Item',
            };
        },
        'addInfoToItem',
    );

    return result.length > 0
        ? result
        : (items as unknown as (T & { name: string })[]);
}

export function warHandler(orders: IOrder[]): IWarMarketPrices {
    const { maxBuy, minSell } = calculateMinMaxPrices(orders);

    return {
        maxBuyPrice: maxBuy === -Infinity ? 0 : maxBuy,
        minSellPrice: minSell === Infinity ? 0 : minSell,
    };
}
