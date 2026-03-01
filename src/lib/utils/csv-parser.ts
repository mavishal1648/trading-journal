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

// ─── Shared: convert raw deals into paired trades ────────────────────────────

function pairDealsIntoTrades(deals: MT5Deal[]): ParsedTrade[] {
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
      const matchingCloses: MT5Deal[] = [];
      let remainingVolume = openDeal.volume;

      for (let ci = 0; ci < closeDeals.length; ci++) {
        if (usedCloseDeals.has(ci)) continue;
        if (remainingVolume <= 0.001) break;

        const closeDeal = closeDeals[ci];
        if (closeDeal.time.getTime() < openDeal.time.getTime()) continue;

        const isOpenBuy = openDeal.type === "buy";
        const expectedCloseType = isOpenBuy ? "sell" : "buy";
        if (closeDeal.type !== expectedCloseType) continue;

        if (closeDeal.volume <= remainingVolume + 0.001) {
          matchingCloses.push(closeDeal);
          usedCloseDeals.add(ci);
          remainingVolume -= closeDeal.volume;
        }
      }

      if (matchingCloses.length > 0) {
        const totalPnl =
          matchingCloses.reduce(
            (sum, d) => sum + d.profit + d.commission + d.fee + d.swap,
            0
          ) +
          openDeal.commission +
          openDeal.fee +
          openDeal.swap;

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

  trades.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());
  return trades;
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseDealsFromCSV(text: string): MT5Deal[] {
  const lines = text
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

  const deals: MT5Deal[] = [];
  for (let i = dealsHeaderIndex + 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);

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

  return deals;
}

// ─── HTML Parser ─────────────────────────────────────────────────────────────

function parseDealsFromHTML(html: string): MT5Deal[] {
  // MT5 HTML reports use ONE big table with all sections (Positions, Orders,
  // Deals) as rows. We need to find the Deals header row inside it.

  // Extract all rows from the entire HTML
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = [...html.matchAll(rowRegex)];

  if (rows.length < 2) return [];

  // Scan all rows to find the Deals header (has "Direction" column)
  let dealsHeaderIndex = -1;
  let headerMap: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const cells = extractCells(rows[i][1]);
    const cellsLower = cells.map((c) => c.toLowerCase().trim());

    if (
      cellsLower.includes("direction") &&
      cellsLower.includes("symbol") &&
      cellsLower.includes("profit")
    ) {
      dealsHeaderIndex = i;
      cellsLower.forEach((h, idx) => {
        if (h) headerMap[h] = idx;
      });
      break;
    }
  }

  if (dealsHeaderIndex === -1) return [];

  const getField = (cells: string[], key: string): string => {
    const index = headerMap[key];
    return index !== undefined && index < cells.length ? cells[index] : "";
  };

  const deals: MT5Deal[] = [];

  for (let r = dealsHeaderIndex + 1; r < rows.length; r++) {
    const cells = extractCells(rows[r][1]);
    if (cells.length < 5) continue;

    const symbol = getField(cells, "symbol");
    const direction = getField(cells, "direction").toLowerCase();
    const type = getField(cells, "type").toLowerCase();

    // Skip non-trade rows (balance, credit, summary rows, etc.)
    if (!symbol || !resolveInstrument(symbol)) continue;
    if (direction !== "in" && direction !== "out") continue;

    const timeStr = getField(cells, "time");
    if (!timeStr) continue;

    deals.push({
      time: parseDateTime(timeStr),
      type,
      direction,
      symbol,
      volume: parseFloat(getField(cells, "volume")) || 0,
      price: parseFloat(getField(cells, "price")) || 0,
      order: getField(cells, "order"),
      commission:
        parseFloat(getField(cells, "commission").replace(/[\s,]/g, "")) || 0,
      fee: parseFloat(getField(cells, "fee").replace(/[\s,]/g, "")) || 0,
      swap: parseFloat(getField(cells, "swap").replace(/[\s,]/g, "")) || 0,
      profit:
        parseFloat(getField(cells, "profit").replace(/[\s,]/g, "")) || 0,
    });
  }

  return deals;
}

function extractCells(rowHTML: string): string[] {
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const matches = [...rowHTML.matchAll(cellRegex)];
  return matches.map((m) =>
    m[1]
      .replace(/<[^>]+>/g, "") // strip nested tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim()
  );
}

// ─── Main entry point: auto-detects CSV or HTML ─────────────────────────────

export function parseMT5File(text: string): ParsedTrade[] {
  // MT5 HTML reports are UTF-16LE encoded — strip null bytes
  const cleaned = text.replace(/\0/g, "");

  const isHTML = cleaned.trim().startsWith("<") || cleaned.includes("<table");

  const deals = isHTML ? parseDealsFromHTML(cleaned) : parseDealsFromCSV(cleaned);

  return pairDealsIntoTrades(deals);
}

/** @deprecated Use parseMT5File instead — kept for backward compatibility */
export const parseMT5CSV = parseMT5File;
