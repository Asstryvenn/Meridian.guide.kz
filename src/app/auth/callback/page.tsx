"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentSupabaseUser } from "@/lib/supabase/auth";
import { useApp } from "@/lib/store/app-store";
import styles from "./callback.module.css";

export default function AuthCallback() {
  const router = useRouter();
  const { signIn } = useApp();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    currentSupabaseUser().then(async (user) => {
      if (!user) return setFailed(true);
      await signIn(user);
      router.replace("/onboarding");
    });
  }, [router, signIn]);

  return <p className={styles.message}>{failed ? "Sign-in could not be completed. Please try again." : "Signing you in…"}</p>;
}
