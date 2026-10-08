"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { PageSpinner } from "@/components/page-spinner";
import { useAuthHydration, useAuthStore } from "@/stores/auth-store";

/** Client-side guard: the JWT lives in localStorage, so the check runs after hydration. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthHydration();

  useEffect(() => {
    if (hydrated && !token) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, token, router, pathname]);

  if (!hydrated || !token) {
    return <PageSpinner className="min-h-dvh" />;
  }
  return children;
}
