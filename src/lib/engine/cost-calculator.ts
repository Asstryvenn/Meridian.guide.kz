import type { University } from "@/lib/types";

export type Currency = "USD" | "KZT" | "EUR" | "GBP";

export const currencyRates: Record<Currency, { symbol: string; rateFromUsd: number }> = {
  USD: { symbol: "$", rateFromUsd: 1.0 },
  KZT: { symbol: "₸", rateFromUsd: 510.0 },
  EUR: { symbol: "€", rateFromUsd: 0.92 },
  GBP: { symbol: "£", rateFromUsd: 0.78 },
};

export interface CostBreakdown {
  tuition: number;
  housing: number;
  insurance: number;
  visa: number;
  flights: number;
  living: number;
  totalUsd: number;
  familyBudgetUsd: number;
  gapUsd: number;
}

export function calculateCostBreakdown(
  uni: University | null,
  custom: Partial<CostBreakdown>,
  familyBudgetUsd: number
): CostBreakdown {
  const tuition = custom.tuition ?? uni?.intlTuitionUsd.value?.[0] ?? 28000;
  const living = custom.living ?? uni?.livingCostUsd.value ?? 12000;
  const housing = custom.housing ?? uni?.housing_cost ?? 9500;
  const insurance = custom.insurance ?? uni?.insurance_cost ?? 2400;
  const visa = custom.visa ?? uni?.visa_fees ?? 510;
  const flights = custom.flights ?? uni?.flight_estimate ?? 1800;

  const totalUsd = tuition + housing + insurance + visa + flights + living;
  const gapUsd = Math.max(0, totalUsd - familyBudgetUsd);

  return {
    tuition,
    housing,
    insurance,
    visa,
    flights,
    living,
    totalUsd,
    familyBudgetUsd,
    gapUsd,
  };
}

export function formatCurrency(amountUsd: number, currency: Currency): string {
  const info = currencyRates[currency];
  const converted = Math.round(amountUsd * info.rateFromUsd);
  return `${info.symbol}${converted.toLocaleString()}`;
}
