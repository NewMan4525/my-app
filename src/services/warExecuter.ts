// ./src/services/warExecuter.ts
import { urlsConstructor } from '@/src/lib/urlConstructors';
import { queryHandler } from '@/src/lib/querysHandler';
import { getNeighborSystems, jumpFilter } from '@/src/lib/location';
import { IOrder, IInfo } from '@/src/types/interfaces';

export interface IWarItem {
    name: string;
    vol: number;
    buy: number;
    sell: number;
    roi: number;
    ipm: number;
    orderID: string;
}

export interface IMyUploadedOrder {
    orderID: string;
    typeID: number;
    charID: string;
    charName: string;
    regionID: string;
    regionName: string;
    solarSystemID: string;
    solarSystemName: string;
    stationID: string;
    stationName: string;
    range: string;
    bid: boolean;
    price: number;
    volEntered: number;
    volRemaining: number;
    minVolume: number;
    issueDate: string;
    orderState: string;
    duration: number;
    escrow: number;
    isCorp: boolean;
    accountID: string;
    accountOwnerID: string;
    accountKey: number;
}

export async function executeWarAnalysis(
    fileContent: string,
): Promise<IWarItem[]> {
    const lines = fileContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    // ИСПРАВЛЕНИЕ: Берем строго нулевой (первый) элемент массива строк lines[0]
    const headers = lines[0]
        .split(',')
        .map((h: string) => h.trim().toLowerCase());

    const orderIDIdx = headers.indexOf('orderid');
    const typeIDIdx = headers.indexOf('typeid');
    const bidIdx = headers.indexOf('bid');
    const priceIdx = headers.indexOf('price');
    const volRemainingIdx = headers.indexOf('volremaining');
    const regionIDIdx = headers.indexOf('regionid');
    const solarSystemIDIdx = headers.indexOf('solarsystemid');
    const stationIDIdx = headers.indexOf('stationid');
    const stationNameIdx = headers.indexOf('stationname');

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

    const myParsedOrders: IMyUploadedOrder[] = [];
    const uniqueTypeIds = new Set<number>();

    // Наборы для быстрого ОЗУ-поиска всех НАШИХ ID ордеров и цен
    const myOwnOrderIdsSet = new Set<string>();
    const myOwnPricesSet = new Set<number>();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        if (
            columns.length <=
            Math.max(typeIDIdx, bidIdx, priceIdx, orderIDIdx, stationIDIdx)
        )
            continue;

        const typeID = parseInt(columns[typeIDIdx], 10);
        const price = parseFloat(columns[priceIdx]);

        const rawSystemId = columns[solarSystemIDIdx]?.trim();
        const rawRegionId = columns[regionIDIdx]?.trim();

        // Жесткая проверка: если колонок нет в файле — пропускаем строку, никакой Житы по умолчанию
        if (!rawSystemId || !rawRegionId) continue;

        // ИСПРАВЛЕНИЕ: Извлекаем cleanOrderId из колонок строки
        const cleanOrderId = columns[orderIDIdx].trim();

        myParsedOrders.push({
            orderID: cleanOrderId,
            typeID: typeID,
            charID: '',
            charName: '',
            regionName: '',
            solarSystemName: '',
            range: '',
            duration: 0,
            escrow: 0,
            isCorp: false,
            accountID: '',
            accountOwnerID: '',
            accountKey: 0,
            minVolume: 1,
            issueDate: '',
            orderState: '',
            stationID: columns[stationIDIdx].trim(),
            stationName: columns[stationNameIdx]
                ? columns[stationNameIdx].trim()
                : '',
            solarSystemID: rawSystemId,
            regionID: rawRegionId,
            bid: columns[bidIdx].toLowerCase() === 'true',
            price: price,
            volEntered: 0,
            volRemaining: parseFloat(columns[volRemainingIdx]) || 0,
        });

        uniqueTypeIds.add(typeID);
        myOwnOrderIdsSet.add(cleanOrderId);
        myOwnPricesSet.add(price);
    }

    const typeIdsArray = Array.from(uniqueTypeIds);
    const allWarUrls: string[] = [];
    const urlMetadata: { typeID: number; bid: boolean }[] = [];

    for (const typeID of typeIdsArray) {
        const sampleOrder = myParsedOrders.find((o) => o.typeID === typeID);
        const regionId = sampleOrder
            ? parseInt(sampleOrder.regionID, 10)
            : 10000002;
        const apiOrderType: 'buy' | 'sell' = sampleOrder?.bid ? 'buy' : 'sell';

        try {
            const firstPageUrl = urlsConstructor.warOrders(
                regionId,
                typeID,
                apiOrderType,
                1,
            );
            const response = await fetch(firstPageUrl, { method: 'HEAD' });
            const pagesQuantity = Number(response.headers.get('x-pages')) || 1;

            for (let page = 1; page <= pagesQuantity; page++) {
                allWarUrls.push(
                    urlsConstructor.warOrders(
                        regionId,
                        typeID,
                        apiOrderType,
                        page,
                    ),
                );
                urlMetadata.push({ typeID, bid: sampleOrder?.bid ?? false });
            }
        } catch (error) {
            console.error(
                `Failed to HEAD headers for typeID ${typeID}:`,
                error,
            );
        }
    }

    const fakeNumObjects = typeIdsArray.map((id) => ({
        type_id: id,
        buy: 0,
        sell: 0,
        margin: 0,
        vol: 0,
        orders: 0,
    }));
    const allWarInfoUrls: string[] = urlsConstructor.info(fakeNumObjects);

    const marketResponses = await queryHandler<IOrder[]>(allWarUrls);
    const infoResponses = await queryHandler<IInfo>(allWarInfoUrls);

    const globalOrdersMap = new Map<number, IOrder[]>();
    for (let i = 0; i < marketResponses.length; i++) {
        const pageData = marketResponses[i];
        if (!pageData) continue;
        const meta = urlMetadata[i];

        if (!globalOrdersMap.has(meta.typeID)) {
            globalOrdersMap.set(meta.typeID, []);
        }
        globalOrdersMap.get(meta.typeID)!.push(...pageData);
    }

    const infoMap = new Map<number, string>();
    typeIdsArray.forEach((id, index) => {
        infoMap.set(id, infoResponses[index]?.name ?? `Unknown Item ${id}`);
    });

    const resultTable: IWarItem[] = [];

    // АНАЛИЗ С УЧЕТОМ АВТО-ИСКЛЮЧЕНИЯ НАШИХ СОБСТВЕННЫХ КОНКУРИРУЮЩИХ ОРДЕРОВ
    for (const myOrder of myParsedOrders) {
        const allMarketOrders = globalOrdersMap.get(myOrder.typeID) || [];
        const myHubSystemId = parseInt(myOrder.solarSystemID, 10);
        const myStationId = parseInt(myOrder.stationID, 10);

        const allowedSystems = await getNeighborSystems(myHubSystemId);
        const localAreaOrders = jumpFilter(allMarketOrders, allowedSystems);

        const myCurrentLiveOrder = localAreaOrders.find(
            (o) => String(o.order_id) === String(myOrder.orderID),
        );
        const activeMyPrice = myCurrentLiveOrder
            ? myCurrentLiveOrder.price
            : myOrder.price;

        const locationShort = myOrder.stationName.includes('Jita')
            ? 'Jita'
            : myOrder.stationName.includes('Perimeter')
              ? 'Perim'
              : 'Hub';

        const itemName =
            infoMap.get(myOrder.typeID) || `Item ${myOrder.typeID}`;

        if (myOrder.bid) {
            // --- BUY ORDERS ---
            const competitorsHigherBuy = localAreaOrders.filter((o) => {
                if (!o.is_buy_order || o.price <= activeMyPrice) return false;

                const isMyOwnOrder =
                    myOwnOrderIdsSet.has(String(o.order_id)) ||
                    myOwnPricesSet.has(o.price);
                if (isMyOwnOrder) return false;

                const isSameStation = o.location_id === myStationId;
                const isRegionalRange =
                    o.range === 'region' || parseInt(o.range, 10) >= 1;

                return isSameStation || isRegionalRange;
            });

            if (competitorsHigherBuy.length > 0) {
                const bestCompetitorPrice = Math.max(
                    ...competitorsHigherBuy.map((o) => o.price),
                );
                resultTable.push({
                    name: `⚔️ [BUY UNDER_CUT] ${itemName}`,
                    vol: myOrder.volRemaining,
                    buy: bestCompetitorPrice,
                    sell: activeMyPrice,
                    roi: 0,
                    ipm: 0,
                    orderID: myOrder.orderID,
                });
            } else {
                resultTable.push({
                    name: `👑 [BUY TOP_1] ${itemName}`,
                    vol: myOrder.volRemaining,
                    buy: activeMyPrice,
                    sell: activeMyPrice,
                    roi: 0,
                    ipm: 0,
                    orderID: myOrder.orderID,
                });
            }
        } else {
            // --- SELL ORDERS ---
            const competitorsLowerSell = localAreaOrders.filter((o) => {
                if (
                    o.is_buy_order ||
                    o.location_id !== myStationId ||
                    o.price >= activeMyPrice
                )
                    return false;

                const isMyOwnOrder =
                    myOwnOrderIdsSet.has(String(o.order_id)) ||
                    myOwnPricesSet.has(o.price);
                if (isMyOwnOrder) return false;

                return true;
            });

            if (competitorsLowerSell.length > 0) {
                const bestCompetitorPrice = Math.min(
                    ...competitorsLowerSell.map((o) => o.price),
                );
                resultTable.push({
                    name: `⚔️ [SELL UNDER_CUT] ${itemName}`,
                    vol: myOrder.volRemaining,
                    buy: activeMyPrice,
                    sell: bestCompetitorPrice,
                    roi: 0,
                    ipm: 0,
                    orderID: myOrder.orderID,
                });
            } else {
                resultTable.push({
                    name: `👑 [SELL TOP_1] ${itemName}`,
                    vol: myOrder.volRemaining,
                    buy: activeMyPrice,
                    sell: activeMyPrice,
                    roi: 0,
                    ipm: 0,
                    orderID: myOrder.orderID,
                });
            }
        }
    }

    return resultTable;
}
