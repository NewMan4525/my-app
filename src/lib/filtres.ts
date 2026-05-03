import { settings } from "./settings";
import { INumObj } from "@/src/types/interfaces";

export function priceFilter(items: (INumObj | null)[]): INumObj[] {
  const min = settings.priceMin;
  const max = settings.priceMax;
  return items.filter((item): item is INumObj => {
    if (item === null) return false;
    const meetsMin = item.buy >= (min ?? 0);
    const meetsMax =
      max === null || max === undefined ? true : item.sell <= max;
    return meetsMin && meetsMax;
  });
}

export function marginFilter(items: (INumObj | null)[]): INumObj[] {
  const min = settings.marginMin;
  const max = settings.marginMax;
  return items.filter((item): item is INumObj => {
    if (item === null || item.margin === Infinity) return false;
    const meetsMin = item.margin >= min;
    const meetsMax = max ? item.margin <= max : true;
    return meetsMin && meetsMax;
  });
}

export function volFilter(items: (INumObj | null)[]): INumObj[] {
  const min = settings.volumeMin;
  const max = settings.volumeMax;

  return items.filter((item): item is INumObj => {
    // Проверяем на null и исключаем товары с нулевым или отсутствующим vol
    if (item === null || typeof item.vol !== "number" || item.vol === 0) {
      return false;
    }

    const meetsMin = item.vol >= min;
    const meetsMax = max ? item.vol <= max : true;

    return meetsMin && meetsMax;
  });
}

export function ordersFilter(items: INumObj[]): INumObj[] {
  const min = settings.ordersMin;
  const max = settings.ordersMax;

  return items.filter((item) => {
    // Если min не задан, считаем его равным 0
    const meetsMin = item.orders >= (min ?? 0);
    // Если max равен null или undefined, проверка по max пропускается
    const meetsMax =
      max === null || max === undefined ? true : item.orders <= max;

    return meetsMin && meetsMax;
  });
}

export function finalProfitFilter(items: INumObj[]): INumObj[] {
  const tax = settings.TAX;
  const fees = settings.FEES;

  return items.filter((item) => {
    // Считаем реальные затраты и реальную выручку
    const totalCost = item.buy * (1 + fees);
    const netRevenue = item.sell * (1 - tax - fees);

    // Чистая прибыль должна быть больше 0
    const pureDiff = netRevenue - totalCost;

    // Оставляем только те товары, где мы реально зарабатываем
    return pureDiff > 0;
  });
}
