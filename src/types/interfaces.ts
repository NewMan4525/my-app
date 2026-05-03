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

export interface ISettings {
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
export interface IQueryOptions {
  method: "GET";
  headers: IStrObj;
}

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
export interface IHistory {
  average: number;
  date: string;
  highest: number;
  lowest: number;
  order_count: number;
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
export interface ICacheRow {
  url: string;
  etag: string | null;
  expires: number;
  data: string;
}
// interface IHistoryRow {
//   date: string;
//   average: number;
//   highest: number;
//   lowest: number;
//   order_count: number;
//   volume: number;
// }
