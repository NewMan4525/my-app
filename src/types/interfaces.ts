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
  [key: string]: {
    region: { alias: string; name: string; id: number };
    system: { name: string; id: number };
    station: {
      name: string;
      id: number;
    };
  };
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
  marketPlaceisCitadel: boolean;
}

export interface IUserStats {
  the_forge: {
    factionStans: number;
    stationOwnerStand: number;
  };
  domain: {
    factionStans: number;
    stationOwnerStand: number;
  };
  sinq_laison: {
    factionStans: number;
    stationOwnerStand: number;
  };
  metropolis: {
    factionStans: number;
    stationOwnerStand: number;
  };
  heimatar: {
    factionStans: number;
    stationOwnerStand: number;
  };
}
export interface IQueryOptions {
  method: string;
  Headers: {
    "Accept-Language": string;
    "If-None-Match": string;
    "X-Compatibility-Date": string;
    "X-Tenant": string;
    "If-Modified-Since": string;
    "Content-Type": string;
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
