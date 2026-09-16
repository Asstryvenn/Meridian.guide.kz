"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useApp } from "@/lib/store/app-store";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { hydrated, user, onboarded } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!onboarded) router.replace("/onboarding");
  }, [hydrated, user, onboarded, router, pathname]);

  if (!hydrated || !user || !onboarded) return null;
  return <AppShell>{children}</AppShell>;
}
