// src/app/api/buy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeGetData } from '@/src/lib/execute';
import {
    tradeSettings as defaultTradeSettings,
    userStats as defaultUserStats,
    userSkills as defaultUserSkills,
} from '@/src/lib/settings';
import { ITradeSettings, IUserStats } from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';
import { initDb } from '@/src/lib/dbHandlers'; // И
// Строгий интерфейс для входящего JSON (ЗАПРЕЩЕН any)
interface IBuyRequestPayload {
    tradeSettings: Partial<ITradeSettings>;
    userStats: Partial<IUserStats>;
    userSkills: Partial<IUserSkills>;
}

export async function POST(request: NextRequest) {
    try {
        // ЧИТАЕМ JSON ВМЕСТО FORM DATA (исправляет падение на сервере)
        const body: IBuyRequestPayload = await request.json();
        initDb();
        if (!body || !body.tradeSettings) {
            return NextResponse.json(
                { message: 'Missing tradeSettings in request body' },
                { status: 400 },
            );
        }

        // 1. Безопасное локальное перекрытие tradeSettings
        const activeTradeSettings: ITradeSettings = {
            ...defaultTradeSettings,
            ...body.tradeSettings,
        };

        // 2. Безопасный глубокий мёрдж userStats для предотвращения undefined ошибок
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

        // 3. Безопасное локальное перекрытие userSkills
        const activeUserSkills: IUserSkills = {
            ...defaultUserSkills,
            ...body.userSkills,
        };

        // Запуск конвейера вычислений (передаем изолированные параметры)
        const ordersData = await executeGetData(activeTradeSettings);

        // Возвращаем результат обратно клиенту
        return NextResponse.json(
            {
                message: 'Result:',
                region: activeTradeSettings.region,
                data: ordersData, // Массив просчитанных ордеров уйдет на клиент
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
