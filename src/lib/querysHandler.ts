// ./src/lib/querysHandler.ts
import { getByKey, setKey } from './dbHandlers';
import pLimit from 'p-limit';
import type { ICacheData } from '@/src/types/interfaces';
import { parseExpiresHeader, getOrParseCachedData } from '@/src/lib/helpers';

const EsiShield = {
    errorLimitRemain: 100,
    coolDownUntil: 0,

    canRequest(): boolean {
        return Date.now() > this.coolDownUntil && this.errorLimitRemain > 10;
    },

    update(headers: Headers, status: number) {
        const remain = headers.get('x-esi-error-limit-remain');
        if (remain) this.errorLimitRemain = parseInt(remain, 10);

        if (status === 420 || this.errorLimitRemain <= 1) {
            this.coolDownUntil = Date.now() + 60000;
        }
    },
};

async function fetchSingle<T>(url: string): Promise<T | null> {
    const cached = getByKey(url) as ICacheData | undefined;

    if (cached) {
        if (cached.etag === '404-block' && Date.now() < cached.expires) {
            return null;
        }
        if (Date.now() < cached.expires) {
            return getOrParseCachedData<T>(cached);
        }
    }

    // Если ESI API недоступен или лимит ошибок исчерпан, отдаем старый кэш или null
    if (!EsiShield.canRequest()) {
        return cached ? getOrParseCachedData<T>(cached) : null;
    }

    try {
        const response = await fetch(url, {
            headers: { 'If-None-Match': cached?.etag ?? '' },
        });

        EsiShield.update(response.headers, response.status);

        // Кэш все еще актуален (304 Not Modified) — обновляем только время жизни
        if (response.status === 304 && cached) {
            const newExpires = parseExpiresHeader(response.headers);
            setKey({ ...cached, expires: newExpires });
            return getOrParseCachedData<T>(cached);
        }

        // Получены новые данные (200 OK) — сохраняем в базу и отдаем наружу
        if (response.status === 200) {
            const data = (await response.json()) as T;
            setKey({
                key: url,
                etag: response.headers.get('etag') ?? '',
                expires: parseExpiresHeader(response.headers),
                data: JSON.stringify(data),
            });
            return data;
        }

        // Ресурс не найден (404) — кэшируем блокировку на сутки
        if (response.status === 404) {
            setKey({
                key: url,
                etag: '404-block',
                expires: Date.now() + 86400000,
                data: '',
            });
        }

        return null;
    } catch (error) {
        console.error(error);
        return cached ? getOrParseCachedData<T>(cached) : null;
    }
}

/**
 * Универсальный пакетный обработчик запросов с ограничением параллельности.
 */
export async function queryHandler<T>(urls: string[]): Promise<(T | null)[]> {
    const len = urls.length;
    const limit = pLimit(50);

    // Предвыделяем память под массив промисов точной длины для защиты от array resizing в V8
    const tasks = new Array<Promise<T | null>>(len);

    // Заполняем массив через чистый производительный цикл
    for (let i = 0; i < len; i++) {
        const url = urls[i];
        tasks[i] = limit(() => fetchSingle<T>(url));
    }

    return await Promise.all(tasks);
}
