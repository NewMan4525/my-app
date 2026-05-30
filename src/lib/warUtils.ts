// ./src/lib/warUtils.ts
import { IMyUploadedOrder } from '@/src/types/interfaces';
import { splitCsvLine } from '@/src/lib/helpers';

/**
 * Отказоустойчивый построчный парсинг CSV файла Marketlogs игры EVE Online
 */
export function parseMarketLogCsv(fileContent: string): IMyUploadedOrder[] {
    const lines = fileContent.split(/\r?\n/);
    const linesLen = lines.length;
    if (linesLen < 2) return [];

    const firstLineCols = lines[0].split(',');
    const headersLen = firstLineCols.length;
    const headers = new Array<string>(headersLen);
    for (let i = 0; i < headersLen; i++) {
        headers[i] = firstLineCols[i].trim().toLowerCase();
    }

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
    const maxRequiredIdx = Math.max(
        typeIDIdx,
        bidIdx,
        priceIdx,
        orderIDIdx,
        stationIDIdx,
    );

    for (let i = 1; i < linesLen; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Переиспользуем микрофункцию безопасного сплита из хелперов
        const cols = splitCsvLine(line);
        if (cols.length <= maxRequiredIdx) continue;

        const typeID = parseInt(cols[typeIDIdx], 10);
        const price = parseFloat(cols[priceIdx]);
        const sysId = cols[solarSystemIDIdx];
        const regId = cols[regionIDIdx];

        if (!sysId || !regId || isNaN(typeID) || isNaN(price)) continue;

        const cleanSysId = sysId.trim();
        const cleanRegId = regId.trim();
        if (!cleanSysId || !cleanRegId) continue;

        parsedOrders.push({
            orderID: cols[orderIDIdx].trim(),
            typeID,
            range: rangeIdx !== -1 ? cols[rangeIdx].trim().toLowerCase() : '1',
            stationID: cols[stationIDIdx].trim(),
            stationName: cols[stationNameIdx]
                ? cols[stationNameIdx].trim()
                : '',
            solarSystemID: cleanSysId,
            regionID: cleanRegId,
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
    const len = orders.length;

    for (let i = 0; i < len; i++) {
        const order = orders[i];
        const key = `${order.typeID}-${order.bid}`;
        let list = groupedMap.get(key);
        if (list === undefined) {
            list = [];
            groupedMap.set(key, list);
        }
        list.push(order);
    }

    for (const [key, list] of groupedMap.entries()) {
        // Ультрабыстрая проверка: 'e' на конце означает 'true' (BUY-ордер)
        const isBuy = key.charCodeAt(key.length - 1) === 101;

        list.sort((a, b) => (isBuy ? b.price - a.price : a.price - b.price));
    }

    return groupedMap;
}
