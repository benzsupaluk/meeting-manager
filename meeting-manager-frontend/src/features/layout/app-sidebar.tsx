"use client";

import { CalendarPlus, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { NAV_ITEMS } from "./nav-items";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-full flex-col gap-6">
      <nav aria-label="Main">
        <p className="mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Menu
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted hover:text-heading",
                    active &&
                      "bg-accent font-medium text-accent-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div>
        <p className="mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          General
        </p>
        <button
          type="button"
          onClick={logout}
          className="flex w-full  items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted hover:text-heading"
        >
          <LogOut className="size-4.5" />
          Logout
        </button>
      </div>

      <div className="mt-auto rounded-xl bg-linear-to-br from-primary to-[#e6b000] p-4 text-primary-foreground">
        <p className="font-semibold">New interview?</p>
        <p className="mt-1 text-xs text-primary-foreground/80">
          Book a slot with a candidate in under a minute.
        </p>
        <Button asChild size="sm" variant="secondary" className="mt-3 w-full">
          <Link href="/meetings/new" onClick={onNavigate}>
            <CalendarPlus />
            Schedule now
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden h-[calc(100dvh-2rem)] w-60 flex-col gap-4 lg:flex shrink-0 pl-4">
      <div className="rounded-2xl border bg-card p-4">
        <Link href="/dashboard">
          <BrandLogo />
        </Link>
      </div>
      <div className="flex-1 rounded-2xl border bg-card p-3">
        <SidebarContent />
      </div>
    </aside>
  );
}
