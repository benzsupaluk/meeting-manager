import { Suspense } from "react";
import { PageSpinner } from "@/components/page-spinner";
import { AuthGuard } from "@/features/auth/auth-guard";
import { AppHeader } from "@/features/layout/app-header";
import { AppSidebar } from "@/features/layout/app-sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    // Auth is client-side (token in localStorage), so the shell streams in after prerender.
    <Suspense fallback={<PageSpinner className="min-h-dvh" />}>
      <AuthGuard>
        <div className="mx-auto flex gap-2 py-4 h-dvh overflow-hidden">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-4 grow overflow-auto px-4">
            <AppHeader />
            <main className="min-w-0 flex-1">
              <Suspense fallback={<PageSpinner />}>{children}</Suspense>
            </main>
          </div>
        </div>
      </AuthGuard>
    </Suspense>
  );
}
