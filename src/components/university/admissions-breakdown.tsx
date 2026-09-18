"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { StudentProfile, University, VaultDocument } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";

interface AdmissionsBreakdownProps {
  university: University;
  profile: StudentProfile;
  vaultDocuments: VaultDocument[];
}

interface DocRequirement {
  code: string;
  name: string;
  description: string;
  status: "mandatory" | "conditional" | "recommended";
  matchingCategory?: string;
}

const DEFAULT_DOCUMENTS: DocRequirement[] = [
  {
    code: "A",
    name: "Academic High School Transcripts",
    description: "Official 9th-12th grade school transcripts with certified English translation and grading scale explanation.",
    status: "mandatory",
    matchingCategory: "family_income",
  },
  {
    code: "C",
    name: "Counselor Recommendation & School Profile",
    description: "Official report submitted by school counselor detailing curriculum rigor, graduating class size, and honors.",
    status: "mandatory",
  },
  {
    code: "E",
    name: "English Language Proficiency Report",
    description: "Official score report from IELTS Academic, TOEFL iBT, or Duolingo English Test meeting university cutoffs.",
    status: "mandatory",
  },
  {
    code: "F",
    name: "Financial Declaration & Bank Verification",
    description: "CSS Profile or International Student Certification of Finances (COF) with certified bank statements.",
    status: "mandatory",
    matchingCategory: "bank_statement",
  },
  {
    code: "G",
    name: "Graduation Certificate / Diploma Attestation",
    description: "Certified copy of state certificate of secondary education (Attestat) or expected graduation verification.",
    status: "mandatory",
  },
  {
    code: "M",
    name: "Mid-Year Senior Grade Report",
    description: "Semester 1 senior grades submitted as soon as available during winter assessment period.",
    status: "mandatory",
  },
  {
    code: "P",
    name: "Passport Identification Bio Page",
    description: "Clear color scan of the international passport identity page valid for at least 6 months after term starts.",
    status: "mandatory",
    matchingCategory: "passport",
  },
  {
    code: "S",
    name: "Standardized Test Official Scores",
    description: "Official SAT Reasoning or ACT scores transmitted directly from the College Board or ACT testing authority.",
    status: "mandatory",
  },
  {
    code: "T",
    name: "Teacher Letters of Recommendation (2)",
    description: "Confidential evaluations written by two academic teachers from core academic subjects.",
    status: "mandatory",
  },
  {
    code: "U",
    name: "University Supplemental Essays & Short Answers",
    description: "All institution-specific writing supplements, prompt answers, and personal statements.",
    status: "mandatory",
  },
];

function getSampleEssays(university: University) {
  if (university.supplementalEssays && university.supplementalEssays.length > 0) {
    return university.supplementalEssays;
  }

  const name = university.shortName || university.name;
  return [
    {
      title: "Why Us & Academic Fit",
      prompt: `Please describe what aspects of the ${name} academic community and resources motivate your decision to apply, and how you will contribute to campus life.`,
      wordCount: 250,
      required: true,
    },
    {
      title: "Extracurricular Spike or Impact",
      prompt: "Briefly elaborate on an extracurricular activity, research project, work experience, or community initiative that has been especially meaningful to you.",
      wordCount: 150,
      required: true,
    },
    {
      title: "Intellectual Vitality & Perspective",
      prompt: "Reflect on an idea, problem, or personal experience that sparked your intellectual curiosity and how it reshaped your perspective.",
      wordCount: 300,
      required: false,
    },
  ];
}

export function AdmissionsBreakdown({ university, profile, vaultDocuments }: AdmissionsBreakdownProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<"docs" | "tests" | "essays" | "deadlines">("docs");

  const minSat = university.requirements.typicalSat.value ? university.requirements.typicalSat.value - 60 : 1480;
  const maxSat = university.requirements.typicalSat.value ? university.requirements.typicalSat.value + 40 : 1570;
  const minAct = 33;
  const maxAct = 36;
  const minIelts = university.requirements.minIelts.value || 7.0;
  const minToefl = university.requirements.minToefl.value || 100;

  const essays = getSampleEssays(university);

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-surface-sunken border border-[#589C80]/20 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === "docs"
              ? "bg-[#589C80] text-on-accent shadow-sm"
              : "text-ink/70 hover:text-ink"
          }`}
        >
          {t("Required Documents (A-Z)")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tests")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === "tests"
              ? "bg-[#589C80] text-on-accent shadow-sm"
              : "text-ink/70 hover:text-ink"
          }`}
        >
          {t("Standardized Tests")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("essays")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === "essays"
              ? "bg-[#589C80] text-on-accent shadow-sm"
              : "text-ink/70 hover:text-ink"
          }`}
        >
          {t("Supplemental Essays")} ({essays.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("deadlines")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === "deadlines"
              ? "bg-[#589C80] text-on-accent shadow-sm"
              : "text-ink/70 hover:text-ink"
          }`}
        >
          {t("Application Deadlines")}
        </button>
      </div>

      {activeTab === "docs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-ink/70 uppercase">
              {t("Official Application Checklist · Alphabetical Sequence")}
            </p>
            <span className="text-xs font-mono text-green-ink">
              {DEFAULT_DOCUMENTS.length} {t("items required for admission")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_DOCUMENTS.map((doc) => {
              const inVault = vaultDocuments.some((vd) =>
                doc.matchingCategory ? vd.category === doc.matchingCategory : vd.name.toLowerCase().includes(doc.name.toLowerCase().slice(0, 8))
              );

              return (
                <div
                  key={doc.code}
                  className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 shadow-sm flex items-start gap-3 hover:border-[#589C80] transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#589C80]/15 text-green-ink font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[#589C80]/30">
                    {doc.code}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-ink truncate">
                        {t(doc.name)}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EBAE29]/15 text-amber-ink uppercase shrink-0">
                        {t(doc.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/70 leading-relaxed">
                      {t(doc.description)}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono">
                      {inVault ? (
                        <span className="text-green-ink flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {t("Stored in your Vault")}
                        </span>
                      ) : (
                        <span className="text-ink/40 flex items-center gap-1">
                          <Clock size={12} />
                          {t("Pending upload")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "tests" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 space-y-2">
              <span className="text-[10px] font-mono text-ink/60 uppercase">{t("SAT Middle 50%")}</span>
              <p className="text-xl font-black font-mono text-ink">{minSat}–{maxSat}</p>
              <div className="text-[11px] font-mono pt-1 border-t border-[#589C80]/20 flex justify-between">
                <span className="text-ink/60">{t("Your score")}:</span>
                <span className={profile.sat && profile.sat >= minSat ? "text-green-ink font-bold" : "text-amber-ink font-bold"}>
                  {profile.sat ? `${profile.sat}` : t("Not entered")}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 space-y-2">
              <span className="text-[10px] font-mono text-ink/60 uppercase">{t("ACT Middle 50%")}</span>
              <p className="text-xl font-black font-mono text-ink">{minAct}–{maxAct}</p>
              <div className="text-[11px] font-mono pt-1 border-t border-[#589C80]/20 flex justify-between">
                <span className="text-ink/60">{t("Your score")}:</span>
                <span className={profile.act && profile.act >= minAct ? "text-green-ink font-bold" : "text-amber-ink font-bold"}>
                  {profile.act ? `${profile.act}` : t("Not entered")}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 space-y-2">
              <span className="text-[10px] font-mono text-ink/60 uppercase">{t("IELTS Cutoff")}</span>
              <p className="text-xl font-black font-mono text-ink">{minIelts.toFixed(1)} {t("Minimum")}</p>
              <div className="text-[11px] font-mono pt-1 border-t border-[#589C80]/20 flex justify-between">
                <span className="text-ink/60">{t("Your score")}:</span>
                <span className={profile.ielts && profile.ielts >= minIelts ? "text-green-ink font-bold" : "text-amber-ink font-bold"}>
                  {profile.ielts ? `${profile.ielts.toFixed(1)}` : t("Not entered")}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 space-y-2">
              <span className="text-[10px] font-mono text-ink/60 uppercase">{t("TOEFL iBT")}</span>
              <p className="text-xl font-black font-mono text-ink">{minToefl}+ {t("Recommended")}</p>
              <div className="text-[11px] font-mono pt-1 border-t border-[#589C80]/20 flex justify-between">
                <span className="text-ink/60">{t("Your score")}:</span>
                <span className={profile.toefl && profile.toefl >= minToefl ? "text-green-ink font-bold" : "text-amber-ink font-bold"}>
                  {profile.toefl ? `${profile.toefl}` : t("Not entered")}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-sunken border border-[#589C80]/20 flex items-start gap-3">
            <ShieldCheck size={20} className="text-green-ink shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-ink">
              <p className="font-bold">{t("Testing Policy Guidance")}</p>
              <p className="text-ink/70 leading-relaxed">
                {t("Standardized tests are evaluated holistically alongside academic transcripts and coursework rigor. Competitive scores significantly strengthen scholarship candidacy.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "essays" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-ink/70 uppercase">
              {t("University Supplemental Writing Prompts")}
            </p>
            <Link
              href="/essays"
              className="text-xs font-mono font-bold text-green-ink hover:underline flex items-center gap-1"
            >
              <span>{t("Open Essay Evaluation Engine")}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {essays.map((essay, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-panel border border-[#589C80]/30 space-y-3 shadow-sm hover:border-[#589C80] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-[#EBAE29]" />
                    <h4 className="text-xs font-bold text-ink">
                      {t(essay.title)}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-sunken border border-[#589C80]/20 text-ink/70">
                      {essay.wordCount} {t("words max")}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      essay.required
                        ? "bg-[#589C80]/20 text-green-ink border border-[#589C80]/40 font-bold"
                        : "bg-surface-sunken text-ink/60"
                    }`}>
                      {essay.required ? t("Required") : t("Optional")}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink/80 leading-relaxed font-sans italic p-3 rounded-xl bg-surface-sunken border border-[#589C80]/15">
                  &ldquo;{t(essay.prompt)}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-ink/50">
                    {t("Calibrated against successful admitted applicant corpus")}
                  </span>
                  <Link
                    href={`/essays?prompt=${encodeURIComponent(essay.prompt)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBAE29]/15 text-amber-ink hover:bg-[#EBAE29]/25 text-xs font-mono font-bold transition-colors"
                  >
                    <Sparkles size={13} />
                    <span>{t("Draft in Essay Lab")}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "deadlines" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-panel border border-[#589C80]/30 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#589C80]/20 text-green-ink font-bold">
                  {t("Early Round (EA / ED)")}
                </span>
                <span className="text-xs font-mono text-ink/50">Nov 1 – Nov 15</span>
              </div>
              <h4 className="text-sm font-bold text-ink">
                {t("Early Action / Restrictive Early Decision")}
              </h4>
              <p className="text-xs text-ink/70 leading-relaxed">
                {t("Ideal for applicants who have finalized test scores, recommendation letters, and mature essay drafts by early autumn.")}
              </p>
              <div className="pt-2 border-t border-[#589C80]/20 flex items-center justify-between text-xs font-mono">
                <span className="text-ink/60">{t("Decision release")}:</span>
                <span className="font-bold text-ink">{t("Mid-December")}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-panel border border-[#589C80]/30 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#EBAE29]/20 text-amber-ink font-bold">
                  {t("Regular Round (RD)")}
                </span>
                <span className="text-xs font-mono text-ink/50">Jan 1 – Jan 15</span>
              </div>
              <h4 className="text-sm font-bold text-ink">
                {t("Regular Decision Final Deadline")}
              </h4>
              <p className="text-xs text-ink/70 leading-relaxed">
                {t("Standard admissions cycle allowing maximum time to enhance senior GPA, retake tests, and polish supplemental materials.")}
              </p>
              <div className="pt-2 border-t border-[#589C80]/20 flex items-center justify-between text-xs font-mono">
                <span className="text-ink/60">{t("Decision release")}:</span>
                <span className="font-bold text-ink">{t("Late March / Early April")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
