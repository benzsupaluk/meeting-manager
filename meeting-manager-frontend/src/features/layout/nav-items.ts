import { CalendarPlus, LayoutDashboard, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden from the guest account. */
  membersOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings/new", label: "Schedule Meeting", icon: CalendarPlus, membersOnly: true },
];

/** Header title/subtitle per route; first matching prefix wins. */
export const PAGE_HEADINGS: { match: RegExp; title: string; subtitle: string }[] = [
  { match: /^\/dashboard/, title: "Dashboard", subtitle: "Track and manage upcoming interviews" },
  { match: /^\/meetings\/new/, title: "Schedule Meeting", subtitle: "Book an interview with a candidate" },
  { match: /^\/meetings\/[^/]+\/edit/, title: "Edit Meeting", subtitle: "Update interview details" },
  { match: /^\/candidates\//, title: "Candidate", subtitle: "Profile, meetings and feedback" },
];
