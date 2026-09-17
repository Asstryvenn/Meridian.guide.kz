"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { sendPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail, type AuthResult } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useApp } from "@/lib/store/app-store";
import styles from "./auth-form.module.css";
import { useT } from "@/lib/i18n/use-t";

function safeNext(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, user, hydrated } = useApp();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<"email" | "google" | "reset" | null>(null);
  const configured = isSupabaseConfigured();
  const next = safeNext(params.get("next"), mode === "signup" ? "/onboarding" : "/dashboard");

  useEffect(() => {
    if (hydrated && user) router.replace(next);
  }, [hydrated, user, router, next]);

  async function finish(result: AuthResult) {
    if (result.error) return setError(result.error);
    if (result.pendingConfirmation) return setInfo(t("We sent a confirmation link to {email}. Open it on this device to continue.", { email: email }));
    if (!result.user) return;
    await signIn(result.user);
    notify({ tone: "success", title: mode === "signup" ? t("Account created") : t("Welcome back") });
    router.replace(next);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t("Enter a valid email address."));
    if (password.length < 8) return setError(t("Use at least 8 characters for your password."));
    setBusy("email");
    try {
      await finish(mode === "signup" ? await signUpWithEmail(email.trim(), password) : await signInWithEmail(email.trim(), password));
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy("google");
    const result = await signInWithGoogle(next);
    if (result.error || result.user) {
      await finish(result);
      setBusy(null);
    }
  }

  async function onReset() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t("Enter your email above, then tap “Forgot password?” again."));
    setBusy("reset");
    const resetError = await sendPasswordReset(email.trim());
    setBusy(null);
    if (resetError) setError(resetError);
    else setInfo(t("If an account exists for {email}, a reset link is on its way.", { email: email.trim() }));
  }

  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.logo}>
        <Logo />
      </Link>
      <motion.div className={`glass ${styles.card}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <div className={styles.tabs} role="tablist" aria-label={t("Account")}>
          <Link href={`/login${params.toString() ? `?${params}` : ""}`} role="tab" aria-selected={mode === "login"} className={styles.tab}>
            
            {t("Log in")}
          </Link>
          <Link href={`/signup${params.toString() ? `?${params}` : ""}`} role="tab" aria-selected={mode === "signup"} className={styles.tab}>
            
            {t("Register")}
          </Link>
          <motion.span className={styles.tabThumb} data-mode={mode} layout transition={{ type: "spring", stiffness: 500, damping: 38 }} />
        </div>

        <div className={styles.heading}>
          <h1 className={styles.title}>{mode === "signup" ? t("Create your account") : t("Welcome back")}</h1>
          <p className={styles.subtitle}>{mode === "signup" ? t("Your personal university plan starts here.") : t("Pick up right where you left off.")}</p>
        </div>

        <Button type="button" variant="secondary" size="lg" block onClick={onGoogle} disabled={busy !== null}>
          <GoogleMark />
          {busy === "google" ? t("Opening Google…") : t("Continue with Google")}
        </Button>

        <div className={styles.divider}>
          <span>{t("or with email")}</span>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <TextField label={t("Email")} type="email" autoComplete="email" value={email} onChange={setEmail} placeholder={t("you@school.edu")} />
          <div className={styles.passwordField}>
            <TextField label={t("Password")} type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={setPassword} placeholder={t("At least 8 characters")} />
            <button type="button" className={styles.reveal} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? t("Hide password") : t("Show password")}>
              {showPassword ? t("Hide") : t("Show")}
            </button>
          </div>
          {mode === "login" && configured && (
            <button type="button" className={styles.forgot} onClick={onReset} disabled={busy !== null}>
              {busy === "reset" ? t("Sending…") : t("Forgot password?")}
            </button>
          )}
          {error && (
            <motion.p className={styles.error} role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              {error}
            </motion.p>
          )}
          {info && (
            <motion.p className={styles.info} role="status" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              {info}
            </motion.p>
          )}
          <Button type="submit" size="lg" block disabled={busy !== null}>
            {busy === "email" ? t("Please wait…") : mode === "signup" ? t("Create account") : t("Log in")}
          </Button>
        </form>

        {!configured && <p className={styles.demo}>{t("Supabase is not configured, so accounts run in local demo mode and data stays in this browser.")}</p>}
      </motion.div>
      <p className={styles.legal}>{t("By continuing you agree to use Meridian Guide as guidance, not as an official admission decision.")}</p>
    </div>
  );
}
