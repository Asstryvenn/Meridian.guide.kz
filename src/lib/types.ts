export type Confidence = "high" | "medium" | "low";

export type VerificationStatus = "reported" | "needs_verification" | "unavailable";

export interface SourceRef {
  source_name: string;
  source_url: string;
  last_verified: string | null;
  confidence: Confidence;
}

export interface Sourced<T> extends SourceRef {
  value: T | null;
  status: VerificationStatus;
  note?: string;
}

export type GradingSystem = "gpa4" | "percent" | "ib" | "alevel" | "five_point";

export type FieldOfStudy =
  | "Computer Science"
  | "Artificial Intelligence"
  | "Data Science"
  | "Electrical Engineering"
  | "Mechanical Engineering"
  | "Business"
  | "Economics"
  | "Medicine"
  | "Biology"
  | "Physics"
  | "Mathematics"
  | "Design";

export type ActivityCategory =
  | "Competition"
  | "Olympiad"
  | "Research"
  | "Project"
  | "Startup"
  | "Leadership"
  | "Volunteering"
  | "Internship"
  | "Sports"
  | "Club"
  | "Award";

export type ActivityLevel = "school" | "city" | "national" | "international";

export interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  role: string;
  level: ActivityLevel;
  impact: string;
  evidence: string;
  link: string;
  hoursPerWeek: number;
}

export type ArchetypeId = "innovator" | "researcher" | "community_builder" | "strategist" | "creative_visionary";

export interface StudentProfile {
  fullName: string;
  country: string;
  school: string;
  grade: number;
  graduationYear: number;
  age: number;
  gradingSystem: GradingSystem;
  gpa: number | null;
  sat: number | null;
  act: number | null;
  ib: number | null;
  aLevels: string;
  apCourses: string;
  ielts: number | null;
  toefl: number | null;
  duolingo: number | null;
  fields: FieldOfStudy[];
  interestsNote: string;
  activities: Activity[];
  annualBudgetUsd: number;
  tuitionRange: [number, number];
  needsAid: boolean;
  scholarshipRequired: boolean;
  preferredCountries: string[];
  preferredRegions: string[];
  campusType: "urban" | "suburban" | "rural" | "any";
  institutionType: "public" | "private" | "any";
  size: "small" | "medium" | "large" | "any";
  careerGoal: string;
  gradSchool: "phd" | "masters" | "undecided" | "none";
  archetype?: ArchetypeId;
  attendanceRate?: number | null;
  essayScore?: number | null;
  recommendationScore?: number | null;
  interviewScore?: number | null;
  onlineCertifications?: number | null;
  socialMediaHours?: number | null;
  pomodoroMinutes?: number;
  careerAssessment?: CareerAssessmentResult;
}

export type Tier = "Dream" | "Target" | "Safety";

export interface Deadline {
  label: string;
  month: number;
  day: number;
  status: VerificationStatus;
  confidence: Confidence;
}

export interface Program {
  name: string;
  field: FieldOfStudy;
  degree: "BSc" | "BA" | "BEng" | "MEng" | "MD pathway";
  selectiveNote?: string;
}

export interface University {
  slug: string;
  name: string;
  shortName: string;
  country: string;
  region: string;
  city: string;
  type: "public" | "private";
  campus: "urban" | "suburban" | "rural";
  size: "small" | "medium" | "large";
  summary: string;
  programs: Program[];
  popularMajors?: string[];
  ranking?: {
    global?: number;
    national?: number;
    source?: string;
  };
  globalRanking?: number;
  nationalRanking?: number;
  acceptanceRate: Sourced<number>;
  selectivityTier: 1 | 2 | 3 | 4 | 5;
  intlTuitionUsd: Sourced<[number, number]>;
  livingCostUsd: Sourced<number>;
  needBasedAidIntl: Sourced<"full_need" | "limited" | "none">;
  requirements: {
    tests: string[];
    minIelts: Sourced<number>;
    minToefl: Sourced<number>;
    typicalSat: Sourced<number>;
    typicalIb: Sourced<number>;
  };
  deadlines: Deadline[];
  deadlineSource: SourceRef;
  researchStrength: number;
  campusLife: string;
  careerOutcomes: Sourced<string>;
  scholarshipIds: string[];
  housing_cost?: number;
  insurance_cost?: number;
  visa_fees?: number;
  food_estimate?: number;
  flight_estimate?: number;
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  kind: "university" | "government" | "private";
  basis: "merit" | "need" | "merit_and_need";
  level: "undergraduate" | "graduate" | "both";
  coverage: string;
  amountUsd: Sourced<number>;
  eligibleCountries: string[] | "any";
  universities: string[] | "any";
  fields: string[] | "any";
  minGpa4: number | null;
  requiresNeed: boolean;
  deadline: Deadline | null;
  source: SourceRef;
  notes: string;
}

export interface Professor {
  id: string;
  name: string;
  universitySlug: string;
  department: string;
  areas: string[];
  profile: SourceRef;
  publicationsNote: string;
}

export interface AuthUser {
  id: string;
  email: string;
  provider: "email" | "google";
  mode: "supabase" | "local";
}

export type TaskKind = "exam" | "document" | "essay" | "deadline" | "academic" | "activity" | "scholarship";

export interface RoadmapTask {
  id: string;
  title: string;
  detail: string;
  kind: TaskKind;
  level: number;
  xp: number;
  dueDate: string | null;
  universitySlug?: string;
  done: boolean;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  done: boolean;
}

export interface Application {
  universitySlug: string;
  status: "researching" | "preparing" | "submitted" | "decision";
  documents: ApplicationDocument[];
  essays: ApplicationDocument[];
  scholarshipIds: string[];
  notes: string;
  addedAt: string;
}

export type DocumentCategory =
  | "family_income"
  | "tax"
  | "insurance"
  | "bank_statement"
  | "passport";

export type DocumentStatus = "verified" | "missing" | "needs_translation";

export interface VaultDocument {
  id: string;
  category: DocumentCategory;
  name: string;
  fileName?: string;
  fileSize?: string;
  status: DocumentStatus;
  uploadedAt?: string;
  notes?: string;
}

export interface InterviewQuestion {
  id: string;
  university: string;
  category: "academic" | "leadership" | "personal" | "situational";
  question: string;
  tips: string[];
}

export interface InterviewFeedback {
  overallScore: number;
  cadenceScore: number;
  clarityScore: number;
  poiseScore: number;
  contentScore: number;
  strengths: string[];
  improvements: string[];
  qualitativeSummary: string;
}

export interface RecommendedActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  field: FieldOfStudy;
  role: string;
  description: string;
  impactPotential: "High" | "Very High" | "Elite";
  level: ActivityLevel;
  estimatedHoursPerWeek: number;
  xpReward: number;
  roadmapTaskTitle: string;
}

export type Locale = "en" | "kk" | "ru";

export interface CareerPathMatch {
  id: string;
  title: string;
  matchPercent: number;
  matchScore?: number;
  description: string;
  foundationalSkills: string[];
  recommendedMajors: string[];
}

export interface CareerAssessmentResult {
  completedAt: string;
  topMatches: CareerPathMatch[];
  dominantStrengths: string[];
  workStyle: string;
}

export interface SentenceImprovement {
  original: string;
  suggested: string;
  reason: string;
  category: "clarity" | "impact" | "tone" | "conciseness";
}

export interface StructuralSectionFeedback {
  sectionTitle: string;
  status: "strong" | "needs_work" | "excellent";
  analysis: string;
  recommendation: string;
}

export interface EssayCorpusMetrics {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  avgWordLength: number;
  lexicalRichness: number;
  corpusPercentile: number;
}

export interface EssayEvaluationResult {
  id: string;
  evaluatedAt: string;
  overallScore: number;
  percentile: number;
  scores: {
    contentDepth: number;
    storyArc: number;
    clarityTone: number;
    competitiveness: number;
  };
  metrics: EssayCorpusMetrics;
  structuralCritique: StructuralSectionFeedback[];
  sentenceImprovements: SentenceImprovement[];
  strengths: string[];
  weaknesses: string[];
  admissionsVerdict: string;
}

export interface HybridSentenceImprovement {
  original: string;
  issue: string;
  suggested: string;
}

export interface HybridMlMetrics {
  admission_probability: number;
  structural_coherence: number;
  lexical_density: number;
  word_count: number;
  sentence_count: number;
  avg_sentence_length: number;
  avg_word_length: number;
  ml_baseline_score: number;
}

export interface HybridEssayEvaluationResult {
  id: string;
  evaluatedAt: string;
  final_score: number;
  ml_confidence_match: number;
  narrative_evaluation: string;
  strengths: string[];
  weaknesses: string[];
  sentence_improvements: HybridSentenceImprovement[];
  ml_metrics: HybridMlMetrics;
  source: "openai" | "gemini" | "ml_calibrated";
}
