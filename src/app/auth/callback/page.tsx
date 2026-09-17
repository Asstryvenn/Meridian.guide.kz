"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeAuthRedirect } from "@/lib/supabase/auth";
import { useApp } from "@/lib/store/app-store";
import styles from "./callback.module.css";
import { useT } from "@/lib/i18n/use-t";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function AuthCallback() {
  const t = useT();
  const router = useRouter();
  const { signIn } = useApp();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const url = new URL(window.location.href);
    completeAuthRedirect(url).then(async (result) => {
      if (!result.user) return setError(result.error);
      await signIn(result.user);
      router.replace(safeNext(url.searchParams.get("next")));
    });
  }, [router, signIn]);

  return (
    <div className={styles.wrap}>
      {error ? (
        <>
          <p className={styles.error}>{error}</p>
          <Button href="/login">{t("Back to login")}</Button>
        </>
      ) : (
        <>
          <span className={styles.spinner} aria-hidden />
          <p className={styles.message}>{t("Signing you in…")}</p>
        </>
      )}
    </div>
  );
}
