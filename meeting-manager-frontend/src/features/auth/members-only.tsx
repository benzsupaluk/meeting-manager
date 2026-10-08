"use client";

import Link from "next/link";
import type { ReactNode } from "react";
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
