"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getScholarship } from "@/lib/data/scholarships";
import { getUniversity } from "@/lib/data/universities";
import { onAuthChange, currentSupabaseUser, signOutEverywhere } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadRemoteState, persistTask, saveRemoteState } from "@/lib/supabase/sync";
import type { ActivityCategory, Application, ArchetypeId, AuthUser, CareerAssessmentResult, RoadmapTask, StudentProfile, VaultDocument } from "@/lib/types";
import { defaultVaultDocuments, emptyProfile, newApplication } from "./defaults";

const STORAGE_KEY = "meridian:v1";
const SAVE_DELAY_MS = 900;

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
}

export type SyncStatus = "idle" | "saving" | "saved" | "error";

interface AppActions {
  hydrated: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
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
};

const AppContext = createContext<(AppState & AppActions) | null>(null);

function readLocal(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...initialState,
      ...parsed,
      profile: { ...emptyProfile, ...parsed.profile },
      documents: parsed.documents && parsed.documents.length > 0 ? parsed.documents : defaultVaultDocuments,
      customRoadmapTasks: parsed.customRoadmapTasks || [],
    };
  } catch {
    return initialState;
  }
}

function writeLocal(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

async function resolveSession(local: AppState): Promise<AppState> {
  const remoteUser = await currentSupabaseUser();
  if (!remoteUser) {
    const staleSession = local.user?.mode === "supabase" || (local.user?.mode === "local" && isSupabaseConfigured());
    return staleSession ? { ...local, user: null } : local;
  }
  const remote = await loadRemoteState(remoteUser.id);
  if (remote) return { ...local, ...remote, user: remoteUser };
  const sameUser = local.user?.id === remoteUser.id;
  return sameUser || local.user === null ? { ...local, user: remoteUser } : { ...initialState, user: remoteUser };
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
    resolveSession(readLocal())
      .catch(() => readLocal())
      .then((next) => {
        if (!active) return;
        setState(next);
        setHydrated(true);
      });

    const unsubscribe = onAuthChange((event, user) => {
      if (event === "SIGNED_OUT") setState((prev) => (prev.user?.mode === "supabase" ? { ...prev, user: null } : prev));
      if (event === "SIGNED_IN" && user) {
        setState((prev) => (prev.user?.id === user.id ? prev : { ...prev, user }));
      }
    });

    return () => {
      active = false;
      unsubscribe();
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
      return { ...prev, completedTasks: done ? [...prev.completedTasks, id] : prev.completedTasks.filter((t) => t !== id) };
    });
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

  const toggleTask = useCallback((id: string) => setTaskDone(id, !stateRef.current.completedTasks.includes(id)), [setTaskDone]);

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

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      syncStatus,
      syncError,
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
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
