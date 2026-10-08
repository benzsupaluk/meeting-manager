import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Meeting } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  meetingsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), get: vi.fn() },
}));

const { meetingsApi } = await import("@/lib/api");
const { useMeetingsStore } = await import("../meetings-store");

const meeting = (id: string, status: Meeting["status"] = "pending"): Meeting => ({
  id,
  title: "Interview",
  description: "",
  candidate: { id: "c1", name: "Alice", position: "Software Engineer" },
  startAt: "2030-01-01T10:00:00.000Z",
  endAt: "2030-01-01T11:00:00.000Z",
  type: "zoom",
  location: "",
  status,
  createdBy: null,
  createdAt: "",
  updatedAt: "",
});

const page = (ids: string[], pageNo: number, hasMore: boolean) => ({
  data: ids.map((id) => meeting(id)),
  meta: { page: pageNo, limit: 2, total: 3, totalPages: 2, hasMore },
});

describe("meetings store", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useMeetingsStore.setState({ items: [], meta: null, filters: { scope: "upcoming" }, loadState: "idle", today: [] });
  });

  it("loads the first page then appends the next one", async () => {
    vi.mocked(meetingsApi.list)
      .mockResolvedValueOnce(page(["a", "b"], 1, true))
      .mockResolvedValueOnce(page(["c"], 2, false));

    await useMeetingsStore.getState().fetchFirstPage();
    await useMeetingsStore.getState().fetchNextPage();

    const { items, meta } = useMeetingsStore.getState();
    expect(items.map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(meta?.hasMore).toBe(false);
    expect(vi.mocked(meetingsApi.list).mock.calls[1]![0]).toMatchObject({ page: 2 });
  });

  it("does not request more when there are no more pages", async () => {
    useMeetingsStore.setState({ meta: page([], 1, false).meta });
    await useMeetingsStore.getState().fetchNextPage();
    expect(meetingsApi.list).not.toHaveBeenCalled();
  });

  it("rolls back an optimistic delete when the API fails", async () => {
    useMeetingsStore.setState({ items: [meeting("a"), meeting("b")], meta: page([], 1, false).meta });
    vi.mocked(meetingsApi.remove).mockRejectedValueOnce(new Error("boom"));

    await expect(useMeetingsStore.getState().deleteMeeting("a")).rejects.toThrow("boom");
    expect(useMeetingsStore.getState().items.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("drops an updated meeting that no longer matches the status filter", async () => {
    useMeetingsStore.setState({ items: [meeting("a"), meeting("b")], filters: { scope: "upcoming", status: "pending" } });
    vi.mocked(meetingsApi.update).mockResolvedValueOnce(meeting("a", "confirmed"));

    await useMeetingsStore.getState().updateMeeting("a", { status: "confirmed" });
    expect(useMeetingsStore.getState().items.map((m) => m.id)).toEqual(["b"]);
  });
});
