// ./src/types/interfaces.ts

// 1. БАЗОВЫЕ УТИЛИТАРНЫЕ ИНТЕРФЕЙСЫ И ТИПЫ
export interface INumObj {
    type_id: number;
    [key: string]: unknown; // Разрешает расширение объекта любыми типами далее по конвейеру
}

export interface IStrObj {
    [key: string]: string;
}

export type JSONValue =
    | string
    | number
    | boolean
    | null
    | { [x: string]: JSONValue }
    | JSONValue[];

export interface ITIME {
    [key: string]: number;
}

// 2. ИГРОВЫЕ СУЩНОСТИ И СТАТИСТИКА (EVE ONLINE)
export interface IHub {
    region: { alias: string; name: string; id: number };
    system: { name: string; id: number };
    station: { name: string; id: number };
    owners: {
        corporation: { alias: string; name: string };
        faction: { alias: string; name: string };
    };
}

export type IHubs = {
    [key: string]: IHub;
};

export interface IUserStats {
    [key: string]: {
        factionStand: number;
        stationOwnerStand: number;
    };
}

export interface ITradeSettings {
    region: string;
    time: string;
    priceMin: number;
    priceMax: number;
    marginMin: number;
    marginMax: number;
    volumeMin: number;
    volumeMax: number;
    ordersMin: number;
    ordersMax: number;
    TAX: number;
    FEES: number;
    marketPlaceBuyIsCitadel: boolean;
    marketPlaceSellIsCitadel: boolean;
}

// 3. СЕТЕВОЙ СЛОЙ И КЭШИРОВАНИЕ
export interface IQueryOptions {
    method: string;
    Headers: {
        'Accept-Language': string;
        'If-None-Match': string;
        'X-Compatibility-Date': string;
        'X-Tenant': string;
        'If-Modified-Since': string;
        'Content-Type': string;
        Accept: string;
    };
    body?: string | number[];
}

export interface ICacheData {
    key: string;
    etag: string;
    expires: number;
    data: string;
    parsedData?: unknown;
}

// 4. ДАННЫЕ ИЗ ESI API
export interface IOrder {
    duration: number;
    is_buy_order: boolean;
    issued: string;
    location_id: number;
    min_volume: number;
    order_id: number;
    price: number;
    range: string;
    system_id: number;
    type_id: number;
    volume_remain: number;
    volume_total: number;
}

export interface IHistory {
    average: number;
    date: string;
    highest: number;
    lowest: number;
    order_count: number;
    volume: number;
}

// Выделяем базовый интерфейс для предметов, у которых гарантированно есть имя и ID типа
export interface INamedItem {
    type_id: number;
    name: string;
}

// Наследуем базовые свойства ESI для полной информации о предмете
export interface IInfo extends INamedItem {
    capacity: number;
    description: string;
    dogma_attributes?: object[];
    dogma_effects?: object[];
    graphic_id?: number;
    group_id: number;
    icon_id: number;
    market_group_id: number;
    mass: number;
    packaged_volume: number;
    portion_size: number;
    published: boolean;
    radius: number;
    volume: number;
}

export interface IWarMarketPrices {
    maxBuyPrice: number;
    minSellPrice: number;
}

// 5. РЫНОЧНЫЕ ИГРОВЫЕ ДАННЫЕ (КОНВЕЙЕРЫ)

// Базовая структура цен и объемов для финальных агрегированных элементов
export interface IPriceMetrics {
    buy: number;
    sell: number;
    vol: number;
    roi: number;
    ipm: number;
}

// Отличный лаконичный интерфейс для таблицы маркета через множественное наследование
export interface IMarketItem extends INamedItem, IPriceMetrics {
    orders: number;
}

// 6. ПОЛЬЗОВАТЕЛЬСКИЕ ЗАГРУЖАЕМЫЕ ЛОГИ (MARKETLOGS CSV)
export interface IMyUploadedOrder {
    orderID: string;
    typeID: number;
    solarSystemID: string;
    stationID: string;
    stationName: string;
    range: string;
    bid: boolean;
    price: number;
    volRemaining: number;
    regionID: string;
}

// Для элемента анализа конкуренции наследуем метрики цен
export interface IWarItem extends IPriceMetrics {
    name: string;
    orderID: string;
    status: 'OUTBID' | 'IGNORED' | '';
    isBuy: boolean;
}
