"use client";

import { ChevronDown, LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { initials } from "@/lib/format";
import { useAuthStore, useIsGuest } from "@/stores/auth-store";
import { SidebarContent } from "./app-sidebar";
import { PAGE_HEADINGS } from "./nav-items";

export function AppHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isGuest = useIsGuest();
  const subtitle = isGuest ? "Guest access" : user?.email;
  const [menuOpen, setMenuOpen] = useState(false);
  const heading = PAGE_HEADINGS.find((h) => h.match.test(pathname));

  return (
    <header className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 sm:px-5">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-4">
          <SheetHeader className="p-0">
            <SheetTitle asChild>
              <div>
                <BrandLogo />
              </div>
            </SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{heading?.title ?? "Meetings"}</h1>
        <p className="hidden truncate text-sm sm:block">{heading?.subtitle}</p>
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex  items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted"
            >
              <Avatar className="size-9 rounded-lg">
                <AvatarFallback className="rounded-lg bg-accent font-medium text-accent-foreground">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 md:block">
                <span className="block truncate text-sm font-medium text-heading">{user.name}</span>
                <span className="block truncate text-xs">{subtitle}</span>
              </span>
              <ChevronDown className="hidden size-4 md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium text-heading">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}>
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
