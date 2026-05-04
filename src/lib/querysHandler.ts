import { getByKey, setKey } from "./dbHandlers";
import pLimit from "p-limit";

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
