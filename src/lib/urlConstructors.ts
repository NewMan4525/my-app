// ./src/lib/urlConstructors.ts
import { BASE_URL } from './constants';
import { INumObj } from '@/src/types/interfaces';

export const urlsConstructor = {
    orders(currentReghionId: number, quantity: number): string[] {
        const madeUrl = `${BASE_URL}markets/${currentReghionId}/orders?order_type=all`;
        return Array.from(
            { length: quantity },
            (_, i) => `${madeUrl}&page=${i + 1}`,
        );
    },
    history(items: INumObj[], currentReghionId: number): string[] {
        const madeUrl = `${BASE_URL}markets/${currentReghionId}/history?type_id=`;
        return Array.from(
            { length: items.length },
            (_, i) => madeUrl + items[i].type_id,
        );
    },
    info(items: INumObj[]): string[] {
        const madeUrl = `${BASE_URL}latest/universe/types/`;
        return Array.from(
            { length: items.length },
            (_, i) => madeUrl + items[i].type_id,
        );
    },
    // Улучшенный метод: теперь принимает точный тип ордера (buy/sell) и номер страницы
    warOrders(
        currentRegionId: number,
        typeId: number,
        orderType: 'buy' | 'sell',
        page: number = 1,
    ): string {
        return `${BASE_URL}markets/${currentRegionId}/orders?order_type=${orderType}&page=${page}&type_id=${typeId}`;
    },
};
