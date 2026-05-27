// ./src/lib/warUtils.ts

import { IMyUploadedOrder } from '@/src/types/interfaces';

/**
 * Отказоустойчивый построчный парсинг CSV файла Marketlogs игры EVE Online
 */
export function parseMarketLogCsv(fileContent: string): IMyUploadedOrder[] {
    const lines = fileContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const orderIDIdx = headers.indexOf('orderid');
    const typeIDIdx = headers.indexOf('typeid');
    const bidIdx = headers.indexOf('bid');
    const priceIdx = headers.indexOf('price');
    const volRemainingIdx = headers.indexOf('volremaining');
    const regionIDIdx = headers.indexOf('regionid');
    const solarSystemIDIdx = headers.indexOf('solarsystemid');
    const stationIDIdx = headers.indexOf('stationid');
    const stationNameIdx = headers.indexOf('stationname');
    const rangeIdx = headers.indexOf('range');

    if (
        typeIDIdx === -1 ||
        bidIdx === -1 ||
        priceIdx === -1 ||
        orderIDIdx === -1 ||
        stationIDIdx === -1
    ) {
        console.error('Critical CSV headers missing in uploaded file.');
        return [];
    }

    const parsedOrders: IMyUploadedOrder[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        if (
            cols.length <=
            Math.max(typeIDIdx, bidIdx, priceIdx, orderIDIdx, stationIDIdx)
        )
            continue;

        const typeID = parseInt(cols[typeIDIdx], 10);
        const price = parseFloat(cols[priceIdx]);
        const sysId = cols[solarSystemIDIdx]?.trim();
        const regId = cols[regionIDIdx]?.trim();

        if (!sysId || !regId || isNaN(typeID) || isNaN(price)) continue;

        parsedOrders.push({
            orderID: cols[orderIDIdx].trim(),
            typeID,
            range: rangeIdx !== -1 ? cols[rangeIdx].trim().toLowerCase() : '1',
            stationID: cols[stationIDIdx].trim(),
            stationName: cols[stationNameIdx]
                ? cols[stationNameIdx].trim()
                : '',
            solarSystemID: sysId,
            regionID: regId,
            bid: cols[bidIdx].toLowerCase() === 'true',
            price,
            volRemaining: parseFloat(cols[volRemainingIdx]) || 0,
        });
    }
    return parsedOrders;
}

/**
 * Группирует и сортирует ордера игрока для выявления лидера (флагмана) стека
 */
export function buildGroupedOrdersMap(
    orders: IMyUploadedOrder[],
): Map<string, IMyUploadedOrder[]> {
    const groupedMap = new Map<string, IMyUploadedOrder[]>();

    for (const order of orders) {
        const key = `${order.typeID}-${order.bid}`;
        if (!groupedMap.has(key)) groupedMap.set(key, []);
        groupedMap.get(key)!.push(order);
    }

    groupedMap.forEach((list, key) => {
        const isBuy = key.endsWith('-true');
        // BUY: Самый дорогой закуп вверх. SELL: Самый дешевый селл вверх.
        list.sort((a, b) => (isBuy ? b.price - a.price : a.price - b.price));
    });

    return groupedMap;
}
