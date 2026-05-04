import { BASE_URL } from "./constants";
import { INumObj } from "@/src/types/interfaces";

export const urlsConstructor = {
  orders(currentReghionId: number, quantity: number): string[] {
    // Кешируем общую часть URL для производительности и чистоты
    const madeUrl = `${BASE_URL}markets/${currentReghionId}/orders?order_type=all`;
    // Создаем массив нужной длины и заполняем его через Array.from
    return Array.from(
      { length: quantity },
      (_, i) => `${madeUrl}&page=${i + 1}`,
    );
  },
  history(items: INumObj[], currentReghionId: number): string[] {
    const madeUrl = `${BASE_URL}markets/${currentReghionId}/history?type_id=`;
    // return items.map((item) => madeUrl + item.type_id);
    return Array.from(
      { length: items.length },
      (_, i) => madeUrl + items[i].type_id,
    );
  },
  info(items: INumObj[]): string[] {
    const madeUrl = `${BASE_URL}latest/universe/types/`;
    return Array.from(
      { length: items.length },
      (_, i) => madeUrl + items[i].type_id,
    );
    // return items.map(
    //   (item) => `${BASE_URL}latest/universe/types/${item.type_id}`,
    // );
  },
};
