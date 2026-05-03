import { setKey, getByKey } from "@/src/lib/dbHandlers";
import pLimit from "p-limit";

export async function queryHandler(urls: string[], key: string) {
  const limit = pLimit(20);
  // Глобальные переменные для защиты от бана
  let errorLimitRemain: number = 100;
  let isCoolingDown: boolean = false;

  async function f<T>(url: string): Promise<T | null> {
    if (isCoolingDown) return null;

    const cached = getByKey(key);

    // 1. Проверка локального времени истечения (Expires)
    if (cached && Date.now() < cached.expires) {
      return JSON.parse(cached.data) as T;
    }

    // 2. Защита: если лимит ошибок ESI почти исчерпан
    if (errorLimitRemain < 10) {
      console.warn(
        `[ESI] Низкий лимит ошибок: ${errorLimitRemain}. Ожидание 60с...`,
      );
      isCoolingDown = true;
      await new Promise((r) => setTimeout(r, 60000));
      isCoolingDown = false;
      errorLimitRemain = 100;
    }

    try {
      const response = await fetch(url, {
        headers: { "If-None-Match": cached?.etag ?? "" },
      });

      // Обновляем счетчик ошибок из заголовков ESI
      const remain = response.headers.get("x-esi-error-limit-remain");
      if (remain) errorLimitRemain = parseInt(remain, 10);

      // 3. Статус 304: Данные не изменились
      if (response.status === 304 && cached) {
        const expiresHeader: string | null = response.headers.get("expires");
        const newExpires: number = expiresHeader
          ? new Date(expiresHeader).getTime()
          : Date.now() + 300000;
        const dataParsed = JSON.parse(cached.data);

        setKey({
          key,
          etag: cached.etag,
          expires: newExpires,
          data: dataParsed,
        });

        return dataParsed as T;
      }

      // 4. Статус 200: Получены новые данные
      if (response.status === 200) {
        const newData = (await response.json()) as unknown;

        const expiresHeader = response.headers.get("expires");
        const expiresMs = expiresHeader
          ? new Date(expiresHeader).getTime()
          : Date.now();

        setKey({
          key: key, // Ключ у вас уже есть как string

          // ИСПОЛЬЗУЙТЕ ?? "", чтобы заменить null на пустую строку
          etag: response.headers.get("etag") ?? "",

          expires: expiresMs,

          // Убедитесь, что здесь string (через stringify)
          data: JSON.stringify(newData),
        });
        return newData as T;
      }

      // 5. Обработка 404 (объект удален/не существует)
      if (response.status === 404) {
        // Кешируем 404 на 24 часа, чтобы не спамить ESI невалидным ID
        const tomorrow = new Date(Date.now() + 86400000).getTime();
        setKey({
          key: url,
          etag: "null",
          expires: tomorrow,
          data: "error: Not Found",
        });
        return null;
      }
      return null;
    } catch (error: unknown) {
      console.error(`[ESI] Ошибка сети для ${url}:`, error);
      return cached ? (JSON.parse(cached.data) as T) : null;
    }
  }

  async function fetchController<T>(urls: string[]): Promise<(T | null)[]> {
    const tasks = urls.map((url) =>
      limit(async () => {
        const result = await f<T>(url);
        return result;
      }),
    );
    return await Promise.all(tasks);
  }
  return await fetchController(urls);
}
