// ./src/services/warExecuter.ts
import {
    warUrlConstructor,
    infoUrlConstructor,
} from '@/src/lib/urlConstructors';
import { queryHandler } from '@/src/lib/querysHandler';
import { getNeighborSystems } from '@/src/lib/location';
import { jumpFilter } from '@/src/lib/filters';
import { IOrder, IInfo, IWarItem } from '@/src/types/interfaces';
import { parseMarketLogCsv, buildGroupedOrdersMap } from '@/src/lib/warUtils';
import {
    parsePairKey,
    createFakeNumObjects,
    isValidData,
} from '@/src/lib/helpers';
import pLimit from 'p-limit';

export async function executeWarAnalysis(
    fileContent: string,
): Promise<IWarItem[]> {
    const myParsedOrders = parseMarketLogCsv(fileContent);
    const parsedLen = myParsedOrders.length;
    if (parsedLen === 0) return [];

    // 1. Быстро собираем ID собственных ордеров через чистый цикл
    const myOwnOrderIdsSet = new Set<string>();
    const uniqueMarketPairsSet = new Set<string>();
    const uniqueTypeIdsSet = new Set<number>();
    const uniqueSystemsSet = new Set<number>();

    for (let i = 0; i < parsedLen; i++) {
        const o = myParsedOrders[i];
        myOwnOrderIdsSet.add(String(o.orderID));
        uniqueMarketPairsSet.add(`${o.typeID}-${o.bid ? 'buy' : 'sell'}`);
        uniqueTypeIdsSet.add(o.typeID);
        uniqueSystemsSet.add(parseInt(o.solarSystemID, 10));
    }

    const myGroupedOrdersMap = buildGroupedOrdersMap(myParsedOrders);

    // Оптимизация шага 1: выносим сбор соседей систем ЗА ПРЕДЕЛЫ цикла ордеров (Пакетный сбор)
    const neighborSystemsMap = new Map<number, number[]>();
    const systemIdsArr = Array.from(uniqueSystemsSet);
    const systemsLen = systemIdsArr.length;

    for (let i = 0; i < systemsLen; i++) {
        const sysId = systemIdsArr[i];
        const neighbors = await getNeighborSystems(sysId);
        neighborSystemsMap.set(sysId, neighbors);
    }

    const allWarUrls: string[] = [];
    const urlMetadata: { typeID: number; orderType: 'buy' | 'sell' }[] = [];
    const limit = pLimit(50); // Увеличиваем лимит конкурентности для разгона

    const pairsArr = Array.from(uniqueMarketPairsSet);
    const pairsLen = pairsArr.length;
    const headTasks = new Array<Promise<void>>(pairsLen);

    // HEAD-запросы через оптимизированный пул
    for (let i = 0; i < pairsLen; i++) {
        const pairKey = pairsArr[i];
        headTasks[i] = limit(async () => {
            const { typeID, orderType: apiOrderType } = parsePairKey(pairKey);
            const isBuyTarget = apiOrderType === 'buy';

            // Находим сэмпл через быстрый цикл вместо .find()
            let sample = null;
            for (let j = 0; j < parsedLen; j++) {
                const o = myParsedOrders[j];
                if (o.typeID === typeID && o.bid === isBuyTarget) {
                    sample = o;
                    break;
                }
            }
            if (sample === null) return;

            try {
                const rId = parseInt(sample.regionID, 10);
                const firstUrl = warUrlConstructor(
                    rId,
                    typeID,
                    apiOrderType,
                    1,
                );
                const response = await fetch(firstUrl, { method: 'HEAD' });
                const pagesQuantity =
                    Number(response.headers.get('x-pages')) || 1;

                for (let p = 1; p <= pagesQuantity; p++) {
                    allWarUrls.push(
                        warUrlConstructor(rId, typeID, apiOrderType, p),
                    );
                    urlMetadata.push({ typeID, orderType: apiOrderType });
                }
            } catch (err) {
                console.error(
                    `ESI HEAD Request failed for key ${pairKey}:`,
                    err,
                );
            }
        });
    }

    await Promise.all(headTasks);

    const uniqueTypeIds = Array.from(uniqueTypeIdsSet);
    const uniqueTypesLen = uniqueTypeIds.length;

    // Вынесено в хелпер для чистоты кода
    const fakeNumObjects = createFakeNumObjects(uniqueTypeIds);

    const marketResponses = await queryHandler<IOrder[]>(allWarUrls);
    const infoResponses = await queryHandler<IInfo>(
        infoUrlConstructor(fakeNumObjects),
    );

    const globalOrdersMap = new Map<string, IOrder[]>();
    const marketRespLen = marketResponses.length;

    for (let i = 0; i < marketRespLen; i++) {
        const pageData = marketResponses[i];
        if (!isValidData(pageData)) continue;
        const meta = urlMetadata[i];
        const key = `${meta.typeID}-${meta.orderType}`;
        let group = globalOrdersMap.get(key);
        if (group === undefined) {
            group = [];
            globalOrdersMap.set(key, group);
        }
        group.push(...pageData);
    }

    const infoMap = new Map<number, string>();
    for (let i = 0; i < uniqueTypesLen; i++) {
        const id = uniqueTypeIds[i];
        const info = infoResponses[i];
        infoMap.set(id, isValidData(info) ? info.name : `Item ${id}`);
    }

    const resultTable: IWarItem[] = [];

    // Изолированный атомарный анализ (Часть 2)
    for (let i = 0; i < parsedLen; i++) {
        const myOrder = myParsedOrders[i];
        const orderTypeKey = myOrder.bid ? 'buy' : 'sell';
        const marketMapKey = `${myOrder.typeID}-${orderTypeKey}`;

        const allMarketOrders = globalOrdersMap.get(marketMapKey) || [];
        const myHubSystemId = parseInt(myOrder.solarSystemID, 10);
        const myStationId = parseInt(myOrder.stationID, 10);
        const numericMyOrderID = Number(myOrder.orderID);

        // O(1) получение систем из предварительно собранной Map
        const allowedSystems = neighborSystemsMap.get(myHubSystemId) || [
            myHubSystemId,
        ];
        const localAreaOrders = jumpFilter(allMarketOrders, allowedSystems);
        const localLen = localAreaOrders.length;

        let myCurrentLiveOrder = null;
        for (let j = 0; j < localLen; j++) {
            // Оптимизация: сравниваем числа напрямую, убирая тяжелый String() в циклах
            if (localAreaOrders[j].order_id === numericMyOrderID) {
                myCurrentLiveOrder = localAreaOrders[j];
                break;
            }
        }

        const activeMyPrice =
            myCurrentLiveOrder !== null
                ? myCurrentLiveOrder.price
                : myOrder.price;
        const itemName =
            infoMap.get(myOrder.typeID) || `Item ${myOrder.typeID}`;

        const currentGroup =
            myGroupedOrdersMap.get(`${myOrder.typeID}-${myOrder.bid}`) || [];
        const isLeaderOfMyStack =
            currentGroup.length > 0 &&
            currentGroup[0].orderID === myOrder.orderID;

        if (!isLeaderOfMyStack) {
            resultTable.push({
                name: itemName,
                vol: myOrder.volRemaining,
                buy:
                    myOrder.bid && currentGroup.length > 0
                        ? currentGroup[0].price
                        : activeMyPrice,
                sell: myOrder.bid
                    ? activeMyPrice
                    : currentGroup.length > 0
                      ? currentGroup[0].price
                      : activeMyPrice,
                roi: 0,
                ipm: 0,
                orderID: myOrder.orderID,
                status: 'IGNORED',
                isBuy: myOrder.bid,
            });
            continue;
        }

        // Фильтрация ЧУЖИХ конкурентов за один проход с вычислением цен min/max
        let compPrice = activeMyPrice;
        let hasCompetitors = false;
        let extPrice = myOrder.bid ? -Infinity : Infinity;

        for (let j = 0; j < localLen; j++) {
            const o = localAreaOrders[j];

            if (myOrder.bid) {
                if (!o.is_buy_order || o.price <= activeMyPrice) continue;
            } else {
                if (
                    o.is_buy_order ||
                    o.location_id !== myStationId ||
                    o.price >= activeMyPrice
                )
                    continue;
            }

            // Оптимизация: strId создается только при прохождении базовых фильтров цен
            const strId = String(o.order_id);
            if (o.order_id === numericMyOrderID || myOwnOrderIdsSet.has(strId))
                continue;

            if (myOrder.bid) {
                if (
                    (myOrder.range === 'station' ||
                        myOrder.range === 'use_station') &&
                    o.location_id !== myStationId
                )
                    continue;
                if (
                    myOrder.range === 'solarsystem' &&
                    o.system_id !== myHubSystemId
                )
                    continue;
            }

            hasCompetitors = true;
            if (myOrder.bid) {
                if (o.price > extPrice) extPrice = o.price;
            } else {
                if (o.price < extPrice) extPrice = o.price;
            }
        }

        if (hasCompetitors) {
            compPrice = extPrice;
        }

        resultTable.push({
            name: itemName,
            vol: myOrder.volRemaining,
            buy: myOrder.bid ? compPrice : activeMyPrice,
            sell: myOrder.bid ? activeMyPrice : compPrice,
            roi: 0,
            ipm: 0,
            orderID: myOrder.orderID,
            status: hasCompetitors ? 'OUTBID' : '',
            isBuy: myOrder.bid,
        });
    }

    return resultTable;
}
