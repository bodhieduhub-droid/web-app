import { getISTDate } from "./date-utils";

export type FinancePeriod = "daily" | "weekly" | "monthly";

export type FinanceRow = {
  amount: number | string | null;
  type?: string | null;
  payment_mode?: string | null;
};

export type FinanceSummary = {
  revenue: number;
  expense: number;
  net: number;
  collectionsCount: number;
  refundCount: number;
  cashIn: number;
  upiIn: number;
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istParts(date = new Date()) {
  const istDate = getISTDate(date);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    day: istDate.getUTCDate(),
    weekday: istDate.getUTCDay(),
  };
}

function istWallClockToUtcIso(year: number, month: number, day: number) {
  const utcMs = Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

function addIstDaysToIso(startIso: string, days: number) {
  const date = new Date(startIso);
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function resolveFinancePeriod(raw: string | undefined): FinancePeriod {
  if (raw === "daily" || raw === "weekly" || raw === "monthly") return raw;
  return "monthly";
}

export function getFinancePeriodWindow(period: FinancePeriod, now = new Date()) {
  const { year, month, day, weekday } = istParts(now);
  if (period === "daily") {
    const startIso = istWallClockToUtcIso(year, month, day);
    return { startIso, endIso: addIstDaysToIso(startIso, 1), label: "Today (IST)" };
  }

  if (period === "weekly") {
    const mondayOffset = (weekday + 6) % 7;
    const wallStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    wallStart.setUTCDate(wallStart.getUTCDate() - mondayOffset);
    const startIso = istWallClockToUtcIso(
      wallStart.getUTCFullYear(),
      wallStart.getUTCMonth(),
      wallStart.getUTCDate(),
    );
    return { startIso, endIso: addIstDaysToIso(startIso, 7), label: "This Week (IST)" };
  }

  const startIso = istWallClockToUtcIso(year, month, 1);
  const endIso = istWallClockToUtcIso(month === 11 ? year + 1 : year, (month + 1) % 12, 1);
  return { startIso, endIso, label: "This Month (IST)" };
}

export function summarizeFinance(rows: FinanceRow[] | null | undefined): FinanceSummary {
  return (rows ?? []).reduce<FinanceSummary>(
    (acc, row) => {
      const amount = Number(row.amount ?? 0);
      const mode = (row.payment_mode ?? "").toLowerCase();
      const type = (row.type ?? "").toLowerCase();

      if (amount > 0) {
        acc.revenue += amount;
        acc.collectionsCount += 1;
        if (mode === "upi") acc.upiIn += amount;
        if (mode === "cash" || mode === "offline") acc.cashIn += amount;
      }
      if (amount < 0) {
        acc.expense += Math.abs(amount);
      }
      if (type === "refund" || amount < 0) {
        acc.refundCount += 1;
      }
      return acc;
    },
    { revenue: 0, expense: 0, net: 0, collectionsCount: 0, refundCount: 0, cashIn: 0, upiIn: 0 },
  );
}

export function finalizeFinance(summary: FinanceSummary): FinanceSummary {
  return {
    ...summary,
    net: summary.revenue - summary.expense,
  };
}
