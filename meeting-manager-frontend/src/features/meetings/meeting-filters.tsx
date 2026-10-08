"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MEETING_STATUS_LABEL } from "@/lib/constants";
import type { MeetingScope, MeetingStatus } from "@/lib/types";
import { useMeetingsStore } from "@/stores/meetings-store";

const ALL = "all";

export function MeetingFilters() {
  const filters = useMeetingsStore((s) => s.filters);
  const setFilters = useMeetingsStore((s) => s.setFilters);

  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  useEffect(() => {
    if (debouncedSearch !== (filters.search ?? ""))
      setFilters({ search: debouncedSearch || undefined });
  }, [debouncedSearch, filters.search, setFilters]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Tabs
        value={filters.scope}
        onValueChange={(scope) => setFilters({ scope: scope as MeetingScope })}
      >
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-1 gap-3">
        <InputGroup className="flex-1 bg-card">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search candidate or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search meetings"
          />
        </InputGroup>
        <Select
          value={filters.status ?? ALL}
          onValueChange={(v) =>
            setFilters({ status: v === ALL ? undefined : (v as MeetingStatus) })
          }
        >
          <SelectTrigger className="w-36 bg-card" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.entries(MEETING_STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
