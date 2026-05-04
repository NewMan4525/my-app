import { ITradeSettings } from "@/src/types/interfaces";

export const tradeSettings: ITradeSettings = {
  region: "heimatar",
  time: "month",
  priceMin: 1,
  priceMax: 3000000000,
  marginMin: 15,
  marginMax: 20,
  volumeMin: 1,
  volumeMax: 100,
  ordersMin: 1,
  ordersMax: 5,
  TAX: 3.37,
  FEES: 1.31,
  marketPlaceisCitadel: true,
};
