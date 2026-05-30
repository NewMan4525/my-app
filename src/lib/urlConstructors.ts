// ./src/lib/urlConstructors.ts
import { BASE_URL } from './constants';
import { INumObj } from '@/src/types/interfaces';
import { buildUrlsFromItems } from '@/src/lib/helpers';

export function ordersUrlConstructor(
    currentRegionId: number,
    quantity: number,
): string[] {
    const u = `${BASE_URL}markets/${currentRegionId}/orders?order_type=all&page=`;
    const r = new Array<string>(quantity);
    for (let i = 0; i < quantity; i++) r[i] = u + (i + 1);
    return r;
}

export function historyUrlConstructor(
    items: INumObj[],
    currentRegionId: number,
): string[] {
    const u = `${BASE_URL}markets/${currentRegionId}/history?type_id=`;
    return buildUrlsFromItems(u, items);
}

export function infoUrlConstructor(items: INumObj[]): string[] {
    const u = `${BASE_URL}latest/universe/types/`;
    return buildUrlsFromItems(u, items);
}

export function warUrlConstructor(
    currentRegionId: number,
    typeId: number,
    orderType: 'buy' | 'sell',
    page: number = 1,
): string {
    return `${BASE_URL}markets/${currentRegionId}/orders?order_type=${orderType}&page=${page}&type_id=${typeId}`;
}
