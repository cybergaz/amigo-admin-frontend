import { api_client } from "@/lib/api-client";
import { RoleType, ApiResponse } from "@/types/common.types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface UserInfo {
  id: number
  role: RoleType
  name: string
  phone: string | null
  email: string | null
  profile_pic?: string | null
}

type UserStoreType = {
  user: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
};

export const user_store = create<UserStoreType>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,
        setUser: (user) => set({ user, error: null }),
        clearUser: () => set({ user: null, error: null }),
        fetchUser: async () => {
          set({ isLoading: true, error: null });

          try {
            const data = await api_client.makeRequest<UserInfo>('/user/get-user', {
              method: 'GET',
            });

            if (data.success && data.data) {
              set({ user: data.data, isLoading: false, error: null });
            } else {
              set({
                user: null,
                isLoading: false,
                error: data.message || 'Failed to fetch user data'
              });
            }
          } catch (error) {
            set({
              user: null,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Network error'
            });
          }
        },
        hasHydrated: false,
        setHasHydrated: (value) => set({ hasHydrated: value }),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ user: state.user }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      }
    ),
    {
      name: 'user-store',
    }
  )
);

