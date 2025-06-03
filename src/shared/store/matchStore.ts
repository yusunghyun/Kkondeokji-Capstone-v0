import { create } from "zustand"
import { calculateRealMatch } from "@/core/services/RealMatchService"
import type { MatchResult } from "@/shared/types/domain"

interface MatchState {
  currentMatch: MatchResult | null
  isLoading: boolean
  error: string | null
  calculateMatch: (user1Id: string, user2Id: string) => Promise<void>
  clearMatch: () => void
}

export const useMatchStore = create<MatchState>((set, get) => ({
  currentMatch: null,
  isLoading: false,
  error: null,

  calculateMatch: async (user1Id: string, user2Id: string) => {
    set({ isLoading: true, error: null })

    try {
      const matchResult = await calculateRealMatch(user1Id, user2Id)
      set({ currentMatch: matchResult, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to calculate match",
        isLoading: false,
      })
    }
  },

  clearMatch: () => {
    set({ currentMatch: null, error: null })
  },
}))
