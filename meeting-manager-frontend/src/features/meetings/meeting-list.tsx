"use client";

import { CalendarX2, Loader2, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useIsGuest } from "@/stores/auth-store";
import { useMeetingsStore } from "@/stores/meetings-store";
import { MeetingCard } from "./meeting-card";

const GRID = "grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]";

export function MeetingList() {
  const items = useMeetingsStore((s) => s.items);
  const meta = useMeetingsStore((s) => s.meta);
  const loadState = useMeetingsStore((s) => s.loadState);
  const error = useMeetingsStore((s) => s.error);
  const fetchFirstPage = useMeetingsStore((s) => s.fetchFirstPage);
  const fetchNextPage = useMeetingsStore((s) => s.fetchNextPage);
  const isGuest = useIsGuest();

  useEffect(() => {
    void fetchFirstPage();
  }, [fetchFirstPage]);

  const sentinelRef = useInfiniteScroll<HTMLDivElement>(
    fetchNextPage,
    !!meta?.hasMore && loadState === "idle",
  );

  if (loadState === "loading" && items.length === 0) {
    return (
      <div className={GRID} aria-busy>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (loadState === "error" && items.length === 0) {
    return (
      <EmptyState
        title="Couldn't load meetings"
        description={error ?? undefined}
        action={
          <Button variant="outline" onClick={fetchFirstPage}>
            <RotateCw />
            Try again
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No meetings found"
        description={isGuest ? "Try a different filter." : "Try a different filter, or schedule a new interview."}
        action={
          !isGuest && (
            <Button asChild>
              <Link href="/meetings/new">Schedule a meeting</Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className={GRID} aria-busy={loadState === "loading"}>
        {items.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>

      <div
        ref={sentinelRef}
        className="flex min-h-10 items-center justify-center text-sm text-muted-foreground"
      >
        {loadState === "loadingMore" && (
          <Loader2 className="size-5 animate-spin text-brand-ink" aria-label="Loading more" />
        )}
        {loadState === "error" && (
          <Button variant="ghost" size="sm" onClick={fetchNextPage}>
            <RotateCw />
            Retry loading more
          </Button>
        )}
        {meta && !meta.hasMore && loadState === "idle" && (
          <span>
            Showing all {meta.total} meeting{meta.total === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <CalendarX2 className="size-6" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm">{description}</p>}
      {action}
    </div>
  );
}
