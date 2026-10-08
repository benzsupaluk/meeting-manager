"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/format";
import type { MeetingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMeetingsStore } from "@/stores/meetings-store";

const TONE: Record<MeetingStatus, { card: string; dot: string }> = {
  confirmed: { card: "bg-accent/70", dot: "bg-primary" },
  pending: { card: "bg-warning/8", dot: "bg-warning" },
  completed: { card: "bg-muted", dot: "bg-muted-foreground" },
  cancelled: { card: "bg-muted", dot: "bg-muted-foreground" },
};

export function TodayPanel() {
  const today = useMeetingsStore((s) => s.today);
  const loading = useMeetingsStore((s) => s.todayLoading);
  const fetchToday = useMeetingsStore((s) => s.fetchToday);

  useEffect(() => {
    void fetchToday();
  }, [fetchToday]);

  return (
    <section className="rounded-2xl border bg-card p-5" aria-labelledby="today-heading">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id="today-heading" className="text-lg font-semibold">
          Today&apos;s Meetings
        </h2>
        <span className="text-xs text-muted-foreground">{format(new Date(), "EEE, MMM d")}</span>
      </div>

      {loading && today.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : today.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm">No meetings scheduled today.</p>
      ) : (
        <ul className="space-y-3">
          {today.map((m) => {
            const start = new Date(m.startAt);
            const tone = TONE[m.status];
            return (
              <li key={m.id}>
                <Link
                  href={`/candidates/${m.candidate.id}?meeting=${m.id}`}
                  className={cn("flex items-center gap-3 rounded-xl p-3 transition-colors hover:brightness-[0.98]", tone.card)}
                >
                  <span
                    className={cn(
                      "flex size-12 shrink-0 flex-col items-center justify-center rounded-full leading-none text-heading",
                      tone.dot,
                    )}
                  >
                    <span className="text-base font-semibold">{format(start, "hh")}</span>
                    <span className="text-[10px] uppercase">{format(start, "a")}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-heading">{m.candidate.name}</span>
                    <span className="block truncate text-xs">{m.candidate.position}</span>
                    <span className="block text-xs">
                      {formatTime(m.startAt)} – {formatTime(m.endAt)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
