import type { AuthUser } from "@/lib/types";
import { getSupabase } from "./client";

export interface AuthResult {
  user: AuthUser | null;
  error: string | null;
  pendingConfirmation?: boolean;
}

function localUser(email: string, provider: AuthUser["provider"]): AuthUser {
  return { id: `local-${email.toLowerCase()}`, email, provider, mode: "local" };
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { user: localUser(email, "email"), error: null };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/onboarding` },
  });
  if (error) return { user: null, error: error.message };
  if (!data.session || !data.user) return { user: null, error: null, pendingConfirmation: true };
  return { user: { id: data.user.id, email, provider: "email", mode: "supabase" }, error: null };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { user: localUser(email, "email"), error: null };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { user: null, error: error?.message ?? "Unable to sign in." };
  return { user: { id: data.user.id, email, provider: "email", mode: "supabase" }, error: null };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { user: localUser("demo.student@locus.local", "google"), error: null };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  return { user: null, error: error?.message ?? null };
}

export async function currentSupabaseUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const provider = data.user.app_metadata?.provider === "google" ? "google" : "email";
  return { id: data.user.id, email: data.user.email ?? "", provider, mode: "supabase" };
}

export async function signOutEverywhere(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
}
