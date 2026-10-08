import { create } from "zustand";
import { candidatesApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/api/client";
import type { CandidateProfile, FeedbackPayload } from "@/lib/types";

interface CandidateState {
  profiles: Record<string, CandidateProfile>;
  loadingId: string | null;
  error: string | null;
  fetchProfile: (id: string) => Promise<void>;
  saveNotes: (id: string, notes: string) => Promise<void>;
  addFeedback: (id: string, payload: FeedbackPayload) => Promise<void>;
}

export const useCandidateStore = create<CandidateState>()((set) => ({
  profiles: {},
  loadingId: null,
  error: null,

  fetchProfile: async (id) => {
    set({ loadingId: id, error: null });
    try {
      const profile = await candidatesApi.get(id);
      set((s) => ({ profiles: { ...s.profiles, [id]: profile } }));
    } catch (error) {
      set({ error: getErrorMessage(error) });
    } finally {
      set((s) => (s.loadingId === id ? { loadingId: null } : s));
    }
  },

  saveNotes: async (id, notes) => {
    const updated = await candidatesApi.updateNotes(id, notes);
    set((s) => {
      const current = s.profiles[id];
      return current ? { profiles: { ...s.profiles, [id]: { ...current, interviewNotes: updated.interviewNotes } } } : s;
    });
  },

  addFeedback: async (id, payload) => {
    const feedback = await candidatesApi.addFeedback(id, payload);
    set((s) => {
      const current = s.profiles[id];
      return current
        ? { profiles: { ...s.profiles, [id]: { ...current, feedback: [feedback, ...current.feedback] } } }
        : s;
    });
  },
}));
