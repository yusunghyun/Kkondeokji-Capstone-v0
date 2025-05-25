import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserProfile } from "@/shared/types/domain";
import { getUserRepo } from "@/core/infra/RepositoryFactory";
import { getCurrentUser } from "@/lib/auth";

interface UserState {
  currentUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createUser: (userData: {
    id?: string;
    name?: string;
    age?: number;
    occupation?: string;
    email?: string;
  }) => Promise<string>;
  fetchUser: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  updateUser: (
    userData: {
      name?: string;
      age?: number;
      occupation?: string;
    },
    userId: string
  ) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      profile: null,
      isLoading: false,
      error: null,

      createUser: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const userId = await getUserRepo().create(userData);
          const user = await getUserRepo().getById(userId);

          if (user) {
            set({ currentUser: user, isLoading: false });
          } else {
            throw new Error("Failed to fetch created user");
          }

          return userId;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to create user",
            isLoading: false,
          });
          throw error;
        }
      },

      fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await getCurrentUser();
          const userData = await getUserRepo().getById(user?.id || "");

          console.log("fetchUser userData", userData);
          console.log("fetchUser user", user);
          if (user) {
            set({ currentUser: userData, isLoading: false });
          } else {
            throw new Error("User not found");
          }
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to fetch user",
            isLoading: false,
          });
        }
      },

      fetchProfile: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const profile = await getUserRepo().getProfile(userId);

          if (profile) {
            set({ profile, isLoading: false });
          } else {
            throw new Error("Profile not found");
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch profile",
            isLoading: false,
          });
        }
      },

      updateUser: async (userData, userId) => {
        set({ isLoading: true, error: null });
        try {
          const { currentUser } = get();

          console.log("currentUser", currentUser);

          if (!currentUser) {
            throw new Error("No user logged in");
          }

          console.log("updateUser userData", userData);
          console.log("updateUser currentUser", currentUser);

          await getUserRepo().update(userId, userData);

          set({ currentUser: { ...currentUser, ...userData } });

          // Refresh user data
          // await get().fetchUser(currentUser.id);

          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to update user",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({ currentUser: null, profile: null, error: null });
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
