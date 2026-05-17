// src/lib/filtres.ts
import { INumObj, ITradeSettings } from '@/src/types/interfaces';

// Больше НЕ импортируем tradeSettings из "./settings"

export function priceFilter(
    items: (INumObj | null)[],
    activeSettings: ITradeSettings,
): INumObj[] {
    const min = activeSettings.priceMin;
    const max = activeSettings.priceMax;
    return items.filter((item): item is INumObj => {
        if (item === null) return false;
        const meetsMin = item.buy >= (min ?? 0);
        const meetsMax =
            max === null || max === undefined ? true : item.sell <= max;
        return meetsMin && meetsMax;
    });
}

export function marginFilter(
    items: (INumObj | null)[],
    activeSettings: ITradeSettings,
): INumObj[] {
    const min = activeSettings.marginMin;
    const max = activeSettings.marginMax;
    return items.filter((item): item is INumObj => {
        if (item === null || item.margin === Infinity) return false;
        const meetsMin = item.margin >= min;
        const meetsMax = max ? item.margin <= max : true;
        return meetsMin && meetsMax;
    });
}

export function volFilter(
    items: (INumObj | null)[],
    activeSettings: ITradeSettings,
): INumObj[] {
    const min = activeSettings.volumeMin;
    const max = activeSettings.volumeMax;
    return items.filter((item): item is INumObj => {
        if (item === null || typeof item.vol !== 'number' || item.vol === 0)
            return false;
        const meetsMin = item.vol >= min;
        const meetsMax = max ? item.vol <= max : true;
        return meetsMin && meetsMax;
    });
}

export function ordersFilter(
    items: INumObj[],
    activeSettings: ITradeSettings,
): INumObj[] {
    const min = activeSettings.ordersMin;
    const max = activeSettings.ordersMax;
    return items.filter((item) => {
        const meetsMin = item.orders >= (min ?? 0);
        const meetsMax =
            max === null || max === undefined ? true : item.orders <= max;
        return meetsMin && meetsMax;
    });
}
