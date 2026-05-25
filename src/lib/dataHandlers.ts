// ./src/lib/dataHandlers.ts

import { TIME } from '@/src/lib/constants';
import { tradeSettings } from '@/src/lib/settings';
import { IOrder, INumObj, IHistory, IInfo } from '@/src/types/interfaces';

export function getItemIds(orders: IOrder[]): number[] {
    const ids = orders.map((item) => item.type_id);
    return [...new Set(ids)];
}

function addOrdersToId(
    itemsIds: number[],
    orders: IOrder[],
): { type_id: number; orders: IOrder[] }[] {
    // Типизируем индекс: ключи — id (числа), значения — массивы ордеров
    const ordersIndex = orders.reduce<Record<number, IOrder[]>>(
        (acc, order) => {
            if (!acc[order.type_id]) {
                acc[order.type_id] = [];
            }
            acc[order.type_id].push(order);
            return acc;
        },
        {},
    );
    // Используем .map для формирования финального массива
    return itemsIds.map((id) => ({
        type_id: id,
        orders: ordersIndex[id] || [],
    }));
}

function itemOrdersHandler(
    itemsWithOrders: { type_id: number; orders: IOrder[] }[],
): ({
    type_id: number;
    buy: number;
    sell: number;
    margin: number;
} | null)[] {
    return itemsWithOrders
        .map((item) => {
            const sellOrders = item.orders.filter((o) => !o.is_buy_order);
            const buyOrders = item.orders.filter((o) => o.is_buy_order);
            if (sellOrders.length === 0 || buyOrders.length === 0) return null;
            const minSell = Math.min(...sellOrders.map((o) => o.price));
            const maxBuy = Math.max(...buyOrders.map((o) => o.price));
            // грязный профит в процентах
            const margin = Math.floor((minSell / maxBuy - 1) * 100);
            return {
                type_id: item.type_id,
                buy: maxBuy,
                sell: minSell,
                margin: margin, // Это черновая прибыль
            };
        })
        .filter(Boolean); // Убираем пустые результаты
}

export function ordersHandler(orders: IOrder[]): (INumObj | null)[] {
    try {
        const itemIds: number[] = getItemIds(orders);

        const itemsWithOrders: {
            type_id: number;
            orders: IOrder[];
        }[] = addOrdersToId(itemIds, orders);

        const result: ({
            type_id: number;
            buy: number;
            sell: number;
            margin: number;
        } | null)[] = itemOrdersHandler(itemsWithOrders);

        return result;
    } catch (error) {
        console.log(error);
        return [];
    }
}

export function addHistoryToItems(
    items: INumObj[],
    history: (IHistory[] | null)[], // Теперь здесь может быть null
    activeTimeSetting: string,
): INumObj[] {
    try {
        const windowMs = TIME[activeTimeSetting] || TIME['24h'];
        const safetyBuffer = activeTimeSetting === '24h' ? TIME['24h'] : 0;
        const dateLimit: number = Date.now() - (windowMs + safetyBuffer);

        return items.map((item, i) => {
            // БЕЗОПАСНАЯ ПРОВЕРКА: Если элемент null, сразу возвращаем предмет с нулевой историей
            const itemHistory = history[i];
            if (!itemHistory || itemHistory.length === 0) {
                return { ...item, vol: 0, orders: 0 };
            }

            let totalVol = 0;
            let totalOrders = 0;
            let count = 0;

            for (let j = itemHistory.length - 1; j >= 0; j--) {
                const entry = itemHistory[j];
                if (!entry) continue;

                const entryDate = Date.parse(entry.date);
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
        });
    } catch (error) {
        console.error('Ошибка в addHistoryToItems:', error);
        return items;
    }
}

export function addInfoToItem(
    items: INumObj[],
    info: (IInfo | null)[], // Принимаем массив, сохранивший исходную длину
): { [key: string]: string | number }[] {
    try {
        return items.map((item, i) => ({
            ...item,
            // Сопоставление по индексу "i" теперь на 100% безопасно
            name: info[i]?.name ?? 'Unknown Item',
        }));
    } catch (error) {
        console.error('Ошибка в addInfoToItem:', error);
        return items;
    }
}
