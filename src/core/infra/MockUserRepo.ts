import type { Response, UserProfile } from "@/shared/types/domain"
import type { UserRepo } from "@/core/repositories/UserRepo"
import { mockUserProfile, mockUserResponses } from "@/shared/utils/mockData"

export const mockUserRepo: UserRepo = {
  async create(): Promise<string> {
    // Return a mock user ID
    return "user-" + Math.floor(Math.random() * 1000)
  },

  async saveResponses(userId: string, responses: Response[]): Promise<void> {
    // In a real app, this would save to a database
    console.log(`Saving responses for user ${userId}:`, responses)
  },

  async fetchResponses(userId: string): Promise<Response[]> {
    // Return mock responses
    return userId === mockUserProfile.id ? mockUserResponses : []
  },

  async fetchProfile(userId: string): Promise<UserProfile | null> {
    // Return mock profile if ID matches, otherwise null
    return userId === mockUserProfile.id ? mockUserProfile : null
  },
}
