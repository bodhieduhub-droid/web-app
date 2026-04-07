export type PlanType = "daily" | "weekly" | "monthly";
export type AppRole = "super_admin" | "staff" | "student";
export type ExamCategory = "SSC" | "UPSSC" | "PSC" | "UPSC" | "BANKING" | "RAILWAY";

export const HUB_PRICING = {
  daily: 150,
  weekly: 650,
  monthly: 1650,
  registrationFee: 400,
  cautionDeposit: 300,
  prorataPerDay: 55,
  seatCapacity: 69,
} as const;

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  if (role === "reader") return "student";
  if (role === "super_admin" || role === "staff" || role === "student") {
    return role;
  }
  return null;
}

export function getDaysRemainingInMonth(joinDate: Date) {
  const year = joinDate.getFullYear();
  const month = joinDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return {
    remainingDays: daysInMonth - joinDate.getDate() + 1,
    daysInMonth,
  };
}

export function calculateMonthlyAdmissionAmount(
  joinDate: Date,
  monthlyFee: number = HUB_PRICING.monthly,
) {
  const isProrated = joinDate.getDate() > 1;
  const { remainingDays } = getDaysRemainingInMonth(joinDate);
  const baseAmount = isProrated ? remainingDays * HUB_PRICING.prorataPerDay : monthlyFee;

  return {
    baseAmount,
    remainingDays: isProrated ? remainingDays : undefined,
    registrationAmount: HUB_PRICING.registrationFee,
    cautionAmount: HUB_PRICING.cautionDeposit,
    totalAmount: baseAmount + HUB_PRICING.registrationFee + HUB_PRICING.cautionDeposit,
    isProrated,
  };
}

export function calculateInvoiceAmount(options: {
  planType: PlanType;
  joinDate?: Date;
  monthlyFee?: number;
  includeAdmissionFees?: boolean;
}) {
  const {
    planType,
    joinDate = new Date(),
    monthlyFee = HUB_PRICING.monthly,
    includeAdmissionFees = false,
  } = options;

  if (planType === "daily") {
    return {
      baseAmount: HUB_PRICING.daily,
      registrationAmount: 0,
      cautionAmount: 0,
      totalAmount: HUB_PRICING.daily,
      isProrated: false,
    };
  }

  if (planType === "weekly") {
    return {
      baseAmount: HUB_PRICING.weekly,
      registrationAmount: 0,
      cautionAmount: 0,
      totalAmount: HUB_PRICING.weekly,
      isProrated: false,
    };
  }

  const monthly = calculateMonthlyAdmissionAmount(joinDate, monthlyFee);
  if (includeAdmissionFees) {
    return monthly;
  }

  return {
    baseAmount: monthlyFee,
    registrationAmount: 0,
    cautionAmount: 0,
    totalAmount: monthlyFee,
    isProrated: false,
  };
}

export function isRegistrationFeeApplicable(joinDate: string | Date | null | undefined, referenceDate = new Date()) {
  if (!joinDate) return true;
  const parsedJoin = joinDate instanceof Date ? joinDate : new Date(joinDate);
  if (Number.isNaN(parsedJoin.getTime())) return true;

  const expiry = new Date(parsedJoin);
  expiry.setMonth(expiry.getMonth() + 6);
  return referenceDate > expiry;
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getCurrentBillingPeriod(date = new Date()) {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}
