"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { currentSupabaseUser } from "@/lib/supabase/auth";
import { useApp } from "@/lib/store/app-store";
import styles from "./callback.module.css";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useApp();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function handleAuth() {
      const code = searchParams.get("code");
      const supabase = getSupabase();
      if (code && supabase) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {}
      }
      const user = await currentSupabaseUser();
      if (!user) {
        setFailed(true);
        return;
      }
      await signIn(user);
      router.replace("/onboarding");
    }

    handleAuth();
  }, [router, searchParams, signIn]);

  return <p className={styles.message}>{failed ? "Sign-in could not be completed. Please try again." : "Signing you in..."}</p>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<p className={styles.message}>Signing you in...</p>}>
      <CallbackContent />
    </Suspense>
  );
}
