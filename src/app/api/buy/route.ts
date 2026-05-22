// ./src/app/api/buy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeGetData } from '@/src/lib/execute';
import {
    tradeSettings as defaultTradeSettings,
    userStats as defaultUserStats,
    userSkills as defaultUserSkills,
} from '@/src/lib/settings';
import { ITradeSettings, IUserStats } from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';
import { initDb } from '@/src/lib/dbHandlers';

interface IBuyRequestPayload {
    tradeSettings: Partial<ITradeSettings>;
    userStats: Partial<IUserStats>;
    userSkills: Partial<IUserSkills>;
}

export async function POST(request: NextRequest) {
    try {
        const body: IBuyRequestPayload = await request.json();
        initDb();
        if (!body || !body.tradeSettings) {
            return NextResponse.json(
                { message: 'Missing tradeSettings in request body' },
                { status: 400 },
            );
        }

        // Безопасное локальное перекрытие параметров рынка текущего запроса
        const activeTradeSettings: ITradeSettings = {
            ...defaultTradeSettings,
            ...body.tradeSettings,
        };

        // Безопасный глубокий мёрдж стендингов текущего запроса для предотвращения undefined ошибок
        const activeUserStats: IUserStats = { ...defaultUserStats };
        if (body.userStats) {
            Object.entries(defaultUserStats).forEach(
                ([hubKey, defaultHubValues]) => {
                    const incomingHubValues = body.userStats[hubKey];
                    activeUserStats[hubKey] = {
                        factionStand:
                            incomingHubValues?.factionStand ??
                            defaultHubValues.factionStand,
                        stationOwnerStand:
                            incomingHubValues?.stationOwnerStand ??
                            defaultHubValues.stationOwnerStand,
                    };
                },
            );
        }

        // Безопасное перекрытие скиллов персонажа текущего запроса
        const activeUserSkills: IUserSkills = {
            ...defaultUserSkills,
            ...body.userSkills,
        };

        // Запуск изолированного конвейера вычислений
        const ordersData = await executeGetData(
            activeTradeSettings,
            activeUserStats,
            activeUserSkills,
        );

        // Возвращаем полностью просчитанный готовый результат обратно в клиентскую таблицу ордеров
        return NextResponse.json(
            {
                message: 'Result:',
                region: activeTradeSettings.region,
                data: ordersData,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Error handling Orders request:', error);
        return NextResponse.json(
            { message: 'Error processing Orders request' },
            { status: 500 },
        );
    }
}
