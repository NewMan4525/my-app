// ./src/lib/filtres.ts
import { INumObj, ITradeSettings, IOrder } from '@/src/types/interfaces';
import { isInRange } from '@/src/lib/helpers';

export function priceFilter<T extends INumObj & { buy: number; sell: number }>(
    items: (T | null)[],
    activeSettings: ITradeSettings,
): T[] {
    const min = activeSettings.priceMin ?? 0;
    const max = activeSettings.priceMax;
    const len = items.length;
    const result: T[] = [];

    for (let i = 0; i < len; i++) {
        const item = items[i];
        if (item === null) continue;

        // Переиспользуем микрофункцию проверки диапазона для цен
        if (isInRange(item.buy, min) && isInRange(item.sell, 0, max)) {
            result.push(item);
        }
    }
    return result;
}

export function marginFilter<T extends INumObj & { margin: number }>(
    items: (T | null)[],
    activeSettings: ITradeSettings,
): T[] {
    const min = activeSettings.marginMin;
    const max = activeSettings.marginMax;
    const len = items.length;
    const result: T[] = [];

    for (let i = 0; i < len; i++) {
        const item = items[i];
        if (item === null || item.margin === Infinity) continue;

        if (isInRange(item.margin, min, max)) {
            result.push(item);
        }
    }
    return result;
}

export function volFilter<T extends INumObj & { vol?: unknown }>(
    items: (T | null)[],
    activeSettings: ITradeSettings,
): T[] {
    const min = activeSettings.volumeMin;
    const max = activeSettings.volumeMax;
    const len = items.length;
    const result: T[] = [];

    for (let i = 0; i < len; i++) {
        const item = items[i];
        if (item === null || typeof item.vol !== 'number' || item.vol === 0)
            continue;

        if (isInRange(item.vol, min, max)) {
            result.push(item);
        }
    }
    return result;
}

export function ordersFilter<T extends INumObj & { orders: number }>(
    items: T[],
    activeSettings: ITradeSettings,
): T[] {
    const min = activeSettings.ordersMin ?? 0;
    const max = activeSettings.ordersMax;
    const len = items.length;
    const result: T[] = [];

    for (let i = 0; i < len; i++) {
        const item = items[i];

        if (isInRange(item.orders, min, max)) {
            result.push(item);
        }
    }
    return result;
}

export function jumpFilter(
    orders: IOrder[],
    allowedSystems: number[],
): IOrder[] {
    const allowedSet = new Set<number>(allowedSystems);
    const len = orders.length;
    const result: IOrder[] = [];

    for (let i = 0; i < len; i++) {
        const order = orders[i];
        if (allowedSet.has(order.system_id)) {
            result.push(order);
        }
    }
    return result;
}
