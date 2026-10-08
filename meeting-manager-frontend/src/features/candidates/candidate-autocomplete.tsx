"use client";

import { Loader2, UserRound } from "lucide-react";
import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { candidatesApi } from "@/lib/api";
import type { CandidateSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  value: string;
  invalid?: boolean;
  onChange: (name: string) => void;
  onSelect: (candidate: CandidateSummary) => void;
}

/** Free-text input that suggests existing candidates (accessible combobox pattern). */
export function CandidateAutocomplete({ id, value, invalid, onChange, onSelect }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Results are tagged with the term they answer, so stale ones are ignored without extra state.
  const [fetched, setFetched] = useState<{ term: string; results: CandidateSummary[] }>({ term: "", results: [] });
  const term = useDebouncedValue(value.trim(), 250);

  useEffect(() => {
    if (!open || !term) return;
    const controller = new AbortController();
    candidatesApi
      .search(term, controller.signal)
      .then((results) => {
        setFetched({ term, results });
        setActive(-1);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [term, open]);

  const results = open && term && fetched.term === term ? fetched.results : [];
  const loading = open && !!term && fetched.term !== term;

  const choose = (candidate: CandidateSummary) => {
    onSelect(candidate);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(results[active]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && (loading || results.length > 0);

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        autoComplete="off"
        placeholder="e.g. Alice Johnson"
        className="h-10"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {loading && results.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </li>
          ) : (
            results.map((c, i) => (
              <li
                key={c.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown fires before the input's blur, so the click isn't lost
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex  items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  i === active && "bg-accent text-accent-foreground",
                )}
              >
                <UserRound className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium text-heading">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{c.position}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
