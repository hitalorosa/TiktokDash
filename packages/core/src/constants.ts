export const DEFAULT_FILTER = {
  topN: 30,
  rankBy: "gmv" as const,
  tier1Gmv: 10000,
  tier2Gmv: 5000,
  windowDays: 30,
  currency: "BRL",
};

export const GEMINI = {
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};

export const CURRENCIES = ["BRL", "USD"] as const;
