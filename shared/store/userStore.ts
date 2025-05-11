import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, UserProfile } from "@/shared/types/domain"
import { getUserRepo } from "@/core/infra/RepositoryFactory"

interface UserState {
  currentUser: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: string | null

  // Actions
  createUser: (userData: { name?: string; age?: number; occupation?: string }) => Promise<string>
  fetchUser: (userId: string) => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateUser: (userData: { name?: string; age?: number; occupation?: string }) => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      profile: null,
      isLoading: false,
      error: null,

      createUser: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const userId = await getUserRepo().create(userData)
          const user = await getUserRepo().getById(userId)

          if (user) {
            set({ currentUser: user, isLoading: false })
          } else {
            throw new Error("Failed to fetch created user")
          }

          return userId
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to create user",
            isLoading: false,
          })
          throw error
        }
      },

      fetchUser: async (userId) => {
        set({ isLoading: true, error: null })
        try {
          const user = await getUserRepo().getById(userId)

          if (user) {
            set({ currentUser: user, isLoading: false })
          } else {
            throw new Error("User not found")
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to fetch user",
            isLoading: false,
          })
        }
      },

      fetchProfile: async (userId) => {
        set({ isLoading: true, error: null })
        try {
          const profile = await getUserRepo().getProfile(userId)

          if (profile) {
            set({ profile, isLoading: false })
          } else {
            throw new Error("Profile not found")
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to fetch profile",
            isLoading: false,
          })
        }
      },

      updateUser: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const { currentUser } = get()

          if (!currentUser) {
            throw new Error("No user logged in")
          }

          await getUserRepo().update(currentUser.id, userData)

          // Refresh user data
          await get().fetchUser(currentUser.id)

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to update user",
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        set({ currentUser: null, profile: null, error: null })
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    },
  ),
)
