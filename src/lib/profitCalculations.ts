import { settings } from "./settings.ts";
import { InumObj } from "./interfaces.ts";

// export function calculateProfitability(item: InumObj) {
//   const tax = settings.TAX;
//   const fees = settings.FEES;

//   // Полная стоимость покупки (цена + комиссия)
//   const totalCost = item.buy * (1 + fees);

//   // Чистая выручка с продажи (цена - налог - комиссия)
//   const netRevenue = item.sell * (1 - tax - fees);

//   // Чистая прибыль (ISK)
//   const pureDiff = netRevenue - totalCost;

//   // Чистый ROI (%)
//   const pureROI = totalCost > 0 ? (pureDiff / totalCost) * 100 : 0;

//   return {
//     pureDiff: Math.floor(pureDiff),
//     pureROI: parseFloat(pureROI.toFixed(2)),
//   };
// }

// export function calculateMarketMetrics(item: InumObj) {
//   // Оборот в день (сколько ISK "крутится" в товаре)
//   const dailyTurnover = Math.floor(item.vol * item.sell);

//   // Индекс конкуренции (соотношение ордеров к объему)
//   // Чем выше число, тем чаще нужно обновлять цену
//   const competition =
//     item.vol > 0 ? parseFloat((item.orders / item.vol).toFixed(2)) : 0;

//   return {
//     dailyTurnover,
//     competition,
//   };
// }

// export function enrichItemsWithMetrics(items: InumObj[]): InumObj[] {
//   return items.map((item) => {
//     const { pureDiff, pureROI } = calculateProfitability(item);
//     const { dailyTurnover, competition } = calculateMarketMetrics(item);

//     return {
//       ...item,
//       pureDiff,
//       pureROI,
//       dailyTurnover,
//       competition,
//       // Эффективность: сколько прибыли принесет 1 единица товара с учетом его ликвидности
//       efficiencyScore: Math.floor(pureDiff * item.vol),
//     };
//   });
// }

export function roiIPMCalc(items: any) {
  const SCCtaking = 0.5;
  const bc = settings.FEES;
  const taxSCC = settings.TAX;
  const isCita = settings.marketPlaceisCitadel;

  return items
    .map((item: any) => {
      let buy = item.buy;
      let sell = item.sell;
      buy += isCita
        ? item.buy * 0.01 * taxSCC + item.buy * 0.01 * SCCtaking + 100
        : Math.max(item.buy * 0.01 * settings.FEES, 100);
      sell -= isCita
        ? item.sell * 0.01 * taxSCC + item.sell * 0.01 * SCCtaking + 100
        : item.sell * 0.01 * taxSCC + Math.max(item.sell * 0.01 * bc, 100);
      const invest = buy;
      const ROI = ((sell - buy) / invest) * 100;
      const IPM = ROI * item.vol;
      if (ROI < 0 || IPM < 0) return null;
      return {
        ...item,
        roi: Math.floor(ROI),
        ipm: Math.floor(IPM),
      };
    })
    .filter(Boolean);
}
