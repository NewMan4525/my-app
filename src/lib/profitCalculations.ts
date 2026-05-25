// ./src/lib/profitCalculations.ts
import { INumObj, ITradeSettings } from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';

interface IHubStats {
    factionStand: number;
    stationOwnerStand: number;
}

export function profitCalc(
    items: INumObj[],
    activeSettings: ITradeSettings,
    hubStats: IHubStats,
    userSkills: IUserSkills,
): INumObj[] {
    const buyIsCita = activeSettings.marketPlaceBuyIsCitadel;
    const sellIsCita = activeSettings.marketPlaceSellIsCitadel;

    // 1. Налог NPC-брокера: База 3.0%
    const npcBrokerFeePercent =
        3.0 -
        0.3 * (userSkills.broker_relationship ?? 0) -
        0.03 * (hubStats.factionStand ?? 0) -
        0.02 * (hubStats.stationOwnerStand ?? 0);

    // 2. Налог с продаж (Sales Tax): База 7.5%
    const salesTaxPercent = 7.5 - 7.5 * 0.11 * (userSkills.accounting ?? 0);

    // 3. Сборы в Цитаделях (SCC налог всегда фиксирован = 0.5%)
    const sccTakingPercent = 0.5;
    const citadelBrokerFeePercent = activeSettings.FEES;

    return items
        .flatMap((item: INumObj) => {
            const rawBuy = item.buy;
            const rawSell = item.sell;

            let brokerFeeBuy = 0;
            let brokerFeeSell = 0;

            // --- РАСЧЕТ ДЛЯ ЗАКУПКИ (Buy Order) ---
            if (buyIsCita) {
                const citadelFeeBuy =
                    Math.round(rawBuy * (citadelBrokerFeePercent / 100) * 100) /
                    100;
                const sccFeeBuy =
                    Math.round(rawBuy * (sccTakingPercent / 100) * 100) / 100;
                brokerFeeBuy = citadelFeeBuy + sccFeeBuy + 100; // Налог владельца + SCC + 100 ISK
            } else {
                // ИСПРАВЛЕНИЕ: Вычисляем процентный сбор, но он не может быть ниже 100 ISK
                const percentageFeeBuy =
                    Math.round(rawBuy * (npcBrokerFeePercent / 100) * 100) /
                    100;
                brokerFeeBuy = Math.max(percentageFeeBuy, 100);
            }

            // --- РАСЧЕТ ДЛЯ ПРОДАЖИ (Sell Order) ---
            if (sellIsCita) {
                const citadelFeeSell =
                    Math.round(
                        rawSell * (citadelBrokerFeePercent / 100) * 100,
                    ) / 100;
                const sccFeeSell =
                    Math.round(rawSell * (sccTakingPercent / 100) * 100) / 100;
                brokerFeeSell = citadelFeeSell + sccFeeSell + 100;
            } else {
                // ИСПРАВЛЕНИЕ: Вычисляем процентный сбор, но он не может быть ниже 100 ISK
                const percentageFeeSell =
                    Math.round(rawSell * (npcBrokerFeePercent / 100) * 100) /
                    100;
                brokerFeeSell = Math.max(percentageFeeSell, 100);
            }

            // Налог с продаж (Sales Tax) берется всегда от финальной цены продажи
            const salesTax =
                Math.round(rawSell * (salesTaxPercent / 100) * 100) / 100;

            const totalBuyCost = rawBuy + brokerFeeBuy;
            const totalSellRevenue = rawSell - brokerFeeSell - salesTax;

            const invest = totalBuyCost;
            if (invest <= 0) return [];

            const netProfit = totalSellRevenue - totalBuyCost;
            const ROI = (netProfit / invest) * 100;
            const IPM = ROI * item.vol;

            if (ROI < 0 || IPM < 0) return [];

            return [
                {
                    ...item,
                    margin: Math.floor(ROI),
                    roi: Math.floor(ROI),
                    ipm: Math.floor(IPM),
                },
            ];
        })
        .filter(Boolean);
}
