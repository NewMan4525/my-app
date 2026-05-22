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

    // Вычисление процентов по оригинальным формулам игры
    const npcBrokerFeePercent =
        3.0 -
        0.3 * (userSkills.broker_relationship ?? 1) -
        0.03 * (hubStats.factionStand ?? 0) -
        0.02 * (hubStats.stationOwnerStand ?? 0);
    const salesTaxPercent = 7.5 - 7.5 * 0.11 * (userSkills.accounting ?? 1);

    const citadelBrokerFeePercent = activeSettings.FEES;
    const sccTakingPercent = 0.5;

    return items
        .flatMap((item: INumObj) => {
            const rawBuy = item.buy;
            const rawSell = item.sell;

            let brokerFeeBuy = 0;
            let brokerFeeSell = 0;

            // 1. Считаем налог на закупку (Buy Order)
            if (buyIsCita) {
                const citadelFeeBuy =
                    Math.round(rawBuy * (citadelBrokerFeePercent / 100) * 100) /
                    100;
                const sccFeeBuy =
                    Math.round(rawBuy * (sccTakingPercent / 100) * 100) / 100;
                brokerFeeBuy = citadelFeeBuy + sccFeeBuy + 100; // Фиксированный сбор 100 ISK
            } else {
                brokerFeeBuy = Math.max(
                    Math.round(rawBuy * (npcBrokerFeePercent / 100) * 100) /
                        100,
                    100,
                );
            }

            // 2. Считаем налог на выставление ордера продажи (Sell Order)
            if (sellIsCita) {
                const citadelFeeSell =
                    Math.round(
                        rawSell * (citadelBrokerFeePercent / 100) * 100,
                    ) / 100;
                const sccFeeSell =
                    Math.round(rawSell * (sccTakingPercent / 100) * 100) / 100;
                brokerFeeSell = citadelFeeSell + sccFeeSell + 100;
            } else {
                brokerFeeSell = Math.max(
                    Math.round(rawSell * (npcBrokerFeePercent / 100) * 100) /
                        100,
                    100,
                );
            }

            // 3. Налог с продаж (Sales Tax) берется всегда от грязной цены продажи
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

// const caldariStand = 2.03;
// const caldariNavyStand = 6.52;
// const brokerDailiSkill = 5;
// const accountingSkill = 5;
// const factionStand = caldariStand;
// const corpStand = caldariNavyStand;

// const SCCtaking = 0.5; //citadel tax buy

// const bc = 3 - 0.3 * brokerDailiSkill - 0.03 * factionStand - 0.02 * corpStand; //buy/sell

// const taxSCC = 7.5 - 7.5 * 0.11 * accountingSkill; //3.37  sell
// const isCita = settings.marketPlaceisCitadel;

// let buy = 150000; //bc =100 cita + (citadel.tax)optional

// let sell = 177700; //bc 100 cita + taxSCC + corp
// const RAW = (sell - buy) / (buy * 0.01);
// buy += isCita
//   ? buy * 0.01 * taxSCC + buy * 0.01 * 0.5 + 100
//   : Math.max(buy * 0.01 * bc, 100);

// sell -= isCita
//   ? sell * 0.01 * taxSCC + sell * 0.01 * 0.5 + 100
//   : sell * 0.01 * taxSCC + Math.max(sell * 0.01 * bc, 100);

// const invest = buy;
// const ROI = ((sell - buy) / invest) * 100;

// const vol = 10;
// const IPM = ROI * vol;
// console.log("ipm", IPM);
