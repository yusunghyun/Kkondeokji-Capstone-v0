import type { User, UserProfile } from "@/shared/types/domain"

export interface UserRepo {
  create(userData: { name?: string; age?: number; occupation?: string }): Promise<string>
  getById(userId: string): Promise<User | null>
  getProfile(userId: string): Promise<UserProfile | null>
  update(userId: string, userData: { name?: string; age?: number; occupation?: string }): Promise<void>
}
