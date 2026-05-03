import { settings } from "./settings";
import { InumObj } from "@/src/types/interfaces";

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
