"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getScholarship } from "@/lib/data/scholarships";
import { getUniversity } from "@/lib/data/universities";
import { onAuthChange, currentSupabaseUser, signOutEverywhere } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadRemoteState, persistTask, saveRemoteState } from "@/lib/supabase/sync";
import type {
  ActivityCategory,
  Advertisement,
  Application,
  ArchetypeId,
  AuthUser,
  CareerAssessmentResult,
  ExpTransaction,
  RedeemedReward,
  RewardItem,
  RoadmapTask,
  StudentProfile,
  TotemMascotId,
  VaultDocument,
} from "@/lib/types";
import { defaultAdvertisements, defaultRewards, defaultVaultDocuments, emptyProfile, newApplication } from "./defaults";

const STORAGE_KEY = "meridian:v1";
const SAVE_DELAY_MS = 900;

export type MascotState = "idle" | "celebrating" | "streak_fire" | "warning_alert";

interface AppState {
  user: AuthUser | null;
  profile: StudentProfile;
  onboarded: boolean;
  applications: Application[];
  completedTasks: string[];
  dismissedNotifications: string[];
  compare: string[];
  ecoMode: boolean;
  pomodoroFocusMinutes: number;
  documents: VaultDocument[];
  customRoadmapTasks: RoadmapTask[];
  redeemedRewards: RedeemedReward[];
  expTransactions: ExpTransaction[];
  advertisements: Advertisement[];
  mascotState: MascotState;
}

export type SyncStatus = "idle" | "saving" | "saved" | "error";

interface AppActions {
  hydrated: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  currentStreak: number;
  totalExp: number;
  chosenTotem: TotemMascotId;
  isBusinessAccount: boolean;
  mascotState: MascotState;
  redeemedRewards: RedeemedReward[];
  expTransactions: ExpTransaction[];
  advertisements: Advertisement[];
  signIn: (user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  flush: () => Promise<string | null>;
  updateProfile: (patch: Partial<StudentProfile>) => void;
  replaceProfile: (profile: StudentProfile) => void;
  completeOnboarding: () => Promise<string | null>;
  addApplication: (slug: string) => void;
  removeApplication: (slug: string) => void;
  updateApplication: (slug: string, patch: Partial<Application>) => void;
  setTaskDone: (id: string, done: boolean) => void;
  toggleTask: (id: string) => void;
  markTask: (id: string) => void;
  dismissNotification: (id: string) => void;
  toggleCompare: (slug: string) => void;
  setCompare: (slugs: string[]) => void;
  toggleEcoMode: () => void;
  setEcoMode: (active: boolean) => void;
  addFocusTime: (minutes: number) => void;
  setArchetype: (archetype: ArchetypeId) => void;
  addVaultDocument: (doc: VaultDocument) => void;
  updateVaultDocument: (id: string, patch: Partial<VaultDocument>) => void;
  removeVaultDocument: (id: string) => void;
  addCustomRoadmapTask: (task: RoadmapTask) => void;
  addAchievementBoost: (title: string, category: ActivityCategory, boostPercent: number) => void;
  saveCareerAssessment: (result: CareerAssessmentResult) => void;
  addExp: (amount: number, reason: string) => void;
  deductExp: (amount: number, reason: string) => void;
  applyDeadlinePenalty: (taskTitle: string) => void;
  purchaseReward: (reward: RewardItem) => { success: boolean; code?: string; error?: string };
  setChosenTotem: (totem: TotemMascotId) => void;
  setMascotState: (state: MascotState) => void;
  toggleBusinessAccount: () => void;
  createAdvertisement: (ad: Omit<Advertisement, "id" | "impressions" | "clicks">) => void;
  toggleAdvertisementActive: (id: string) => void;
}

const initialState: AppState = {
  user: null,
  profile: emptyProfile,
  onboarded: false,
  applications: [],
  completedTasks: [],
  dismissedNotifications: [],
  compare: [],
  ecoMode: false,
  pomodoroFocusMinutes: 0,
  documents: defaultVaultDocuments,
  customRoadmapTasks: [],
  redeemedRewards: [],
  expTransactions: [],
  advertisements: defaultAdvertisements,
  mascotState: "idle",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizeProfile(value: unknown): StudentProfile {
  const profile = isRecord(value) ? value : {};
  const tuitionRange = asArray<number>(profile.tuitionRange).filter(
    (amount) => typeof amount === "number" && Number.isFinite(amount)
  );
  const careerAssessment = isRecord(profile.careerAssessment)
    ? {
        ...profile.careerAssessment,
        topMatches: asArray(profile.careerAssessment.topMatches).filter(isRecord).map((match) => ({
          ...match,
          foundationalSkills: asArray<string>(match.foundationalSkills),
          recommendedMajors: asArray<string>(match.recommendedMajors),
        })),
        dominantStrengths: asArray<string>(profile.careerAssessment.dominantStrengths),
      }
    : undefined;

  return {
    ...emptyProfile,
    ...profile,
    fields: asArray(profile.fields).filter((field): field is StudentProfile["fields"][number] => typeof field === "string"),
    activities: asArray(profile.activities).filter(isRecord) as unknown as StudentProfile["activities"],
    preferredCountries: asArray(profile.preferredCountries).filter((country): country is string => typeof country === "string"),
    preferredRegions: asArray(profile.preferredRegions).filter((region): region is string => typeof region === "string"),
    tuitionRange: tuitionRange.length === 2 ? [tuitionRange[0], tuitionRange[1]] : emptyProfile.tuitionRange,
    careerAssessment: careerAssessment as StudentProfile["careerAssessment"],
    currentStreak: typeof profile.currentStreak === "number" ? profile.currentStreak : emptyProfile.currentStreak,
    totalExp: typeof profile.totalExp === "number" ? profile.totalExp : emptyProfile.totalExp,
    chosenTotem: (profile.chosenTotem as TotemMascotId) || emptyProfile.chosenTotem,
    lastActiveDate: (profile.lastActiveDate as string) || emptyProfile.lastActiveDate,
    isBusinessAccount: profile.isBusinessAccount === true,
  };
}

function normalizeApplication(value: unknown): Application | null {
  if (!isRecord(value) || typeof value.universitySlug !== "string") return null;

  const status =
    value.status === "preparing" || value.status === "submitted" || value.status === "decision"
      ? value.status
      : "researching";
  const normalizeItems = (items: unknown): Application["documents"] =>
    asArray(items)
      .filter(isRecord)
      .filter((item) => typeof item.id === "string" && typeof item.name === "string")
      .map((item) => ({ id: item.id as string, name: item.name as string, done: item.done === true }));

  return {
    universitySlug: value.universitySlug,
    status,
    documents: normalizeItems(value.documents),
    essays: normalizeItems(value.essays),
    scholarshipIds: asArray(value.scholarshipIds).filter((id): id is string => typeof id === "string"),
    notes: typeof value.notes === "string" ? value.notes : "",
    addedAt: typeof value.addedAt === "string" ? value.addedAt : new Date().toISOString(),
  };
}

function normalizeState(value: unknown): AppState {
  const state = isRecord(value) ? value : {};

  return {
    ...initialState,
    ...state,
    profile: normalizeProfile(state.profile),
    applications: asArray(state.applications)
      .map(normalizeApplication)
      .filter((application): application is Application => application !== null),
    completedTasks: asArray<string>(state.completedTasks),
    dismissedNotifications: asArray<string>(state.dismissedNotifications),
    compare: asArray<string>(state.compare),
    documents: asArray<VaultDocument>(state.documents, defaultVaultDocuments),
    customRoadmapTasks: asArray<RoadmapTask>(state.customRoadmapTasks),
    ecoMode: state.ecoMode === true,
    pomodoroFocusMinutes: typeof state.pomodoroFocusMinutes === "number" ? state.pomodoroFocusMinutes : 0,
    redeemedRewards: asArray<RedeemedReward>(state.redeemedRewards),
    expTransactions: asArray<ExpTransaction>(state.expTransactions),
    advertisements: asArray<Advertisement>(state.advertisements, defaultAdvertisements),
    mascotState: "idle",
  };
}

const AppContext = createContext<(AppState & AppActions) | null>(null);

function readLocal(): AppState {
  if (typeof window === "undefined" || !window.localStorage) return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return normalizeState(JSON.parse(raw));
  } catch {
    return initialState;
  }
}

function writeLocal(state: AppState) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

async function resolveSession(local: AppState): Promise<AppState> {
  try {
    const remoteUser = await currentSupabaseUser().catch(() => null);
    if (!remoteUser) {
      const staleSession = local.user?.mode === "supabase" || (local.user?.mode === "local" && isSupabaseConfigured());
      return staleSession ? { ...local, user: null } : local;
    }
    const remote = await loadRemoteState(remoteUser.id).catch(() => null);
    if (remote) return normalizeState({ ...local, ...remote, user: remoteUser });
    const sameUser = local.user?.id === remoteUser.id;
    return sameUser || local.user === null ? normalizeState({ ...local, user: remoteUser }) : { ...initialState, user: remoteUser };
  } catch {
    return local;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueue = useRef<Promise<string | null>>(Promise.resolve(null));

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveNow = useCallback((override?: AppState): Promise<string | null> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const snapshot = override ?? stateRef.current;
    if (snapshot.user?.mode !== "supabase") return Promise.resolve(null);
    const userId = snapshot.user.id;
    setSyncStatus("saving");
    saveQueue.current = saveQueue.current
      .catch(() => null)
      .then(() => saveRemoteState(userId, snapshot))
      .catch((error: Error) => error.message)
      .then((error) => {
        setSyncError(error);
        setSyncStatus(error ? "error" : "saved");
        return error;
      });
    return saveQueue.current;
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const local = readLocal();
        const next = await resolveSession(local).catch(() => local);
        if (!active) return;
        const resolved = next || local || initialState;
        const today = new Date().toISOString().slice(0, 10);
        const lastActive = resolved.profile.lastActiveDate;
        let streak = resolved.profile.currentStreak || 1;
        if (lastActive && lastActive !== today) {
          const diffDays = Math.round((new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            streak += 1;
          } else if (diffDays > 1) {
            streak = 1;
          }
        }
        resolved.profile = {
          ...resolved.profile,
          currentStreak: streak,
          lastActiveDate: today,
        };
        setState(resolved);
      } catch {
        if (!active) return;
        setState(readLocal() || initialState);
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };

    bootstrap();

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthChange((event, user) => {
        if (!active) return;
        if (event === "SIGNED_OUT") setState((prev) => (prev.user?.mode === "supabase" ? { ...prev, user: null } : prev));
        if (event === "SIGNED_IN" && user) {
          setState((prev) => (prev.user?.id === user.id ? prev : { ...prev, user }));
        }
      });
    } catch {}

    return () => {
      active = false;
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeLocal(state);
    if (state.user?.mode !== "supabase") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveNow(), SAVE_DELAY_MS);
  }, [state, hydrated, saveNow]);

  const signIn = useCallback(async (user: AuthUser) => {
    const remote = user.mode === "supabase" ? await loadRemoteState(user.id).catch(() => null) : null;
    setState((prev) => {
      const base = prev.user?.id === user.id || prev.user === null ? prev : initialState;
      return remote ? { ...base, ...remote, user } : { ...base, user };
    });
  }, []);

  const signOut = useCallback(async () => {
    await saveNow();
    await signOutEverywhere();
    setState((prev) => (prev.user?.mode === "supabase" ? { ...initialState } : { ...prev, user: null }));
  }, [saveNow]);

  const updateProfile = useCallback((patch: Partial<StudentProfile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const replaceProfile = useCallback((profile: StudentProfile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const completeOnboarding = useCallback(() => {
    const next = { ...stateRef.current, onboarded: true };
    stateRef.current = next;
    setState(next);
    writeLocal(next);
    return saveNow(next);
  }, [saveNow]);

  const addApplication = useCallback((slug: string) => {
    setState((prev) => {
      if (prev.applications.some((a) => a.universitySlug === slug)) return prev;
      const university = getUniversity(slug);
      const scholarshipIds = (university?.scholarshipIds ?? []).filter((id) => getScholarship(id)?.level !== "graduate");
      return { ...prev, applications: [...prev.applications, newApplication(slug, scholarshipIds)] };
    });
  }, []);

  const removeApplication = useCallback((slug: string) => {
    setState((prev) => ({ ...prev, applications: prev.applications.filter((a) => a.universitySlug !== slug) }));
  }, []);

  const updateApplication = useCallback((slug: string, patch: Partial<Application>) => {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) => (a.universitySlug === slug ? { ...a, ...patch } : a)),
    }));
  }, []);

  const setTaskDone = useCallback((id: string, done: boolean) => {
    const user = stateRef.current.user;
    setState((prev) => {
      const has = prev.completedTasks.includes(id);
      if (has === done) return prev;
      const expDelta = done ? 100 : -100;
      const newTotalExp = Math.max(0, (prev.profile.totalExp || 0) + expDelta);
      const newTx: ExpTransaction = {
        id: `tx-${Date.now()}`,
        amount: expDelta,
        action: done ? "task_completed" : "task_reopened",
        description: done ? "Completed roadmap milestone" : "Reopened milestone",
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        completedTasks: done ? [...prev.completedTasks, id] : prev.completedTasks.filter((t) => t !== id),
        profile: {
          ...prev.profile,
          totalExp: newTotalExp,
        },
        expTransactions: [newTx, ...prev.expTransactions],
        mascotState: done ? "celebrating" : "idle",
      };
    });

    if (done) {
      setTimeout(() => {
        setState((prev) => (prev.mascotState === "celebrating" ? { ...prev, mascotState: "idle" } : prev));
      }, 4000);
    }

    if (user?.mode === "supabase") {
      persistTask(user.id, id, done).then((error) => {
        if (error) {
          setSyncError(error);
          setSyncStatus("error");
        }
      });
    }
  }, []);

  const markTask = useCallback((id: string) => setTaskDone(id, true), [setTaskDone]);

  const toggleTask = useCallback(
    (id: string) => setTaskDone(id, !stateRef.current.completedTasks.includes(id)),
    [setTaskDone]
  );

  const dismissNotification = useCallback((id: string) => {
    setState((prev) => ({ ...prev, dismissedNotifications: [...prev.dismissedNotifications, id] }));
  }, []);

  const toggleCompare = useCallback((slug: string) => {
    setState((prev) => {
      if (prev.compare.includes(slug)) return { ...prev, compare: prev.compare.filter((s) => s !== slug) };
      return { ...prev, compare: [...prev.compare, slug].slice(-3) };
    });
  }, []);

  const setCompare = useCallback((slugs: string[]) => {
    setState((prev) => ({ ...prev, compare: slugs.slice(0, 3) }));
  }, []);

  const toggleEcoMode = useCallback(() => {
    setState((prev) => ({ ...prev, ecoMode: !prev.ecoMode }));
  }, []);

  const setEcoMode = useCallback((active: boolean) => {
    setState((prev) => ({ ...prev, ecoMode: active }));
  }, []);

  const addFocusTime = useCallback((minutes: number) => {
    setState((prev) => ({
      ...prev,
      pomodoroFocusMinutes: (prev.pomodoroFocusMinutes || 0) + minutes,
      profile: {
        ...prev.profile,
        pomodoroMinutes: (prev.profile.pomodoroMinutes || 0) + minutes,
      },
    }));
  }, []);

  const setArchetype = useCallback((archetype: ArchetypeId) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, archetype },
    }));
  }, []);

  const saveCareerAssessment = useCallback((result: CareerAssessmentResult) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        careerAssessment: result,
        careerGoal: result.topMatches[0]?.title || prev.profile.careerGoal,
      },
    }));
  }, []);

  const addVaultDocument = useCallback((doc: VaultDocument) => {
    setState((prev) => ({
      ...prev,
      documents: [doc, ...prev.documents],
    }));
  }, []);

  const updateVaultDocument = useCallback((id: string, patch: Partial<VaultDocument>) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  const removeVaultDocument = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  }, []);

  const addCustomRoadmapTask = useCallback((task: RoadmapTask) => {
    setState((prev) => {
      if (prev.customRoadmapTasks.some((t) => t.id === task.id)) return prev;
      return {
        ...prev,
        customRoadmapTasks: [task, ...prev.customRoadmapTasks],
      };
    });
  }, []);

  const addAchievementBoost = useCallback((title: string, category: ActivityCategory, boostPercent: number) => {
    setState((prev) => {
      const newActivity = {
        id: `boost-${Date.now()}`,
        category,
        title,
        role: "Awardee / Contributor",
        level: "national" as const,
        impact: `Boosted admission probability by +${boostPercent}%`,
        evidence: "Verified Document",
        link: "",
        hoursPerWeek: 4,
      };
      return {
        ...prev,
        profile: {
          ...prev.profile,
          activities: [newActivity, ...prev.profile.activities],
        },
      };
    });
  }, []);

  const addExp = useCallback((amount: number, reason: string) => {
    setState((prev) => {
      const newTotal = (prev.profile.totalExp || 0) + amount;
      const newTx: ExpTransaction = {
        id: `tx-${Date.now()}`,
        amount,
        action: "exp_gain",
        description: reason,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        profile: { ...prev.profile, totalExp: newTotal },
        expTransactions: [newTx, ...prev.expTransactions],
        mascotState: amount > 0 ? "celebrating" : "idle",
      };
    });
  }, []);

  const deductExp = useCallback((amount: number, reason: string) => {
    setState((prev) => {
      const newTotal = Math.max(0, (prev.profile.totalExp || 0) - amount);
      const newTx: ExpTransaction = {
        id: `tx-${Date.now()}`,
        amount: -amount,
        action: "exp_deduction",
        description: reason,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        profile: { ...prev.profile, totalExp: newTotal },
        expTransactions: [newTx, ...prev.expTransactions],
      };
    });
  }, []);

  const applyDeadlinePenalty = useCallback((taskTitle: string) => {
    setState((prev) => {
      const penaltyAmount = 50;
      const newTotal = Math.max(0, (prev.profile.totalExp || 0) - penaltyAmount);
      const newTx: ExpTransaction = {
        id: `tx-penalty-${Date.now()}`,
        amount: -penaltyAmount,
        action: "penalty_overdue_deadline",
        description: `Overdue deadline penalty: ${taskTitle}`,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        profile: { ...prev.profile, totalExp: newTotal },
        expTransactions: [newTx, ...prev.expTransactions],
        mascotState: "warning_alert",
      };
    });
    setTimeout(() => {
      setState((prev) => (prev.mascotState === "warning_alert" ? { ...prev, mascotState: "idle" } : prev));
    }, 6000);
  }, []);

  const purchaseReward = useCallback((reward: RewardItem) => {
    const currentExp = stateRef.current.profile.totalExp || 0;
    if (currentExp < reward.cost) {
      return { success: false, error: "Insufficient EXP balance" };
    }
    const uniqueCode = `${reward.discountCode}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const redeemed: RedeemedReward = {
      id: `red-${Date.now()}`,
      rewardId: reward.id,
      title: reward.title,
      discountCode: uniqueCode,
      cost: reward.cost,
      redeemedAt: new Date().toISOString(),
    };
    const expTx: ExpTransaction = {
      id: `tx-reward-${Date.now()}`,
      amount: -reward.cost,
      action: "reward_redemption",
      description: `Redeemed ${reward.title}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        totalExp: Math.max(0, (prev.profile.totalExp || 0) - reward.cost),
      },
      redeemedRewards: [redeemed, ...prev.redeemedRewards],
      expTransactions: [expTx, ...prev.expTransactions],
      mascotState: "celebrating",
    }));
    setTimeout(() => {
      setState((prev) => (prev.mascotState === "celebrating" ? { ...prev, mascotState: "idle" } : prev));
    }, 4000);
    return { success: true, code: uniqueCode };
  }, []);

  const setChosenTotem = useCallback((totem: TotemMascotId) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, chosenTotem: totem },
      mascotState: "celebrating",
    }));
    setTimeout(() => {
      setState((prev) => (prev.mascotState === "celebrating" ? { ...prev, mascotState: "idle" } : prev));
    }, 3000);
  }, []);

  const setMascotState = useCallback((mascotState: MascotState) => {
    setState((prev) => ({ ...prev, mascotState }));
  }, []);

  const toggleBusinessAccount = useCallback(() => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, isBusinessAccount: !prev.profile.isBusinessAccount },
    }));
  }, []);

  const createAdvertisement = useCallback((adData: Omit<Advertisement, "id" | "impressions" | "clicks">) => {
    const newAd: Advertisement = {
      ...adData,
      id: `ad-${Date.now()}`,
      impressions: 0,
      clicks: 0,
    };
    setState((prev) => ({
      ...prev,
      advertisements: [newAd, ...prev.advertisements],
    }));
  }, []);

  const toggleAdvertisementActive = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      advertisements: prev.advertisements.map((ad) => (ad.id === id ? { ...ad, active: !ad.active } : ad)),
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      syncStatus,
      syncError,
      currentStreak: state.profile.currentStreak || 1,
      totalExp: state.profile.totalExp || 0,
      chosenTotem: state.profile.chosenTotem || "arystan",
      isBusinessAccount: state.profile.isBusinessAccount === true,
      mascotState: state.mascotState,
      redeemedRewards: state.redeemedRewards,
      expTransactions: state.expTransactions,
      advertisements: state.advertisements,
      signIn,
      signOut,
      flush: () => saveNow(),
      updateProfile,
      replaceProfile,
      completeOnboarding,
      addApplication,
      removeApplication,
      updateApplication,
      setTaskDone,
      toggleTask,
      markTask,
      dismissNotification,
      toggleCompare,
      setCompare,
      toggleEcoMode,
      setEcoMode,
      addFocusTime,
      setArchetype,
      addVaultDocument,
      updateVaultDocument,
      removeVaultDocument,
      addCustomRoadmapTask,
      addAchievementBoost,
      saveCareerAssessment,
      addExp,
      deductExp,
      applyDeadlinePenalty,
      purchaseReward,
      setChosenTotem,
      setMascotState,
      toggleBusinessAccount,
      createAdvertisement,
      toggleAdvertisementActive,
    }),
    [
      state,
      hydrated,
      syncStatus,
      syncError,
      signIn,
      signOut,
      saveNow,
      updateProfile,
      replaceProfile,
      completeOnboarding,
      addApplication,
      removeApplication,
      updateApplication,
      setTaskDone,
      toggleTask,
      markTask,
      dismissNotification,
      toggleCompare,
      setCompare,
      toggleEcoMode,
      setEcoMode,
      addFocusTime,
      setArchetype,
      addVaultDocument,
      updateVaultDocument,
      removeVaultDocument,
      addCustomRoadmapTask,
      addAchievementBoost,
      saveCareerAssessment,
      addExp,
      deductExp,
      applyDeadlinePenalty,
      purchaseReward,
      setChosenTotem,
      setMascotState,
      toggleBusinessAccount,
      createAdvertisement,
      toggleAdvertisementActive,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
