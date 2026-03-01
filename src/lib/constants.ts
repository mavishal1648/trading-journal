export const INSTRUMENTS = {
  NQ: { name: "NQ", fullName: "E-mini Nasdaq 100", tickSize: 0.25, tickValue: 5.0 },
  ES: { name: "ES", fullName: "E-mini S&P 500", tickSize: 0.25, tickValue: 12.5 },
} as const;

export const INSTRUMENT_OPTIONS = Object.values(INSTRUMENTS);

export const CORRELATED_GROUPS = {
  "Index Futures": ["NQ", "ES"],
} as const;

export const DIRECTIONS = ["LONG", "SHORT"] as const;
export const RESULTS = ["WIN", "LOSS", "BREAKEVEN"] as const;

export const MAX_SCREENSHOTS = 2;
export const MAX_RATING = 5;
