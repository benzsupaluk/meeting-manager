import { create } from "zustand";
import { meetingsApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/api/client";
import { PAGE_SIZE } from "@/lib/constants";
import type { Meeting, MeetingFilters, MeetingPayload, PageMeta } from "@/lib/types";

type LoadState = "idle" | "loading" | "loadingMore" | "error";

interface MeetingsState {
  items: Meeting[];
  meta: PageMeta | null;
  filters: MeetingFilters;
  loadState: LoadState;
  error: string | null;
  today: Meeting[];
  todayLoading: boolean;

  setFilters: (filters: Partial<MeetingFilters>) => void;
  fetchFirstPage: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchToday: () => Promise<void>;
  createMeeting: (payload: MeetingPayload) => Promise<Meeting>;
  updateMeeting: (id: string, payload: Partial<MeetingPayload>) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;
}

// Only the latest list request may write to the store; older in-flight ones are aborted.
let listController: AbortController | null = null;

const matchesFilters = (m: Meeting, f: MeetingFilters) => !f.status || m.status === f.status;

export const useMeetingsStore = create<MeetingsState>()((set, get) => {
  async function loadPage(page: number) {
    listController?.abort();
    const controller = (listController = new AbortController());
    set({ loadState: page === 1 ? "loading" : "loadingMore", error: null });
    try {
      const { data, meta } = await meetingsApi.list(
        { ...get().filters, page, limit: PAGE_SIZE },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      set((s) => ({
        items: page === 1 ? data : dedupe([...s.items, ...data]),
        meta,
        loadState: "idle",
      }));
    } catch (error) {
      if (controller.signal.aborted) return;
      set({ loadState: "error", error: getErrorMessage(error) });
    }
  }

  return {
    items: [],
    meta: null,
    filters: { scope: "upcoming" },
    loadState: "idle",
    error: null,
    today: [],
    todayLoading: false,

    setFilters: (filters) => {
      set((s) => ({ filters: { ...s.filters, ...filters } }));
      void loadPage(1);
    },

    fetchFirstPage: () => loadPage(1),

    fetchNextPage: async () => {
      const { meta, loadState } = get();
      if (!meta?.hasMore || loadState === "loading" || loadState === "loadingMore") return;
      await loadPage(meta.page + 1);
    },

    fetchToday: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      set({ todayLoading: true });
      try {
        const { data } = await meetingsApi.list({
          scope: "all",
          from: start.toISOString(),
          to: end.toISOString(),
          limit: 20,
        });
        set({ today: data.filter((m) => m.status !== "cancelled") });
      } catch {
        set({ today: [] });
      } finally {
        set({ todayLoading: false });
      }
    },

    createMeeting: async (payload) => {
      const meeting = await meetingsApi.create(payload);
      // Ordering/pagination is server-defined, so refresh instead of guessing the slot.
      void loadPage(1);
      void get().fetchToday();
      return meeting;
    },

    updateMeeting: async (id, payload) => {
      const updated = await meetingsApi.update(id, payload);
      set((s) => ({
        items: s.items
          .map((m) => (m.id === id ? updated : m))
          .filter((m) => m.id !== id || matchesFilters(m, s.filters)),
        today: s.today.map((m) => (m.id === id ? updated : m)).filter((m) => m.status !== "cancelled"),
      }));
      return updated;
    },

    deleteMeeting: async (id) => {
      const snapshot = { items: get().items, meta: get().meta, today: get().today };
      set((s) => ({
        items: s.items.filter((m) => m.id !== id),
        today: s.today.filter((m) => m.id !== id),
        meta: s.meta && { ...s.meta, total: Math.max(0, s.meta.total - 1) },
      }));
      try {
        await meetingsApi.remove(id);
      } catch (error) {
        set(snapshot); // roll back optimistic removal
        throw error;
      }
    },
  };
});

function dedupe(meetings: Meeting[]) {
  const seen = new Set<string>();
  return meetings.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}
