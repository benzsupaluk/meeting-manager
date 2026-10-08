import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authApi } from "@/lib/api";
import { configureApiClient } from "@/lib/api/client";
import type { User } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hasHydrated: false,
      login: async (email, password) => {
        const { token, user } = await authApi.login(email, password);
        set({ token, user });
      },
      loginAsGuest: async () => {
        const { token, user } = await authApi.guest();
        set({ token, user });
      },
      logout: () => {
        if (get().token) void authApi.logout().catch(() => {});
        set({ token: null, user: null });
      },
    }),
    {
      name: "meeting-manager-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, user }) => ({ token, user }),
      // Rehydrated explicitly after mount (see useAuthHydration) so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => () => useAuthStore.setState({ hasHydrated: true }),
    },
  ),
);

/** Loads the persisted session from localStorage once mounted; returns whether it's ready. */
export function useAuthHydration() {
  const hydrated = useAuthStore((s) => s.hasHydrated);
  useEffect(() => {
    if (!useAuthStore.getState().hasHydrated) void useAuthStore.persist.rehydrate();
  }, []);
  return hydrated;
}

configureApiClient({
  getToken: () => useAuthStore.getState().token,
  // Expired/invalid token: drop the session; the auth guard redirects to /login.
  onUnauthorized: () => useAuthStore.setState({ token: null, user: null }),
});
