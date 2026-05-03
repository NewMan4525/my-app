import { BASE_URL } from "./constants";
import { INumObj } from "@/src/types/interfaces";

export const urlsConstructor = {
  orders(currentReghionId: number, quantity: number): string[] {
    // Кешируем общую часть URL для производительности и чистоты
    const baseUrl = `${BASE_URL}markets/${currentReghionId}/orders?order_type=all`;
    // Создаем массив нужной длины и заполняем его через Array.from
    return Array.from(
      { length: quantity },
      (_, i) => `${baseUrl}&page=${i + 1}`,
    );
  },
  history(items: INumObj[], currentReghionId: number): string[] {
    return items.map(
      (item) =>
        `${BASE_URL}markets/${currentReghionId}/history?type_id=${item.type_id}`,
    );
  },
  info(items: INumObj[]): string[] {
    return items.map(
      (item) => `${BASE_URL}latest/universe/types/${item.type_id}`,
    );
  },
};
