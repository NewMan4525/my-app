import { BASE_URL } from "@/src/lib/constants";
import { IOrder } from "@/src/types/interfaces";

export async function getNeighborSystems(
  hubSystemId: number,
): Promise<number[]> {
  try {
    // 1. Получаем данные о целевой системе
    const res = await fetch(
      `${BASE_URL}latest/universe/systems/${hubSystemId}/`,
    );
    const data = await res.json();

    // 2. Извлекаем список всех ворот (stargates)
    const stargateIds: number[] = data.stargates || [];

    // 3. Узнаем пункт назначения для каждых ворот
    const neighbors = await Promise.all(
      stargateIds.map(async (gateId) => {
        const gateRes = await fetch(
          `${BASE_URL}latest/universe/stargates/${gateId}/`,
        );
        const gateData = await gateRes.json();
        return gateData.destination.system_id as number;
      }),
    );

    // Возвращаем массив: [Сам Хаб, Сосед 1, Сосед 2, ...]
    return [hubSystemId, ...neighbors];
  } catch (error) {
    console.error("Ошибка при поиске соседей:", error);
    return [hubSystemId]; // Если API упал, возвращаем хотя бы хаб
  }
}

export function jumpFilter(
  orders: IOrder[],
  allowedSystems: number[],
): IOrder[] {
  return orders.filter((order) => allowedSystems.includes(order.system_id));
}
