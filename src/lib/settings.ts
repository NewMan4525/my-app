// ./src/lib/settings.ts
import { ITradeSettings, IUserStats } from '@/src/types/interfaces';

export const tradeSettings: ITradeSettings = {
    region: 'the_forge',
    time: 'month',
    priceMin: 1,
    priceMax: 3000000000,
    marginMin: 15,
    marginMax: 100,
    volumeMin: 1,
    volumeMax: 100,
    ordersMin: 1,
    ordersMax: 100,
    TAX: 7.5,
    FEES: 3,
    marketPlaceBuyIsCitadel: true, // По умолчанию закупка в Цитадели
    marketPlaceSellIsCitadel: false, // По умолчанию продажа на NPC хабе
};

export const userStats: IUserStats = {
    the_forge: { factionStand: 0, stationOwnerStand: 0 },
    domain: { factionStand: 0, stationOwnerStand: 0 },
    sinq_laison: { factionStand: 0, stationOwnerStand: 0 },
    metropolis: { factionStand: 0, stationOwnerStand: 0 },
    heimatar: { factionStand: 0, stationOwnerStand: 0 },
};

export const userSkills = {
    broker_relationship: 1,
    advanced_broker_relationship: 1,
    accounting: 1,
};
