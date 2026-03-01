export type ParsedTrade = {
  instrument: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  tradeDate: Date;
  entryTime: Date;
  exitTime: Date;
  result: "WIN" | "LOSS" | "BREAKEVEN";
};

type MT5Deal = {
  time: Date;
  type: string; // "buy" or "sell"
  direction: string; // "in" or "out"
  symbol: string;
  volume: number;
  price: number;
  order: string;
  commission: number;
  fee: number;
  swap: number;
  profit: number;
};

const NQ_PATTERNS = ["NQ", "NAS100", "USTEC", "NASDAQ"];
const ES_PATTERNS = ["ES", "US500", "SP500", "SPX500"];

function resolveInstrument(symbol: string): string | null {
  const upper = symbol.toUpperCase();
  if (NQ_PATTERNS.some((p) => upper.includes(p))) return "NQ";
  if (ES_PATTERNS.some((p) => upper.includes(p))) return "ES";
  return null;
}

function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseDateTime(value: string): Date {
  // MT5 exports dates as "YYYY.MM.DD HH:MM:SS"
  const normalized = value.replace(/\./g, "-");
  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    return new Date(value);
  }
  return date;
}

function determineResult(pnl: number): "WIN" | "LOSS" | "BREAKEVEN" {
  if (pnl > 0) return "WIN";
  if (pnl < 0) return "LOSS";
  return "BREAKEVEN";
}

export function parseMT5CSV(csvText: string): ParsedTrade[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  // Find the "Deals" section header — it has a "Direction" column
  let dealsHeaderIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (
      lower.includes("direction") &&
      lower.includes("time") &&
      lower.includes("symbol") &&
      lower.includes("profit")
    ) {
      dealsHeaderIndex = i;
      break;
    }
  }

  if (dealsHeaderIndex === -1) return [];

  const headers = parseCSVRow(lines[dealsHeaderIndex]);
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[h.toLowerCase().trim()] = i;
  });

  const getField = (fields: string[], key: string): string => {
    const index = headerMap[key];
    return index !== undefined && index < fields.length ? fields[index] : "";
  };

  // Parse all deals from the Deals section
  const deals: MT5Deal[] = [];
  for (let i = dealsHeaderIndex + 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);

    // Stop at section break (empty row or new section like "Orders", "Results", etc.)
    const firstField = fields[0] ?? "";
    if (
      fields.every((f) => f === "") ||
      (!firstField.match(/^\d{4}/) && firstField !== "")
    ) {
      break;
    }

    const symbol = getField(fields, "symbol");
    const direction = getField(fields, "direction").toLowerCase();
    const type = getField(fields, "type").toLowerCase();

    // Skip non-trade rows (balance, credit, etc.)
    if (!symbol || !resolveInstrument(symbol)) continue;
    if (direction !== "in" && direction !== "out") continue;

    const timeStr = getField(fields, "time");
    if (!timeStr) continue;

    deals.push({
      time: parseDateTime(timeStr),
      type,
      direction,
      symbol,
      volume: parseFloat(getField(fields, "volume")) || 0,
      price: parseFloat(getField(fields, "price")) || 0,
      order: getField(fields, "order"),
      commission:
        parseFloat(getField(fields, "commission").replace(/\s/g, "")) || 0,
      fee: parseFloat(getField(fields, "fee").replace(/\s/g, "")) || 0,
      swap: parseFloat(getField(fields, "swap").replace(/\s/g, "")) || 0,
      profit: parseFloat(getField(fields, "profit").replace(/\s/g, "")) || 0,
    });
  }

  // Group deals by symbol
  const dealsBySymbol = new Map<string, MT5Deal[]>();
  for (const deal of deals) {
    const key = deal.symbol;
    if (!dealsBySymbol.has(key)) {
      dealsBySymbol.set(key, []);
    }
    dealsBySymbol.get(key)!.push(deal);
  }

  const trades: ParsedTrade[] = [];

  for (const [symbol, symbolDeals] of dealsBySymbol) {
    const instrument = resolveInstrument(symbol)!;

    // Sort by time
    symbolDeals.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Separate opening ("in") and closing ("out") deals
    const openDeals = symbolDeals.filter((d) => d.direction === "in");
    const closeDeals = symbolDeals.filter((d) => d.direction === "out");

    // Track which close deals are used
    const usedCloseDeals = new Set<number>();

    for (const openDeal of openDeals) {
      // Find all matching close deals for this open deal
      // Match by: same symbol, opposite type, close time > open time
      // Handle partial closes (multiple out deals summing to open volume)
      const matchingCloses: MT5Deal[] = [];
      let remainingVolume = openDeal.volume;

      for (let ci = 0; ci < closeDeals.length; ci++) {
        if (usedCloseDeals.has(ci)) continue;
        if (remainingVolume <= 0.001) break;

        const closeDeal = closeDeals[ci];

        // Close must be after open and opposite type
        if (closeDeal.time.getTime() < openDeal.time.getTime()) continue;

        const isOpenBuy = openDeal.type === "buy";
        const expectedCloseType = isOpenBuy ? "sell" : "buy";
        if (closeDeal.type !== expectedCloseType) continue;

        // Check if volume fits
        if (closeDeal.volume <= remainingVolume + 0.001) {
          matchingCloses.push(closeDeal);
          usedCloseDeals.add(ci);
          remainingVolume -= closeDeal.volume;
        }
      }

      if (matchingCloses.length > 0) {
        // Sum P&L, commission, swap from all closing deals + opening deal costs
        const totalPnl =
          matchingCloses.reduce(
            (sum, d) => sum + d.profit + d.commission + d.fee + d.swap,
            0
          ) +
          openDeal.commission +
          openDeal.fee +
          openDeal.swap;

        // Weighted average exit price
        const totalCloseVolume = matchingCloses.reduce(
          (sum, d) => sum + d.volume,
          0
        );
        const weightedExitPrice =
          totalCloseVolume > 0
            ? matchingCloses.reduce(
                (sum, d) => sum + d.price * d.volume,
                0
              ) / totalCloseVolume
            : openDeal.price;

        const lastClose = matchingCloses[matchingCloses.length - 1];

        trades.push({
          instrument,
          direction: openDeal.type === "buy" ? "LONG" : "SHORT",
          entryPrice: openDeal.price,
          exitPrice: Math.round(weightedExitPrice * 100) / 100,
          quantity: Math.round(openDeal.volume) || 1,
          pnl: Math.round(totalPnl * 100) / 100,
          tradeDate: new Date(lastClose.time.toDateString()),
          entryTime: openDeal.time,
          exitTime: lastClose.time,
          result: determineResult(totalPnl),
        });
      }
    }
  }

  // Sort trades by entry time
  trades.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());

  return trades;
}
