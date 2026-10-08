"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { PageSpinner } from "@/components/page-spinner";
import { Button } from "@/components/ui/button";
import { useIsGuest } from "@/stores/auth-store";

/** Renders children for signed-in members; the guest account gets `fallback` instead. */
export function MembersOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useIsGuest() ? fallback : children;
}

export function GuestNotice({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm">{message}</p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

/** Fallback that sends the guest elsewhere, with a toast explaining why. */
export function GuestRedirect({ to, message }: { to: string; message: string }) {
  const router = useRouter();
  useEffect(() => {
    // Fixed id so a double-run effect (Strict Mode) doesn't stack toasts.
    toast.info(message, { id: "guest-redirect" });
    router.replace(to);
  }, [router, to, message]);
  return <PageSpinner />;
}
