import { create } from "zustand"
import type { MatchResult, Match } from "@/shared/types/domain"
import { calculateMatch } from "@/core/services/MatchService"
import { getMatchRepo } from "@/core/infra/RepositoryFactory"

interface MatchState {
  currentMatch: MatchResult | null
  userMatches: Match[]
  isLoading: boolean
  error: string | null

  // Actions
  calculateMatch: (
    user1Id: string,
    user2Id: string,
    user1SurveyId: string,
    user2SurveyId: string,
  ) => Promise<MatchResult>

  fetchUserMatches: (userId: string) => Promise<void>

  reset: () => void
}

export const useMatchStore = create<MatchState>()((set, get) => ({
  currentMatch: null,
  userMatches: [],
  isLoading: false,
  error: null,

  calculateMatch: async (user1Id, user2Id, user1SurveyId, user2SurveyId) => {
    set({ isLoading: true, error: null })

    try {
      const matchResult = await calculateMatch(user1Id, user2Id, user1SurveyId, user2SurveyId)
      set({ currentMatch: matchResult, isLoading: false })
      return matchResult
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to calculate match",
        isLoading: false,
      })
      throw error
    }
  },

  fetchUserMatches: async (userId) => {
    set({ isLoading: true, error: null })

    try {
      const matches = await getMatchRepo().getUserMatches(userId)
      set({ userMatches: matches, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch user matches",
        isLoading: false,
      })
    }
  },

  reset: () => {
    set({
      currentMatch: null,
      error: null,
    })
  },
}))
