// src/types/interfaces

export interface INumObj {
    [key: string]: number;
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

export interface IHub {
    region: { alias: string; name: string; id: number };
    system: { name: string; id: number };
    station: {
        name: string;
        id: number;
    };
    owners: {
        corporation: {
            alias: string;
            name: string;
        };
        faction: {
            alias: string;
            name: string;
        };
    };
}
export interface IHubs {
    [key: string]: IHub;
}
export interface ITIME {
    [key: string]: number;
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
    marketPlaceBuyIsCitadel: boolean; // НАЛОГ ПРИ ЗАКУПКЕ (Цитадель или NPC)
    marketPlaceSellIsCitadel: boolean; // НАЛОГ ПРИ ПРОДАЖЕ (Цитадель или NPC)
}

export interface IUserStats {
    [key: string]: {
        factionStand: number;
        stationOwnerStand: number;
    };
}
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
}
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

export interface IInfo {
    capacity: number;
    description: string;
    dogma_attributes?: object[];
    dogma_effects?: object[];
    graphic_id?: number;
    group_id: number;
    icon_id: number;
    market_group_id: number;
    mass: number;
    name: string;
    packaged_volume: number;
    portion_size: number;
    published: boolean;
    radius: number;
    type_id: number;
    volume: number;
}

export interface IMarketItem {
    buy: number;
    sell: number;
    name: string;
    orders: number;
    vol: number;
    roi: number;
    ipm: number;
    type_id: number;
}
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

export interface IWarItem {
    name: string;
    vol: number;
    buy: number;
    sell: number;
    roi: number;
    ipm: number;
    orderID: string;
    status: 'OUTBID' | 'IGNORED' | '';
    isBuy: boolean; // <-- Добавляем строгое разделение по типу
}
