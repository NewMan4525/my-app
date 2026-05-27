// ./src/services/warExecuter.ts

import { urlsConstructor } from '@/src/lib/urlConstructors';
import { queryHandler } from '@/src/lib/querysHandler';
import { getNeighborSystems, jumpFilter } from '@/src/lib/location';
import { IOrder, IInfo, IWarItem } from '@/src/types/interfaces';
import { parseMarketLogCsv, buildGroupedOrdersMap } from '@/src/lib/warUtils';
import pLimit from 'p-limit';

export async function executeWarAnalysis(
    fileContent: string,
): Promise<IWarItem[]> {
    const myParsedOrders = parseMarketLogCsv(fileContent);
    if (myParsedOrders.length === 0) return [];

    const myOwnOrderIdsSet = new Set(myParsedOrders.map((o) => o.orderID));
    const uniqueMarketPairsSet = new Set(
        myParsedOrders.map((o) => `${o.typeID}-${o.bid ? 'buy' : 'sell'}`),
    );
    const myGroupedOrdersMap = buildGroupedOrdersMap(myParsedOrders);

    const allWarUrls: string[] = [];
    const urlMetadata: { typeID: number; orderType: 'buy' | 'sell' }[] = [];
    const limit = pLimit(5);

    // HEAD-запросы через пул p-limit для определения точного количества страниц x-pages
    await Promise.all(
        Array.from(uniqueMarketPairsSet).map((pairKey) =>
            limit(async () => {
                const [typeIdStr, orderTypeStr] = pairKey.split('-');
                const typeID = parseInt(typeIdStr, 10);
                const apiOrderType = orderTypeStr as 'buy' | 'sell';
                const sample = myParsedOrders.find(
                    (o) =>
                        o.typeID === typeID &&
                        o.bid === (apiOrderType === 'buy'),
                );
                if (!sample) return;

                try {
                    const firstUrl = urlsConstructor.warOrders(
                        parseInt(sample.regionID, 10),
                        typeID,
                        apiOrderType,
                        1,
                    );
                    const response = await fetch(firstUrl, { method: 'HEAD' });
                    const pagesQuantity =
                        Number(response.headers.get('x-pages')) || 1;

                    for (let p = 1; p <= pagesQuantity; p++) {
                        allWarUrls.push(
                            urlsConstructor.warOrders(
                                parseInt(sample.regionID, 10),
                                typeID,
                                apiOrderType,
                                p,
                            ),
                        );
                        urlMetadata.push({ typeID, orderType: apiOrderType });
                    }
                } catch (err) {
                    console.error(
                        `ESI HEAD Request failed for key ${pairKey}:`,
                        err,
                    );
                }
            }),
        ),
    );

    // Скачивание стаканов ESI и имен SDE через queryHandler
    const uniqueTypeIds = Array.from(
        new Set(myParsedOrders.map((o) => o.typeID)),
    );
    const fakeNumObjects = uniqueTypeIds.map((id) => ({
        type_id: id,
        buy: 0,
        sell: 0,
        margin: 0,
        vol: 0,
        orders: 0,
    }));

    const marketResponses = await queryHandler<IOrder[]>(allWarUrls);
    const infoResponses = await queryHandler<IInfo>(
        urlsConstructor.info(fakeNumObjects),
    );

    const globalOrdersMap = new Map<string, IOrder[]>();
    marketResponses.forEach((pageData, idx) => {
        if (!pageData) return;
        const meta = urlMetadata[idx];
        const key = `${meta.typeID}-${meta.orderType}`;
        if (!globalOrdersMap.has(key)) globalOrdersMap.set(key, []);
        globalOrdersMap.get(key)!.push(...pageData);
    });

    const infoMap = new Map(
        uniqueTypeIds.map((id, index) => [
            id,
            infoResponses[index]?.name ?? `Item ${id}`,
        ]),
    );
    const resultTable: IWarItem[] = [];

    // Изолированный атомарный анализ по каждому индивидуальному ордеру из файла лога
    for (const myOrder of myParsedOrders) {
        const orderTypeKey = myOrder.bid ? 'buy' : 'sell';
        const marketMapKey = `${myOrder.typeID}-${orderTypeKey}`;

        const allMarketOrders = globalOrdersMap.get(marketMapKey) || [];
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
        const itemName =
            infoMap.get(myOrder.typeID) || `Item ${myOrder.typeID}`;

        const currentGroup =
            myGroupedOrdersMap.get(`${myOrder.typeID}-${myOrder.bid}`) || [];
        const isLeaderOfMyStack = currentGroup[0]?.orderID === myOrder.orderID;

        // Если это не верхний ордер в нашем внутреннем стеке — сразу в авто-игнор
        if (!isLeaderOfMyStack) {
            resultTable.push({
                name: itemName,
                vol: myOrder.volRemaining,
                buy: myOrder.bid ? currentGroup[0]?.price : activeMyPrice,
                sell: myOrder.bid ? activeMyPrice : currentGroup[0]?.price,
                roi: 0,
                ipm: 0,
                orderID: myOrder.orderID,
                status: 'IGNORED',
                isBuy: myOrder.bid,
            });
            continue;
        }

        // Фильтрация ЧУЖИХ конкурентов для флагманского ордера группы
        const competitors = localAreaOrders.filter((o) => {
            if (myOrder.bid) {
                if (!o.is_buy_order || o.price <= activeMyPrice) return false;
            } else {
                if (
                    o.is_buy_order ||
                    o.location_id !== myStationId ||
                    o.price >= activeMyPrice
                )
                    return false;
            }

            if (
                String(o.order_id) === String(myOrder.orderID) ||
                myOwnOrderIdsSet.has(String(o.order_id))
            ) {
                return false;
            }

            if (myOrder.bid) {
                if (
                    myOrder.range === 'station' ||
                    myOrder.range === 'use_station'
                )
                    return o.location_id === myStationId;
                if (myOrder.range === 'solarsystem')
                    return o.system_id === myHubSystemId;
            }
            return true;
        });

        const hasCompetitors = competitors.length > 0;
        let compPrice = activeMyPrice;
        if (hasCompetitors) {
            compPrice = myOrder.bid
                ? Math.max(...competitors.map((o) => o.price))
                : Math.min(...competitors.map((o) => o.price));
        }

        resultTable.push({
            name: itemName,
            vol: myOrder.volRemaining,
            buy: myOrder.bid ? compPrice : activeMyPrice,
            sell: myOrder.bid ? activeMyPrice : compPrice,
            roi: 0,
            ipm: 0,
            orderID: myOrder.orderID,
            // Полностью чистое, строго типизированное выражение без any
            status: hasCompetitors ? 'OUTBID' : '',
            isBuy: myOrder.bid,
        });
    }

    return resultTable;
}
