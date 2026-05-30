// ./src/lib/profitCalculations.ts
import { INumObj, ITradeSettings } from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';
import { roundIsk, calculateFeeWithLimit } from '@/src/lib/helpers';

interface IHubStats {
    factionStand: number;
    stationOwnerStand: number;
}

export function profitCalc<
    T extends INumObj & { buy: number; sell: number; vol: number },
>(
    items: T[],
    activeSettings: ITradeSettings,
    hubStats: IHubStats,
    userSkills: IUserSkills,
): (T & { margin: number; roi: number; ipm: number })[] {
    const buyIsCita = activeSettings.marketPlaceBuyIsCitadel;
    const sellIsCita = activeSettings.marketPlaceSellIsCitadel;

    // 1. Налог NPC-брокера: База 3.0%, снижается навыками и стендингами
    let npcBrokerFeePercent =
        3.0 -
        0.3 * (userSkills.broker_relationship ?? 0) -
        0.03 * (hubStats.factionStand ?? 0) -
        0.02 * (hubStats.stationOwnerStand ?? 0);

    if (npcBrokerFeePercent < 0) npcBrokerFeePercent = 0;

    // 2. Налог с продаж (Sales Tax): База 7.5%, снижается навыком Accounting
    let salesTaxPercent = 7.5 - 7.5 * 0.11 * (userSkills.accounting ?? 0);
    if (salesTaxPercent < 0) salesTaxPercent = 0;

    const sccTakingPercent = 0.5;
    const citadelBrokerFeePercent = activeSettings.FEES ?? 0;

    const len = items.length;
    const result: (T & { margin: number; roi: number; ipm: number })[] = [];

    for (let i = 0; i < len; i++) {
        const item = items[i];
        const rawBuy = item.buy;
        const rawSell = item.sell;

        let brokerFeeBuy = 0;
        let brokerFeeSell = 0;

        // --- РАСЧЕТ ДЛЯ ЗАКУПКИ (Buy Order) ---
        if (buyIsCita) {
            const citadelFeeBuy = calculateFeeWithLimit(
                rawBuy,
                citadelBrokerFeePercent,
                100,
            );
            const sccFeeBuy = calculateFeeWithLimit(
                rawBuy,
                sccTakingPercent,
                25,
            );
            brokerFeeBuy = roundIsk(citadelFeeBuy + sccFeeBuy);
        } else {
            brokerFeeBuy = calculateFeeWithLimit(
                rawBuy,
                npcBrokerFeePercent,
                100,
            );
        }

        // --- РАСЧЕТ ДЛЯ ПРОДАЖИ (Sell Order) ---
        if (sellIsCita) {
            const citadelFeeSell = calculateFeeWithLimit(
                rawSell,
                citadelBrokerFeePercent,
                100,
            );
            const sccFeeSell = calculateFeeWithLimit(
                rawSell,
                sccTakingPercent,
                25,
            );
            brokerFeeSell = roundIsk(citadelFeeSell + sccFeeSell);
        } else {
            brokerFeeSell = calculateFeeWithLimit(
                rawSell,
                npcBrokerFeePercent,
                100,
            );
        }

        const salesTax = roundIsk(rawSell * (salesTaxPercent / 100));

        const totalBuyCost = roundIsk(rawBuy + brokerFeeBuy);
        const totalSellRevenue = roundIsk(rawSell - brokerFeeSell - salesTax);

        if (totalBuyCost <= 0) continue;

        const netProfit = totalSellRevenue - totalBuyCost;
        const ROI = (netProfit / totalBuyCost) * 100;
        const IPM = ROI * item.vol;

        // Быстрая фильтрация невыгодных позиций
        if (ROI < 0 || IPM < 0) continue;

        result.push({
            ...item,
            margin: Math.floor(ROI),
            roi: Math.floor(ROI),
            ipm: Math.floor(IPM),
        });
    }

    return result;
}
