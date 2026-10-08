import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MeetingFilters } from "@/features/meetings/meeting-filters";
import { MeetingList } from "@/features/meetings/meeting-list";
import { StatusLegend } from "@/features/meetings/status-legend";
import { TodayPanel } from "@/features/meetings/today-panel";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section
        className="min-w-0 space-y-4 rounded-2xl border bg-card/60 p-4 sm:p-5"
        aria-labelledby="upcoming-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="upcoming-heading" className="text-xl font-semibold">
              Upcoming Meetings
            </h2>
            <p className="text-sm">Interviews with candidates across all roles</p>
          </div>
          <Button asChild size="lg">
            <Link href="/meetings/new">
              <Plus />
              Schedule Meeting
            </Link>
          </Button>
        </div>
        <MeetingFilters />
        <MeetingList />
      </section>

      <aside className="space-y-4">
        <TodayPanel />
        <StatusLegend />
      </aside>
    </div>
  );
}
