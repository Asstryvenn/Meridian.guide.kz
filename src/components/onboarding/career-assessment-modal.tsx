"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Sparkles,
  Check,
  ChevronLeft,
  Briefcase,
  GraduationCap,
  X,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import type { CareerAssessmentResult, CareerPathMatch } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";

interface CareerAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: CareerAssessmentResult) => void;
}

interface QuestionOption {
  id: string;
  label: string;
  detail: string;
  weights: Record<string, number>;
}

interface AssessmentQuestion {
  id: string;
  dimension: string;
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

const CAREER_DEFINITIONS: Record<string, { title: string; description: string; foundationalSkills: string[]; recommendedMajors: string[] }> = {
  ai_architect: {
    title: "AI & Autonomous Systems Architect",
    description: "Designs frontier neural architectures, foundation models, and scalable autonomous pipelines solving high-complexity automation challenges.",
    foundationalSkills: ["Linear Algebra & Tensor Calculus", "Python / PyTorch & CUDA", "Distributed Systems Architecture"],
    recommendedMajors: ["Computer Science", "Artificial Intelligence", "Applied Mathematics"],
  },
  biomedical_innovator: {
    title: "Biomedical Scientist & Physician-Innovator",
    description: "Translates molecular biology discoveries and cellular engineering into breakthrough therapeutic treatments and next-gen clinical technologies.",
    foundationalSkills: ["Molecular Genetics", "Organic Chemistry", "Bioinformatics & Data Science"],
    recommendedMajors: ["Biomedical Engineering", "Molecular Biology", "Pre-Med / Neuroscience"],
  },
  quant_strategist: {
    title: "Quantitative Finance & Algorithmic Strategist",
    description: "Applies stochastic calculus, statistical arbitrage, and algorithmic models to global liquidity and financial risk systems.",
    foundationalSkills: ["Stochastic Calculus & Probability", "C++ / Python Quantitative Libraries", "Econometric Modeling"],
    recommendedMajors: ["Financial Engineering", "Statistics", "Economics & Mathematics"],
  },
  cleantech_engineer: {
    title: "CleanTech & Energy Infrastructure Engineer",
    description: "Engineers grid-scale battery chemistry, renewable generation systems, and sustainable carbon capture infrastructure.",
    foundationalSkills: ["Thermodynamics & Fluid Mechanics", "Materials Science", "Energy Systems Simulation"],
    recommendedMajors: ["Environmental Engineering", "Materials Science", "Mechanical Engineering"],
  },
  product_designer: {
    title: "Product Design & Human-Computer Interaction Lead",
    description: "Shapes the tactile and cognitive interface between human minds and frontier computational software.",
    foundationalSkills: ["Interaction Design & Usability Testing", "Front-end Architecture & Design Systems", "Cognitive Ergonomics"],
    recommendedMajors: ["Human-Computer Interaction", "Cognitive Science", "Industrial Design"],
  },
  policy_advocate: {
    title: "International Policy & Human Rights Strategist",
    description: "Drafts multilateral treaties, analyzes geopolitical risk, and coordinates international governance on emerging global crises.",
    foundationalSkills: ["International Law & Jurisprudence", "Qualitative Policy Analysis", "Diplomatic Negotiation & Rhetoric"],
    recommendedMajors: ["International Relations", "Political Science", "Philosophy, Politics and Economics"],
  },
  venture_founder: {
    title: "DeepTech Venture Founder & Entrepreneur",
    description: "Commercializes breakthrough intellectual property, recruits world-class teams, and scales transformative companies.",
    foundationalSkills: ["Product-Market Fit Discovery", "Unit Economics & Financial Modeling", "Executive Storytelling & Pitching"],
    recommendedMajors: ["Management Science & Engineering", "Business & Technology", "Computer Science"],
  },
  cognitive_neuroscientist: {
    title: "Computational Neuroscientist & Cognitive Modeler",
    description: "Decodes neural circuits, brain-computer interfaces, and cognitive architectures to understand biological intelligence.",
    foundationalSkills: ["Electrophysiology & Signal Processing", "Neural Network Dynamics", "Cognitive Psychology"],
    recommendedMajors: ["Neuroscience", "Cognitive Computing", "Biophysics"],
  },
};

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "strengths",
    dimension: "Core Intellectual Strengths",
    title: "What intellectual domain feels most natural and energizing to you?",
    subtitle: "Choose the mode of reasoning you gravitate toward when tackling unsolved challenges.",
    options: [
      { id: "s1", label: "Quantitative Modeling & Algorithmic Rigor", detail: "Translating messy phenomena into elegant mathematical formulas and code.", weights: { ai_architect: 3, quant_strategist: 4, cleantech_engineer: 2 } },
      { id: "s2", label: "Biological Systems & Empirical Discovery", detail: "Investigating living organisms, chemical pathways, and molecular mechanics.", weights: { biomedical_innovator: 4, cognitive_neuroscientist: 3 } },
      { id: "s3", label: "Human Psychology & Narrative Influence", detail: "Deciphering motives, crafting persuasive stories, and navigating social systems.", weights: { policy_advocate: 4, product_designer: 2, venture_founder: 2 } },
      { id: "s4", label: "Physical Engineering & Tangible Systems", detail: "Constructing physical hardware, energy systems, and concrete structures.", weights: { cleantech_engineer: 4, venture_founder: 2 } },
      { id: "s5", label: "Commercial Vision & Strategic Synthesis", detail: "Identifying market opportunities, orchestrating resources, and driving execution.", weights: { venture_founder: 4, quant_strategist: 2, policy_advocate: 2 } },
    ],
  },
  {
    id: "workStyle",
    dimension: "Work Style & Environment",
    title: "In which daily environment do you operate at peak focus?",
    subtitle: "Your ideal setting determines which careers maintain your engagement long-term.",
    options: [
      { id: "w1", label: "Deep Autonomous Focus", detail: "Uninterrupted hours dissecting complex code, data, or scientific theory.", weights: { ai_architect: 3, quant_strategist: 3, cognitive_neuroscientist: 3 } },
      { id: "w2", label: "Empirical Wet / Hardware Laboratory", detail: "Hands-on bench experimentation with advanced instrumentation and data assays.", weights: { biomedical_innovator: 4, cleantech_engineer: 3 } },
      { id: "w3", label: "High-Velocity Cross-Functional Squad", detail: "Daily rapid prototyping with designers, engineers, and product leaders.", weights: { product_designer: 4, venture_founder: 3, ai_architect: 2 } },
      { id: "w4", label: "Global Field Operations & Public Forums", detail: "Meeting international delegations, running field programs, and public advocacy.", weights: { policy_advocate: 4, venture_founder: 2 } },
    ],
  },
  {
    id: "inclination",
    dimension: "Technical vs. Creative Balance",
    title: "How do you prefer to balance technical rigor and creative expression?",
    subtitle: "Top universities reward applicants with distinct dimensional spikes.",
    options: [
      { id: "i1", label: "Strictly Quantitative & Systematic (90/10)", detail: "Logic, proofs, deterministic algorithms, and statistical validity above all.", weights: { quant_strategist: 4, ai_architect: 3 } },
      { id: "i2", label: "Technical Foundation with Aesthetic Vision (60/40)", detail: "Leveraging computation to construct intuitive, beautiful experiences.", weights: { product_designer: 4, ai_architect: 2, venture_founder: 2 } },
      { id: "i3", label: "Multidisciplinary Bridge (50/50)", detail: "Synthesizing science, ethics, policy, and human behavior equally.", weights: { cognitive_neuroscientist: 4, policy_advocate: 3, biomedical_innovator: 2 } },
      { id: "i4", label: "Narrative, Rhetoric & Institutional Strategy (20/80)", detail: "Persuasion, qualitative synthesis, diplomatic statecraft, and communication.", weights: { policy_advocate: 4, venture_founder: 2 } },
    ],
  },
  {
    id: "problemSolving",
    dimension: "Problem-Solving Preferences",
    title: "When facing an ambiguous problem, what is your initial instinct?",
    subtitle: "Your problem-solving instinct reveals your vocational methodology.",
    options: [
      { id: "p1", label: "Deconstruct to First Principles", detail: "Break the challenge into fundamental physical or mathematical axioms.", weights: { ai_architect: 4, cleantech_engineer: 3, quant_strategist: 3 } },
      { id: "p2", label: "Formulate and Test Falsifiable Hypotheses", detail: "Design controlled experiments, gather empirical data, and isolate variables.", weights: { biomedical_innovator: 4, cognitive_neuroscientist: 4 } },
      { id: "p3", label: "Prototype Rapid User Feedback Loops", detail: "Build a minimum testable model and observe human interaction directly.", weights: { product_designer: 4, venture_founder: 3 } },
      { id: "p4", label: "Diagnose Systemic & Institutional Incentives", detail: "Examine governance structures, legal frameworks, and socioeconomic drivers.", weights: { policy_advocate: 4, quant_strategist: 2 } },
    ],
  },
  {
    id: "targetIndustries",
    dimension: "Target Industry Horizons",
    title: "Which global frontier challenges matter most to you?",
    subtitle: "The sectors where you envision dedicating your collegiate research and career.",
    options: [
      { id: "ind1", label: "Artificial General Intelligence & Robotics", detail: "Autonomous cognition, neural simulation, and foundational intelligence systems.", weights: { ai_architect: 4, cognitive_neuroscientist: 3, venture_founder: 2 } },
      { id: "ind2", label: "Longevity, Genetic Engineering & Therapeutics", detail: "CRISPR gene therapies, mRNA therapeutics, and computational biology.", weights: { biomedical_innovator: 4, cognitive_neuroscientist: 2 } },
      { id: "ind3", label: "Planetary Decarbonization & Clean Grid Energy", detail: "Solid-state batteries, fusion systems, and carbon sequestration networks.", weights: { cleantech_engineer: 4, venture_founder: 2 } },
      { id: "ind4", label: "Global Quantitative Markets & Decentralized Trust", detail: "Algorithmic high-frequency liquidity, risk modeling, and crypto economics.", weights: { quant_strategist: 4, venture_founder: 2 } },
      { id: "ind5", label: "Human Rights, Geopolitics & Ethical Governance", detail: "International treaty law, AI governance, and global educational equity.", weights: { policy_advocate: 4 } },
    ],
  },
  {
    id: "mission",
    dimension: "Long-Term Impact Vision",
    title: "What milestone would feel like the highest achievement of your twenties?",
    subtitle: "Your aspiration shapes your undergraduate course mapping and university shortlist.",
    options: [
      { id: "m1", label: "Publishing a Breakthrough Scientific Discovery", detail: "Advancing peer-reviewed human knowledge in a premier journal like Nature or Cell.", weights: { biomedical_innovator: 4, cognitive_neuroscientist: 4, ai_architect: 2 } },
      { id: "m2", label: "Founding and Scaling an Enduring Enterprise", detail: "Building a company that employs hundreds and solves a pressing societal need.", weights: { venture_founder: 4, product_designer: 2, cleantech_engineer: 2 } },
      { id: "m3", label: "Deploying Code or Hardware Used by Millions Daily", detail: "Engineering mission-critical infrastructure that powers everyday modern life.", weights: { ai_architect: 4, product_designer: 3, cleantech_engineer: 2 } },
      { id: "m4", label: "Drafting Landmark Policy or Human Rights Legislation", detail: "Reforming systemic inequalities through legal and institutional transformation.", weights: { policy_advocate: 4 } },
    ],
  },
];

export function CareerAssessmentModal({ isOpen, onClose, onComplete }: CareerAssessmentModalProps) {
  const t = useT();
  const { saveCareerAssessment } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<CareerPathMatch[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("scroll-locked");
    return () => {
      document.body.classList.remove("scroll-locked");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const question = ASSESSMENT_QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / ASSESSMENT_QUESTIONS.length) * 100);

  const handleSelectOption = (optionId: string) => {
    const updated = { ...selectedAnswers, [question.id]: optionId };
    setSelectedAnswers(updated);

    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      computeResults(updated);
    }
  };

  const computeResults = (answers: Record<string, string>) => {
    const scores: Record<string, number> = {
      ai_architect: 0,
      biomedical_innovator: 0,
      quant_strategist: 0,
      cleantech_engineer: 0,
      product_designer: 0,
      policy_advocate: 0,
      venture_founder: 0,
      cognitive_neuroscientist: 0,
    };

    ASSESSMENT_QUESTIONS.forEach((q) => {
      const chosenOptionId = answers[q.id];
      const opt = q.options.find((o) => o.id === chosenOptionId);
      if (opt) {
        Object.entries(opt.weights).forEach(([careerKey, weight]) => {
          scores[careerKey] = (scores[careerKey] || 0) + weight;
        });
      }
    });

    const maxScore = Math.max(...Object.values(scores), 1);
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, score]) => {
        const def = CAREER_DEFINITIONS[key];
        const matchPercent = Math.min(98, Math.max(72, Math.round((score / maxScore) * 96)));
        return {
          id: key,
          title: def.title,
          matchPercent,
          matchScore: matchPercent,
          description: def.description,
          foundationalSkills: def.foundationalSkills,
          recommendedMajors: def.recommendedMajors,
        };
      });

    setResults(sorted);

    const assessmentResult: CareerAssessmentResult = {
      completedAt: new Date().toISOString(),
      topMatches: sorted,
      dominantStrengths: [sorted[0]?.title || "Analytical"],
      workStyle: answers["workStyle"] || "Deep Focus",
    };

    saveCareerAssessment(assessmentResult);

    if (onComplete) {
      onComplete(assessmentResult);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentStep(0);
    setResults(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto overscroll-contain scroll-touch">
      <div className="relative w-full max-w-2xl mx-auto max-h-[88vh] overflow-y-auto overscroll-contain scroll-touch p-5 sm:p-7 rounded-3xl bg-panel/95 border border-[#589C80]/30 shadow-2xl backdrop-blur-xl text-ink">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full border border-[#589C80]/30 text-ink/70 hover:text-ink hover:border-[#EBAE29] transition-all cursor-pointer"
          aria-label={t("Close")}
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 transform-gpu"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-amber-ink">
                  <span className="flex items-center gap-1.5">
                    <Compass size={13} className="text-[#589C80]" />
                    <span>{question.dimension}</span>
                  </span>
                  <span>{currentStep + 1} / {ASSESSMENT_QUESTIONS.length}</span>
                </div>
                <div className="w-full h-1.5 bg-panel rounded-full overflow-hidden border border-[#589C80]/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#589C80] to-[#EBAE29] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-ink leading-snug">
                  {question.title}
                </h3>
                <p className="text-xs sm:text-sm text-ink/70">
                  {question.subtitle}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {question.options.map((option) => {
                  const isSelected = selectedAnswers[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(option.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-[#589C80]/20 border-[#EBAE29] shadow-md shadow-[#EBAE29]/10"
                          : "bg-panel/60 border-[#589C80]/25 hover:border-[#589C80]/60 hover:bg-[#589C80]/10"
                      }`}
                    >
                      <div className="font-semibold text-ink text-sm sm:text-base mb-1 flex items-center justify-between">
                        <span>{option.label}</span>
                        {isSelected && <Check size={16} className="text-[#EBAE29]" />}
                      </div>
                      <div className="text-xs text-ink/70 leading-relaxed">
                        {option.detail}
                      </div>
                    </button>
                  );
                })}
              </div>

              {currentStep > 0 && (
                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="flex items-center gap-1.5 text-xs text-green-ink hover:text-amber-ink transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>{t("Back to previous question")}</span>
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 pt-2"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#589C80]/20 border border-[#589C80]/40 text-green-ink font-mono text-xs uppercase tracking-wider">
                  <Sparkles size={12} className="text-amber-ink" />
                  <span>{t("Career Guidance Assessment")}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
                  {t("Your Top Future Career Trajectories")}
                </h2>
                <p className="text-xs sm:text-sm text-ink/70 max-w-lg mx-auto">
                  {t("Based on your cognitive strengths, technical balance, and target horizons, our algorithm identified your highest-fit career pathways.")}
                </p>
              </div>

              <div className="space-y-4">
                {results.map((career, index) => (
                  <div
                    key={career.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      index === 0
                        ? "bg-[#589C80]/15 border-[#EBAE29] shadow-lg shadow-[#EBAE29]/5"
                        : "bg-panel/70 border-[#589C80]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                          index === 0 ? "bg-[#EBAE29] text-on-accent" : "bg-[#589C80]/30 text-green-ink"
                        }`}>
                          {index + 1}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-ink">
                          {career.title}
                        </h4>
                      </div>
                      <span className="text-xs sm:text-sm font-mono font-extrabold text-amber-ink px-2.5 py-1 rounded-lg bg-panel border border-[#EBAE29]/40">
                        {career.matchPercent}% {t("Match")}
                      </span>
                    </div>

                    <p className="text-xs text-ink/80 leading-relaxed mb-3">
                      {career.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-panel border border-[#589C80]/20 space-y-1">
                        <span className="font-mono text-[10px] text-amber-ink uppercase tracking-wider flex items-center gap-1">
                          <Briefcase size={11} /> {t("Foundational Skills")}
                        </span>
                        <p className="text-ink/90 font-medium">
                          {career.foundationalSkills.join(" · ")}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-panel border border-[#589C80]/20 space-y-1">
                        <span className="font-mono text-[10px] text-green-ink uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap size={11} /> {t("Target Undergraduate Majors")}
                        </span>
                        <p className="text-ink/90 font-medium">
                          {career.recommendedMajors.join(" · ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#589C80]/40 text-xs text-ink hover:border-[#EBAE29] transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{t("Retake Assessment")}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-xs font-bold text-on-accent shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  <span>{t("Save & Apply to Roadmap")}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
