import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/features/auth/login-form";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-xl shadow-slate-200/60">
        <BrandLogo className="mb-8 justify-center" />
        <h1 className="text-center text-xl font-semibold">{APP_NAME}</h1>
        <p className="mt-1 mb-6 text-center text-sm">Sign in to manage your interviews</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Demo account: recruiter@example.com / password123
        </p>
      </div>
    </main>
  );
}
