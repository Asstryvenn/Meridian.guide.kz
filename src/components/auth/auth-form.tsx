"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/fields";
import { signInWithEmail, signInWithGoogle, signUpWithEmail, type AuthResult } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useApp } from "@/lib/store/app-store";
import styles from "./auth-form.module.css";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { signIn, onboarded } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const configured = isSupabaseConfigured();

  async function finish(result: AuthResult) {
    if (result.error) return setError(result.error);
    if (result.pendingConfirmation) return setInfo("Check your inbox to confirm your email, then continue to onboarding.");
    if (!result.user) return;
    await signIn(result.user);
    router.replace(mode === "signup" || !onboarded ? "/onboarding" : "/dashboard");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setBusy("email");
    try {
      await finish(mode === "signup" ? await signUpWithEmail(email, password) : await signInWithEmail(email, password));
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy("google");
    try {
      await finish(await signInWithGoogle());
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.logo}>
        <Logo />
      </Link>
      <motion.div
        className={`glass ${styles.card}`}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      >
        <h1 className={styles.title}>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className={styles.subtitle}>{mode === "signup" ? "Your plan starts with a six-minute profile." : "Pick up where you left off."}</p>

        <Button type="button" variant="secondary" size="lg" block onClick={onGoogle} disabled={busy !== null}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {busy === "google" ? "Connecting…" : "Continue with Google"}
        </Button>

        <div className={styles.divider}>
          <span>or with email</span>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@school.edu" />
          <TextField label="Password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={setPassword} placeholder="At least 8 characters" />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {info && <p className={styles.info}>{info}</p>}
          <Button type="submit" size="lg" block disabled={busy !== null}>
            {busy === "email" ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>

        <p className={styles.switch}>
          {mode === "signup" ? "Already have an account?" : "New to Meridian Guide?"} <Link href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? "Log in" : "Create an account"}</Link>
        </p>

        {!configured && <p className={styles.demo}>Supabase is not configured, so accounts run in local demo mode and data stays in this browser.</p>}
      </motion.div>
    </div>
  );
}
