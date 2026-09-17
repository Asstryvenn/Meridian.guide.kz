"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Check, Sparkles } from "lucide-react";
import type { University } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";

interface TrueCostCalculatorProps {
  university: University;
  userCountry?: string;
  userBudgetUsd?: number;
}

interface CostItem {
  id: string;
  label: string;
  amount: number;
  color: string;
  detail: string;
}

export function TrueCostCalculator({ university, userCountry = "Kazakhstan", userBudgetUsd = 30000 }: TrueCostCalculatorProps) {
  const t = useT();
  const [applyScholarships, setApplyScholarships] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const tuitionMin = university.intlTuitionUsd.value ? university.intlTuitionUsd.value[0] : 45000;
  const tuitionMax = university.intlTuitionUsd.value ? university.intlTuitionUsd.value[1] : 55000;
  const baseTuition = Math.round((tuitionMin + tuitionMax) / 2);

  const totalLiving = university.livingCostUsd.value ?? 18000;
  const housingCost = university.housing_cost ?? Math.round(totalLiving * 0.55);
  const foodCost = university.food_estimate ?? Math.round(totalLiving * 0.30);
  const insuranceCost = university.insurance_cost ?? 3200;
  const visaFees = university.visa_fees ?? 510;

  const isLocalFlight = userCountry.toLowerCase() === university.country.toLowerCase();
  const flightCost = university.flight_estimate ?? (isLocalFlight ? 400 : 1800);

  let scholarshipDiscount = 0;
  if (applyScholarships) {
    const aidType = university.needBasedAidIntl.value;
    if (aidType === "full_need") {
      scholarshipDiscount = Math.round(baseTuition * 0.85);
    } else if (aidType === "limited") {
      scholarshipDiscount = Math.round(baseTuition * 0.40);
    } else if (university.scholarshipIds.length > 0) {
      scholarshipDiscount = 15000;
    } else {
      scholarshipDiscount = 5000;
    }
  }

  const effectiveTuition = Math.max(0, baseTuition - scholarshipDiscount);

  const items: CostItem[] = [
    { id: "tuition", label: t("Tuition & Academic Fees"), amount: effectiveTuition, color: "#EBAE29", detail: applyScholarships ? t("${baseTuition} less ${scholarshipDiscount} scholarship aid", { baseTuition: baseTuition.toLocaleString(), scholarshipDiscount: scholarshipDiscount.toLocaleString() }) : t("Annual published international tuition rate") },
    { id: "housing", label: t("Housing & Residence"), amount: housingCost, color: "#589C80", detail: t("On-campus or nearby off-campus student accommodation") },
    { id: "food", label: t("Food & Dining Plan"), amount: foodCost, color: "#9CD0A8", detail: t("Standard campus dining hall or meal budget") },
    { id: "insurance", label: t("Health & Medical Insurance"), amount: insuranceCost, color: "#E2C37A", detail: t("Mandatory university student health coverage") },
    { id: "visa", label: t("Visa & SEVIS Fees"), amount: visaFees, color: "#7FA393", detail: t("Student visa processing, SEVIS I-90 / Embassy fee") },
    { id: "flight", label: t("Roundtrip Travel & Flights"), amount: flightCost, color: "#5d8f79", detail: t("Estimated flight from {userCountry} to {city}", { userCountry: userCountry, city: university.city }) },
  ];

  const grossTotal = baseTuition + housingCost + foodCost + insuranceCost + visaFees + flightCost;
  const netTotal = items.reduce((acc, item) => acc + item.amount, 0);
  const budgetGap = userBudgetUsd ? netTotal - userBudgetUsd : 0;

  let cumulativeAngle = 0;
  const donutSegments = items.map((item) => {
    const percentage = netTotal > 0 ? item.amount / netTotal : 0;
    const angle = percentage * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return {
      ...item,
      percentage,
      startAngle,
      angle,
    };
  });

  const getCoordinatesForAngle = (angleInDegrees: number, radius = 80) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: 100 + radius * Math.cos(angleInRadians),
      y: 100 + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <div className="w-full p-6 rounded-2xl bg-panel/90 border border-[#589C80]/30 backdrop-blur-xl text-ink space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#589C80]/20 pb-4">
        <div>
          <h3 className="text-xl font-bold text-ink flex items-center gap-2">
            <BarChart3 size={20} className="text-green-ink" /> {t("True Cost of Attendance Calculator")}
          </h3>
          <p className="text-xs text-ink/70">
            {t("Complete annual cost estimation tailored for applicants from {country}.", { country: t(userCountry) })}
          </p>
        </div>

        <button
          onClick={() => setApplyScholarships((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            applyScholarships
              ? "bg-[#EBAE29]/20 border-[#EBAE29] text-amber-ink shadow-lg shadow-[#EBAE29]/10"
              : "bg-panel border-[#589C80]/40 text-ink/70 hover:border-[#589C80]"
          }`}
        >
          {applyScholarships ? <Check size={14} /> : <Sparkles size={14} />}
          <span>{t("Apply Estimated Scholarships")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {donutSegments.map((seg) => {
                if (seg.percentage <= 0) return null;
                const strokeWidth = activeSegment === seg.id ? 28 : 22;
                const radius = 70;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(seg.percentage * circumference)} ${circumference}`;
                const strokeDashoffset = -((seg.startAngle / 360) * circumference);

                return (
                  <motion.circle
                    key={seg.id}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer hover:opacity-90"
                    onMouseEnter={() => setActiveSegment(seg.id)}
                    onMouseLeave={() => setActiveSegment(null)}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
              <span className="text-xs uppercase font-mono tracking-widest text-ink/60">{t("Annual Total")}</span>
              <span className="text-2xl font-extrabold text-amber-ink">${netTotal.toLocaleString()}</span>
              {applyScholarships && scholarshipDiscount > 0 && (
                <span className="text-xs text-green-ink font-semibold">{t("Saved ${amount}", { amount: scholarshipDiscount.toLocaleString() })}</span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item) => {
              const isHovered = activeSegment === item.id;
              const pct = netTotal > 0 ? Math.round((item.amount / netTotal) * 100) : 0;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveSegment(item.id)}
                  onMouseLeave={() => setActiveSegment(null)}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isHovered
                      ? "bg-[#589C80]/20 border-[#EBAE29] scale-[1.02]"
                      : "bg-panel/80 border-[#589C80]/20 hover:border-[#589C80]/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12">
                        <circle cx="6" cy="6" r="5" fill={item.color} />
                      </svg>
                      <span className="text-xs font-semibold text-ink">{item.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-ink">${item.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-ink/60">
                    <span className="truncate max-w-[160px]">{item.detail}</span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-panel border border-[#589C80]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-ink/70">{t("Stated Annual Budget:")} <span className="font-mono text-ink font-semibold">${userBudgetUsd.toLocaleString()}</span></div>
              <div className="text-ink/70">
                {t("Gross Cost (Before Aid):")} <span className="font-mono text-ink">${grossTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-lg font-mono font-bold text-xs ${
              budgetGap <= 0
                ? "bg-[#589C80]/20 border border-[#589C80] text-green-ink"
                : "bg-[#EBAE29]/20 border border-[#EBAE29] text-amber-ink"
            }`}>
              {budgetGap <= 0
                ? t("Fully Funded (${abs} surplus)", { abs: Math.abs(budgetGap).toLocaleString() })
                : t("Budget Gap: +${budgetGap}/yr", { budgetGap: budgetGap.toLocaleString() })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
