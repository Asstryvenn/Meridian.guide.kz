import { professors } from "@/lib/data/professors";
import { scholarships } from "@/lib/data/scholarships";
import type { FieldOfStudy, Professor, Scholarship, StudentProfile } from "@/lib/types";
import { gpaOnFourScale } from "./profile-metrics";

export interface ScholarshipMatch {
  scholarship: Scholarship;
  eligibility: number;
  met: string[];
  unmet: string[];
  unknown: string[];
}

export function matchScholarship(profile: StudentProfile, scholarship: Scholarship, shortlist: string[]): ScholarshipMatch {
  const met: string[] = [];
  const unmet: string[] = [];
  const unknown: string[] = [];

  if (scholarship.eligibleCountries === "any") met.push("Open to all nationalities");
  else if (profile.country && scholarship.eligibleCountries.includes(profile.country)) met.push(`Open to citizens of ${profile.country}`);
  else if (!profile.country) unknown.push("Nationality not provided");
  else unmet.push("Not open to your nationality");

  if (scholarship.level === "graduate") unmet.push("Graduate-level only — plan for later");
  else met.push("Available for undergraduate study");

  const gpa4 = gpaOnFourScale(profile);
  if (scholarship.minGpa4 !== null) {
    if (gpa4 === null) unknown.push("Grades not provided");
    else if (gpa4 >= scholarship.minGpa4) met.push(`Academic record meets the typical bar (≈${scholarship.minGpa4.toFixed(1)}/4)`);
    else unmet.push(`Academic record below the typical bar (≈${scholarship.minGpa4.toFixed(1)}/4)`);
  }

  if (scholarship.requiresNeed) {
    if (profile.needsAid) met.push("You indicated financial need");
    else unmet.push("Requires demonstrated financial need");
  }

  if (scholarship.universities !== "any") {
    const overlap = scholarship.universities.some((slug) => shortlist.includes(slug));
    if (overlap) met.push("Linked to a university on your list");
    else unknown.push("Requires applying to a specific university");
  }

  const hardFail = unmet.some((u) => u.startsWith("Not open") || u.startsWith("Graduate"));
  const total = met.length + unmet.length + unknown.length * 0.5;
  const raw = total ? (met.length + unknown.length * 0.25) / total : 0;
  const eligibility = hardFail ? Math.min(15, Math.round(raw * 30)) : Math.round(raw * 100);

  return { scholarship, eligibility, met, unmet, unknown };
}

export function matchScholarships(profile: StudentProfile, shortlist: string[]): ScholarshipMatch[] {
  return scholarships.map((s) => matchScholarship(profile, s, shortlist)).sort((a, b) => b.eligibility - a.eligibility);
}

const fieldAreas: Record<FieldOfStudy, string[]> = {
  "Computer Science": ["machine learning", "computer vision", "natural language processing", "robotics", "optimization"],
  "Artificial Intelligence": ["machine learning", "computer vision", "natural language processing", "reinforcement learning", "human-centered ai"],
  "Data Science": ["machine learning", "probabilistic modelling", "optimization"],
  "Electrical Engineering": ["robotics", "autonomous systems", "perception"],
  "Mechanical Engineering": ["robotics", "autonomous driving"],
  Business: ["ai education"],
  Economics: ["optimization"],
  Medicine: ["ai for medicine", "drug discovery"],
  Biology: ["ai for medicine", "drug discovery", "cognitive neuroscience"],
  Physics: ["3d vision", "optimization"],
  Mathematics: ["optimization", "probabilistic modelling"],
  Design: ["human-centered ai", "mixed reality", "graphics"],
};

export interface ProfessorMatch {
  professor: Professor;
  fit: number;
  matchedAreas: string[];
}

export function interestAreas(profile: StudentProfile): string[] {
  const fromFields = profile.fields.flatMap((f) => fieldAreas[f]);
  const text = `${profile.interestsNote} ${profile.careerGoal} ${profile.activities.map((a) => `${a.title} ${a.impact}`).join(" ")}`.toLowerCase();
  const fromText = professors.flatMap((p) => p.areas).filter((area) => text.includes(area) || (area === "computer vision" && /\bvision|image/.test(text)) || (area === "natural language processing" && /\bnlp|language model|llm/.test(text)));
  return Array.from(new Set([...fromText, ...fromFields]));
}

export function matchProfessors(profile: StudentProfile, query: string, pool: Professor[] = professors): ProfessorMatch[] {
  const interests = interestAreas(profile);
  const q = query.trim().toLowerCase();
  return pool
    .filter((p) => !q || p.areas.some((a) => a.includes(q)) || p.name.toLowerCase().includes(q) || p.department.toLowerCase().includes(q))
    .map((professor) => {
      const matchedAreas = professor.areas.filter((a) => interests.includes(a) || (q && a.includes(q)));
      const fit = Math.round(Math.min(1, matchedAreas.length / Math.min(2, professor.areas.length)) * 100);
      return { professor, fit, matchedAreas };
    })
    .sort((a, b) => b.fit - a.fit || a.professor.name.localeCompare(b.professor.name));
}
