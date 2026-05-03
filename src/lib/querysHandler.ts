import { BASE_URL } from "@/src/lib/constants";
import { IHistory } from "../types/interfaces";
import { getByKey, setKey } from "./dbHandlers";

// Состояние вынесено в объект-синглтон
const EsiShield = {
  errorLimitRemain: 100,
  coolDownUntil: 0,

  canRequest(): boolean {
    return Date.now() > this.coolDownUntil && this.errorLimitRemain > 10;
  },

  update(headers: Headers, status: number) {
    const remain = headers.get("x-esi-error-limit-remain");
    if (remain) this.errorLimitRemain = parseInt(remain, 10);

    // Если 420 или лимит исчерпан — блокируем всё на 1 минуту
    if (status === 420 || this.errorLimitRemain <= 1) {
      this.coolDownUntil = Date.now() + 60000;
    }
  },
};

async function fetchSingle<T>(url: string): Promise<T | null> {
  // 1. БД: Проверка кеша (Expires и 404)
  const cached = getByKey(url);
  if (cached) {
    if (cached.etag === "404-block" && Date.now() < cached.expires) return null;
    if (Date.now() < cached.expires) return JSON.parse(cached.data);
  }

  // 2. Shield: Можно ли идти в сеть?
  if (!EsiShield.canRequest()) {
    return cached ? JSON.parse(cached.data) : null;
  }

  try {
    const response = await fetch(url, {
      headers: { "If-None-Match": cached?.etag ?? "" },
    });

    EsiShield.update(response.headers, response.status);

    // 3. Обработка ответов
    if (response.status === 304 && cached) {
      const newExpires = new Date(
        response.headers.get("expires") || 0,
      ).getTime();
      setKey({ ...cached, expires: newExpires });
      return JSON.parse(cached.data);
    }

    if (response.status === 200) {
      const data = await response.json();
      setKey({
        key: url,
        etag: response.headers.get("etag") ?? "",
        expires: new Date(response.headers.get("expires") || 0).getTime(),
        data: JSON.stringify(data),
      });
      return data;
    }

    if (response.status === 404) {
      setKey({
        key: url,
        etag: "404-block",
        expires: Date.now() + 86400000,
        data: "",
      });
    }

    return null;
  } catch (error) {
    console.error(error);
    return cached ? JSON.parse(cached.data) : null;
  }
}
import pLimit from "p-limit";

export async function queryHandler<T>(urls: string[]) {
  // Лимит одновременных запросов (ESI рекомендует до 20-50)
  const limit = pLimit(20);

  const tasks = urls.map((url) => {
    return limit(() => fetchSingle<T>(url));
  });

  const results = await Promise.all(tasks);

  // Убираем null значения (ошибки или заблокированные 404)
  return results.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
}

export async function getItemsHistory(
  items: { type_id: number }[],
  regionId: number,
): Promise<IHistory[][]> {
  // 1. Формируем URL
  const urls = items.map(
    (item) =>
      `${BASE_URL}latest/markets/${regionId}/history/?datasource=tranquility&type_id=${item.type_id}`,
  );

  // 2. Запрашиваем данные.
  // queryHandler возвращает (IHistory[] | null)[]
  const historyData = await queryHandler<IHistory[]>(urls);

  // 3. Возвращаем только историю, гарантируя, что это массив массивов
  // (заменяем null на пустые массивы, если запрос не удался)
  return historyData.map((data) => data || []);
}
export async function getItemsInfo(items: { type_id: number }[]) {
  if (!items || items.length === 0) return [];

  const url = "https://esi.evetech.net/universe/names";

  // Извлекаем только ID и превращаем в массив строк/чисел
  const ids = items.map((item) => item.type_id);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Compatibility-Date": "2025-12-16",
    },
    // 💡 Обязательно JSON.stringify и передаем чистый массив ID
    body: JSON.stringify(ids),
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ESI Error: ${response.status}`, errorText);
      return [];
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}
