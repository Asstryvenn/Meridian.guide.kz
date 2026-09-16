"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getScholarship } from "@/lib/data/scholarships";
import { getUniversity } from "@/lib/data/universities";
import { currentSupabaseUser, signOutEverywhere } from "@/lib/supabase/auth";
import { loadRemoteState, saveRemoteState } from "@/lib/supabase/sync";
import type { Application, AuthUser, StudentProfile } from "@/lib/types";
import { emptyProfile, newApplication } from "./defaults";

const STORAGE_KEY = "locus:v1";

interface AppState {
  user: AuthUser | null;
  profile: StudentProfile;
  onboarded: boolean;
  applications: Application[];
  completedTasks: string[];
  dismissedNotifications: string[];
  compare: string[];
}

interface AppActions {
  hydrated: boolean;
  syncError: string | null;
  signIn: (user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<StudentProfile>) => void;
  replaceProfile: (profile: StudentProfile) => void;
  completeOnboarding: () => void;
  addApplication: (slug: string) => void;
  removeApplication: (slug: string) => void;
  updateApplication: (slug: string, patch: Partial<Application>) => void;
  toggleTask: (id: string) => void;
  markTask: (id: string) => void;
  dismissNotification: (id: string) => void;
  toggleCompare: (slug: string) => void;
  setCompare: (slugs: string[]) => void;
}

const initialState: AppState = {
  user: null,
  profile: emptyProfile,
  onboarded: false,
  applications: [],
  completedTasks: [],
  dismissedNotifications: [],
  compare: [],
};

const AppContext = createContext<(AppState & AppActions) | null>(null);

function readLocal(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...initialState, ...parsed, profile: { ...emptyProfile, ...parsed.profile } };
  } catch {
    return initialState;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    const local = readLocal();
    currentSupabaseUser()
      .then(async (remoteUser) => {
        if (!remoteUser) return local;
        const remote = await loadRemoteState(remoteUser.id);
        return remote ? { ...local, ...remote, user: remoteUser } : { ...local, user: remoteUser };
      })
      .catch(() => local)
      .then((next) => {
        if (!active) return;
        setState(next);
        setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    if (state.user?.mode !== "supabase") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const userId = state.user.id;
    saveTimer.current = setTimeout(() => {
      saveRemoteState(userId, state).then(setSyncError).catch((error: Error) => setSyncError(error.message));
    }, 1200);
  }, [state, hydrated]);

  const signIn = useCallback(async (user: AuthUser) => {
    const remote = user.mode === "supabase" ? await loadRemoteState(user.id).catch(() => null) : null;
    setState((prev) => {
      const sameUser = prev.user?.id === user.id;
      const base = sameUser || prev.user === null ? prev : initialState;
      return remote ? { ...base, ...remote, user } : { ...base, user };
    });
  }, []);

  const signOut = useCallback(async () => {
    await signOutEverywhere();
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const updateProfile = useCallback((patch: Partial<StudentProfile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const replaceProfile = useCallback((profile: StudentProfile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, onboarded: true }));
  }, []);

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

  const toggleTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      completedTasks: prev.completedTasks.includes(id) ? prev.completedTasks.filter((t) => t !== id) : [...prev.completedTasks, id],
    }));
  }, []);

  const markTask = useCallback((id: string) => {
    setState((prev) => (prev.completedTasks.includes(id) ? prev : { ...prev, completedTasks: [...prev.completedTasks, id] }));
  }, []);

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

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      syncError,
      signIn,
      signOut,
      updateProfile,
      replaceProfile,
      completeOnboarding,
      addApplication,
      removeApplication,
      updateApplication,
      toggleTask,
      markTask,
      dismissNotification,
      toggleCompare,
      setCompare,
    }),
    [state, hydrated, syncError, signIn, signOut, updateProfile, replaceProfile, completeOnboarding, addApplication, removeApplication, updateApplication, toggleTask, markTask, dismissNotification, toggleCompare, setCompare],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
