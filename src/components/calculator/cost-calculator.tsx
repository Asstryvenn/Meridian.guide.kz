"use client";

import { useState, useMemo } from "react";
import { DollarSign, Check } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { universities } from "@/lib/data/universities";
import {
  calculateCostBreakdown,
  formatCurrency,
  type Currency,
} from "@/lib/engine/cost-calculator";
import { useT } from "@/lib/i18n/use-t";

export function CostCalculator() {
  const tx = useT();
  const { profile } = useApp();
  const { t } = useI18n();

  const [selectedUniSlug, setSelectedUniSlug] = useState<string>(
    universities[0]?.slug || ""
  );
  const [currency, setCurrency] = useState<Currency>("USD");

  const [tuition, setTuition] = useState<number>(38000);
  const [housing, setHousing] = useState<number>(11000);
  const [insurance, setInsurance] = useState<number>(2500);
  const [visa, setVisa] = useState<number>(510);
  const [flights, setFlights] = useState<number>(1800);
  const [living, setLiving] = useState<number>(7500);
  const [customBudget, setCustomBudget] = useState<number>(profile.annualBudgetUsd || 25000);

  const selectedUni = universities.find((u) => u.slug === selectedUniSlug) || null;

  const handleUniChange = (slug: string) => {
    setSelectedUniSlug(slug);
    const uni = universities.find((u) => u.slug === slug);
    if (uni) {
      if (uni.intlTuitionUsd.value) setTuition(uni.intlTuitionUsd.value[0]);
      if (uni.livingCostUsd.value) setLiving(Math.round(uni.livingCostUsd.value * 0.45));
      if (uni.housing_cost) setHousing(uni.housing_cost);
      if (uni.insurance_cost) setInsurance(uni.insurance_cost);
      if (uni.visa_fees) setVisa(uni.visa_fees);
      if (uni.flight_estimate) setFlights(uni.flight_estimate);
    }
  };

  const breakdown = useMemo(() => {
    return calculateCostBreakdown(
      selectedUni,
      { tuition, housing, insurance, visa, flights, living },
      customBudget
    );
  }, [selectedUni, tuition, housing, insurance, visa, flights, living, customBudget]);

  const items = [
    { label: t.calculator.tuitionFees, value: breakdown.tuition, color: "#EBAE29", bgClass: "bg-[#EBAE29]" },
    { label: t.calculator.housing, value: breakdown.housing, color: "#589C80", bgClass: "bg-[#589C80]" },
    { label: t.calculator.livingExpenses, value: breakdown.living, color: "#4a7c6a", bgClass: "bg-[#4a7c6a]" },
    { label: t.calculator.insurance, value: breakdown.insurance, color: "#3f7f64", bgClass: "bg-[#3f7f64]" },
    { label: t.calculator.flights, value: breakdown.flights, color: "#d99a12", bgClass: "bg-[#d99a12]" },
    { label: t.calculator.visaFees, value: breakdown.visa, color: "#a8d5ba", bgClass: "bg-[#a8d5ba]" },
  ];

  const total = breakdown.totalUsd || 1;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = items.map((item) => {
    const fraction = item.value / total;
    const strokeDasharray = `${circumference * fraction} ${circumference * (1 - fraction)}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += circumference * fraction;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      fraction,
    };
  });

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-panel/85 border border-[#589C80]/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <DollarSign size={22} className="text-amber-ink" />
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {t.calculator.title}
            </h2>
          </div>
          <p className="text-xs text-ink/70 max-w-xl">
            {t.calculator.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-panel p-1 rounded-2xl border border-[#589C80]/30">
            {(["USD", "KZT", "EUR", "GBP"] as Currency[]).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  currency === cur
                    ? "bg-[#589C80] text-on-accent shadow-md"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-panel/85 border border-[#589C80]/30 backdrop-blur-xl shadow-xl space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-amber-ink uppercase">
                {t.calculator.selectUniversity}
              </label>
              <select
                value={selectedUniSlug}
                onChange={(e) => handleUniChange(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-panel border border-[#589C80]/40 text-ink font-semibold focus:outline-none focus:border-[#EBAE29] cursor-pointer"
              >
                {universities.map((u) => (
                  <option key={u.slug} value={u.slug}>
                    {u.name} ({u.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink/70">{t.calculator.tuitionFees}</span>
                  <span className="text-amber-ink font-bold">
                    {formatCurrency(tuition, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90000"
                  step="500"
                  value={tuition}
                  onChange={(e) => setTuition(Number(e.target.value))}
                  className="w-full accent-[#EBAE29] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink/70">{t.calculator.housing}</span>
                  <span className="text-green-ink font-bold">
                    {formatCurrency(housing, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="250"
                  value={housing}
                  onChange={(e) => setHousing(Number(e.target.value))}
                  className="w-full accent-[#589C80] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink/70">{t.calculator.livingExpenses}</span>
                  <span className="text-ink font-bold">
                    {formatCurrency(living, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="250"
                  value={living}
                  onChange={(e) => setLiving(Number(e.target.value))}
                  className="w-full accent-[var(--text)] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink/70">{t.calculator.insurance}</span>
                  <span className="text-green-ink font-bold">
                    {formatCurrency(insurance, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8000"
                  step="100"
                  value={insurance}
                  onChange={(e) => setInsurance(Number(e.target.value))}
                  className="w-full accent-[#3f7f64] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink/70">{t.calculator.flights}</span>
                  <span className="text-amber-ink font-bold">
                    {formatCurrency(flights, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6000"
                  step="100"
                  value={flights}
                  onChange={(e) => setFlights(Number(e.target.value))}
                  className="w-full accent-[#d99a12] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ink/70">{t.calculator.visaFees}</span>
                  <span className="text-green-ink font-bold">
                    {formatCurrency(visa, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={visa}
                  onChange={(e) => setVisa(Number(e.target.value))}
                  className="w-full accent-[#a8d5ba] cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#589C80]/20 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-ink font-bold">{t.calculator.familyBudget}</span>
                <span className="text-ink font-extrabold">
                  {formatCurrency(customBudget, currency)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={customBudget}
                onChange={(e) => setCustomBudget(Number(e.target.value))}
                className="w-full accent-[#EBAE29] cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-panel/85 border border-[#589C80]/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                {segments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-mono text-ink/60 uppercase">
                  
                  {tx("Annual Cost")}
                </span>
                <span className="text-sm font-extrabold font-mono text-amber-ink">
                  {formatCurrency(breakdown.totalUsd, currency)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 w-full">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs font-mono p-2 rounded-xl bg-panel border border-[#589C80]/20"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${item.bgClass}`}
                    />
                    <span className="text-ink/80">{item.label}</span>
                  </div>
                  <span className="font-bold text-ink">
                    {formatCurrency(item.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-panel/90 border border-[#589C80]/30 backdrop-blur-xl shadow-xl space-y-1">
              <span className="text-xs font-mono uppercase text-ink/60">
                {t.calculator.totalAnnualCost}
              </span>
              <p className="text-2xl font-extrabold font-mono text-amber-ink">
                {formatCurrency(breakdown.totalUsd, currency)}
              </p>
              <p className="text-[11px] text-green-ink font-mono">
                
                {tx("Full comprehensive estimate")}
              </p>
            </div>

            <div
              className={`p-5 rounded-3xl border backdrop-blur-xl shadow-xl space-y-1 ${
                breakdown.gapUsd > 0
                  ? "bg-red-950/20 border-red-800/40 text-red-300"
                  : "bg-[#589C80]/20 border-[#589C80]/40 text-green-ink"
              }`}
            >
              <span className="text-xs font-mono uppercase">
                {breakdown.gapUsd > 0
                  ? t.calculator.outOfPocketGap
                  : t.calculator.coveredSurplus}
              </span>
              <p className="text-2xl font-extrabold font-mono">
                {breakdown.gapUsd > 0 ? (
                  formatCurrency(breakdown.gapUsd, currency)
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Check size={20} /> {tx("Fully Covered")}
                  </span>
                )}
              </p>
              <p className="text-[11px] font-mono opacity-80">
                {breakdown.gapUsd > 0
                  ? tx("Scholarships or financial aid required")
                  : tx("Family budget exceeds estimated cost")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
