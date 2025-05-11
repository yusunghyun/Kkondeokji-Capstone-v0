import type { Match } from "@/shared/types/domain"

export interface MatchRepo {
  create(matchData: {
    user1Id: string
    user2Id: string
    matchScore: number
    commonInterests: {
      tags: string[]
      responses: Array<{
        question: string
        answer: string
      }>
    }
    aiInsights?: string
  }): Promise<string>

  getById(matchId: string): Promise<Match | null>

  getByUserIds(user1Id: string, user2Id: string): Promise<Match | null>

  getUserMatches(userId: string): Promise<Match[]>

  updateAiInsights(matchId: string, insights: string): Promise<void>
}
