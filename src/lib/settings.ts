import { ISettings } from "@/src/types/interfaces";

export const settings: ISettings = {
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

// const caldariStand = 2.03;
// const caldariNavyStand = 6.52;
// const brokerDailiSkill = 5;
// const accountingSkill = 5;
// const factionStand = caldariStand;
// const corpStand = caldariNavyStand;

// const SCCtaking = 0.5; //citadel tax buy

// const bc = 3 - 0.3 * brokerDailiSkill - 0.03 * factionStand - 0.02 * corpStand; //buy/sell

// const taxSCC = 7.5 - 7.5 * 0.11 * accountingSkill; //3.37  sell
// const isCita = settings.marketPlaceisCitadel;

// let buy = 150000; //bc =100 cita + (citadel.tax)optional

// let sell = 177700; //bc 100 cita + taxSCC + corp
// const RAW = (sell - buy) / (buy * 0.01);
// buy += isCita
//   ? buy * 0.01 * taxSCC + buy * 0.01 * 0.5 + 100
//   : Math.max(buy * 0.01 * bc, 100);

// sell -= isCita
//   ? sell * 0.01 * taxSCC + sell * 0.01 * 0.5 + 100
//   : sell * 0.01 * taxSCC + Math.max(sell * 0.01 * bc, 100);

// const invest = buy;
// const ROI = ((sell - buy) / invest) * 100;

// const vol = 10;
// const IPM = ROI * vol;
// console.log("ipm", IPM);
