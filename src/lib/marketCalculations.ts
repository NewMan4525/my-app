import { settings } from "./settings.ts";
import { InumObj } from "../common/interfaces.ts";

export function calculateProfitability(item: InumObj) {
  const tax = settings.TAX;
  const fees = settings.FEES;

  // Полная стоимость покупки (цена + комиссия)
  const totalCost = item.buy * (1 + fees);

  // Чистая выручка с продажи (цена - налог - комиссия)
  const netRevenue = item.sell * (1 - tax - fees);

  // Чистая прибыль (ISK)
  const pureDiff = netRevenue - totalCost;

  // Чистый ROI (%)
  const pureROI = totalCost > 0 ? (pureDiff / totalCost) * 100 : 0;

  return {
    pureDiff: Math.floor(pureDiff),
    pureROI: parseFloat(pureROI.toFixed(2)),
  };
}

export function calculateMarketMetrics(item: InumObj) {
  // Оборот в день (сколько ISK "крутится" в товаре)
  const dailyTurnover = Math.floor(item.vol * item.sell);

  // Индекс конкуренции (соотношение ордеров к объему)
  // Чем выше число, тем чаще нужно обновлять цену
  const competition =
    item.vol > 0 ? parseFloat((item.orders / item.vol).toFixed(2)) : 0;

  return {
    dailyTurnover,
    competition,
  };
}

export function enrichItemsWithMetrics(items: InumObj[]): InumObj[] {
  return items.map((item) => {
    const { pureDiff, pureROI } = calculateProfitability(item);
    const { dailyTurnover, competition } = calculateMarketMetrics(item);

    return {
      ...item,
      pureDiff,
      pureROI,
      dailyTurnover,
      competition,
      // Эффективность: сколько прибыли принесет 1 единица товара с учетом его ликвидности
      efficiencyScore: Math.floor(pureDiff * item.vol),
    };
  });
}

const caldariStand = 2.03;
const caldariNavyStand = 6.52;
const brokerDailiSkill = 5;
const accountingSkill = 5;
const factionStand = caldariStand;
const corpStand = caldariNavyStand;

const SCCtaking = 0.5; //citadel tax buy

const bc = 3 - 0.3 * brokerDailiSkill - 0.03 * factionStand - 0.02 * corpStand; //buy/sell

const taxSCC = 7.5 - 7.5 * 0.11 * accountingSkill; //3.37  sell
const isCita = false;

let buy = 150000; //bc =100 cita + (citadel.tax)optional

let sell = 177700; //bc 100 cita + taxSCC + corp
const RAW = (sell - buy) / (buy * 0.01);
buy += isCita
  ? buy * 0.01 * taxSCC + buy * 0.01 * 0.5 + 100
  : Math.max(buy * 0.01 * bc, 100);

sell -= isCita
  ? sell * 0.01 * taxSCC + sell * 0.01 * 0.5 + 100
  : sell * 0.01 * taxSCC + Math.max(sell * 0.01 * bc, 100);

const invest = buy;
const ROI = ((sell - buy) / invest) * 100;

const vol = 10;
const IPM = ROI * vol;
console.log("ipm", IPM);
