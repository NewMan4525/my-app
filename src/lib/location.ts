// ./src/lib/location.ts
import { BASE_URL } from '@/src/lib/constants';
import { queryHandler } from './querysHandler';
import { isValidData } from '@/src/lib/helpers';

interface IEsiStargateResponse {
    destination: {
        system_id: number;
    };
}

export async function getNeighborSystems(
    hubSystemId: number,
): Promise<number[]> {
    try {
        const res = await fetch(
            `${BASE_URL}latest/universe/systems/${hubSystemId}/`,
        );
        const data = (await res.json()) as { stargates?: number[] };

        const stargateIds = data.stargates;
        if (stargateIds === undefined || stargateIds.length === 0) {
            return [hubSystemId];
        }

        const len = stargateIds.length;
        const gateUrls = new Array<string>(len);

        for (let i = 0; i < len; i++) {
            gateUrls[i] =
                `${BASE_URL}latest/universe/stargates/${stargateIds[i]}/`;
        }

        const gateResponses =
            await queryHandler<IEsiStargateResponse>(gateUrls);
        const responsesLen = gateResponses.length;

        // Предвыделяем точный максимальный объем памяти
        const result = new Array<number>(responsesLen + 1);
        result[0] = hubSystemId;
        let actualCount = 1;

        // Собираем ID соседних систем без накладных расходов push()
        for (let i = 0; i < responsesLen; i++) {
            const gateData = gateResponses[i];
            if (isValidData(gateData)) {
                result[actualCount++] = gateData.destination.system_id;
            }
        }

        // Корректируем длину массива, если часть сетевых запросов вернула null
        if (actualCount < result.length) {
            result.length = actualCount;
        }

        return result;
    } catch (error) {
        console.error('Ошибка при поиске соседей:', error);
        return [hubSystemId];
    }
}
