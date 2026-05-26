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

    // 1. Налог NPC-брокера: База 3.0%, снижается навыками и ЧИСТЫМИ стендингами
    let npcBrokerFeePercent =
        3.0 -
        0.3 * (userSkills.broker_relationship ?? 0) -
        0.03 * (hubStats.factionStand ?? 0) -
        0.02 * (hubStats.stationOwnerStand ?? 0);

    if (npcBrokerFeePercent < 0) npcBrokerFeePercent = 0;

    // 2. Налог с продаж (Sales Tax): База 7.5%, снижается навыком Accounting на 11% от базы за уровень
    let salesTaxPercent = 7.5 - 7.5 * 0.11 * (userSkills.accounting ?? 0);
    if (salesTaxPercent < 0) salesTaxPercent = 0;

    // 3. Сборы в Цитаделях (SCC налог всегда фиксирован = 0.5% от суммы ордера)
    const sccTakingPercent = 0.5;
    const citadelBrokerFeePercent = activeSettings.FEES ?? 0;

    return items
        .flatMap((item: INumObj) => {
            const rawBuy = item.buy;
            const rawSell = item.sell;

            let brokerFeeBuy = 0;
            let brokerFeeSell = 0;

            // --- РАСЧЕТ ДЛЯ ЗАКУПКИ (Buy Order) ---
            if (buyIsCita) {
                // Гонорар брокера цитадели (процент от сделки, минимум 100 ISK)
                const rawCitadelFeeBuy =
                    rawBuy * (citadelBrokerFeePercent / 100);
                const citadelFeeBuy = Math.max(
                    Math.round(rawCitadelFeeBuy * 100) / 100,
                    100,
                );

                // Пошлина КлТБ / SCC (0.5% от сделки, минимум 25 ISK по логам игры)
                const rawSccFeeBuy = rawBuy * (sccTakingPercent / 100);
                const sccFeeBuy = Math.max(
                    Math.round(rawSccFeeBuy * 100) / 100,
                    25,
                );

                brokerFeeBuy =
                    Math.round((citadelFeeBuy + sccFeeBuy) * 100) / 100;
            } else {
                // На NPC-станции действует только процентный Broker Fee с минимумом в 100 ISK
                const percentageFeeBuy = rawBuy * (npcBrokerFeePercent / 100);
                brokerFeeBuy = Math.max(
                    Math.round(percentageFeeBuy * 100) / 100,
                    100,
                );
            }

            // --- РАСЧЕТ ДЛЯ ПРОДАЖИ (Sell Order) ---
            if (sellIsCita) {
                // Гонорар брокера цитадели (процент от сделки, минимум 100 ISK)
                const rawCitadelFeeSell =
                    rawSell * (citadelBrokerFeePercent / 100);
                const citadelFeeSell = Math.max(
                    Math.round(rawCitadelFeeSell * 100) / 100,
                    100,
                );

                // Пошлина КлТБ / SCC (0.5% от сделки, минимум 25 ISK по логам игры)
                const rawSccFeeSell = rawSell * (sccTakingPercent / 100);
                const sccFeeSell = Math.max(
                    Math.round(rawSccFeeSell * 100) / 100,
                    25,
                );

                brokerFeeSell =
                    Math.round((citadelFeeSell + sccFeeSell) * 100) / 100;
            } else {
                // На NPC-станции действует только процентный Broker Fee с минимумом в 100 ISK
                const percentageFeeSell = rawSell * (npcBrokerFeePercent / 100);
                brokerFeeSell = Math.max(
                    Math.round(percentageFeeSell * 100) / 100,
                    100,
                );
            }

            // Налог с продаж (Sales Tax) берется всегда от финальной цены продажи (только для SELL-ордеров)
            const salesTax =
                Math.round(rawSell * (salesTaxPercent / 100) * 100) / 100;

            // Расчет итоговой экономики транзакции
            const totalBuyCost =
                Math.round((rawBuy + brokerFeeBuy) * 100) / 100;
            const totalSellRevenue =
                Math.round((rawSell - brokerFeeSell - salesTax) * 100) / 100;

            const invest = totalBuyCost;
            if (invest <= 0) return [];

            const netProfit = totalSellRevenue - totalBuyCost;
            const ROI = (netProfit / invest) * 100;
            const IPM = ROI * item.vol;

            // Отсекаем убыточные позиции
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
