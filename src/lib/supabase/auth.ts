import type { AuthError, User } from "@supabase/supabase-js";
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

function toAuthUser(user: User): AuthUser {
  const provider = user.app_metadata?.provider === "google" ? "google" : "email";
  return { id: user.id, email: user.email ?? "", provider, mode: "supabase" };
}

const friendlyErrors: [RegExp, string][] = [
  [/invalid login credentials/i, "Email or password is incorrect."],
  [/email not confirmed/i, "Please confirm your email first — check your inbox for the link."],
  [/user already registered|already been registered/i, "An account with this email already exists. Try logging in instead."],
  [/password should be at least/i, "Password is too short. Use at least 8 characters."],
  [/rate limit|too many requests/i, "Too many attempts. Please wait a minute and try again."],
  [/provider is not enabled|unsupported provider/i, "Google sign-in is not enabled for this project yet."],
  [/failed to fetch|network/i, "Can't reach the server. Check your connection and try again."],
];

export function describeAuthError(error: AuthError | Error | null | undefined): string | null {
  if (!error) return null;
  return friendlyErrors.find(([pattern]) => pattern.test(error.message))?.[1] ?? error.message;
}

function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { user: localUser(email, "email"), error: null };
  try {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl("/onboarding") } });
    if (error) return { user: null, error: describeAuthError(error) };
    if (data.user && data.user.identities?.length === 0) {
      return { user: null, error: describeAuthError(new Error("User already registered")) };
    }
    if (!data.session || !data.user) return { user: null, error: null, pendingConfirmation: true };
    return { user: toAuthUser(data.user), error: null };
  } catch (error) {
    return { user: null, error: describeAuthError(error as Error) };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { user: localUser(email, "email"), error: null };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { user: null, error: describeAuthError(error) ?? "Unable to sign in." };
    return { user: toAuthUser(data.user), error: null };
  } catch (error) {
    return { user: null, error: describeAuthError(error as Error) };
  }
}

export async function signInWithGoogle(next = "/dashboard"): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { user: localUser("demo.student@meridian.local", "google"), error: null };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next), queryParams: { prompt: "select_account" } },
  });
  return { user: null, error: describeAuthError(error) };
}

export async function sendPasswordReset(email: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Password reset needs Supabase to be configured.";
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl("/dashboard") });
  return describeAuthError(error);
}

export async function completeAuthRedirect(url: URL): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { user: null, error: "Authentication is not configured." };
  const providerError = url.searchParams.get("error_description") ?? new URLSearchParams(url.hash.slice(1)).get("error_description");
  if (providerError) return { user: null, error: providerError };

  const code = url.searchParams.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error && !/already|used|invalid.*grant/i.test(error.message)) return { user: null, error: describeAuthError(error) };
    if (data.user) return { user: toAuthUser(data.user), error: null };
  }

  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return { user: toAuthUser(data.session.user), error: null };
  return { user: null, error: "Your sign-in link has expired. Please try again." };
}

export async function currentSupabaseUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? toAuthUser(data.user) : null;
}

export function onAuthChange(listener: (event: string, user: AuthUser | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    listener(event, session?.user ? toAuthUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signOutEverywhere(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
}
