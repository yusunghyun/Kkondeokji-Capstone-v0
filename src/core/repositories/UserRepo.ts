import type { User, UserProfile } from "@/shared/types/domain";

export interface UserRepo {
  createUser(user: Partial<User>, authUserId: string): Promise<User>;
  updateUser(updates: Partial<User>, userId: string): Promise<User>;
  getProfile(userId: string): Promise<UserProfile | null>;

  // 🔍 사용자 ID로 기본 정보 조회
  getById(userId: string): Promise<User | null>;

  // 🔍 사용자 검색 기능 추가
  searchUsers(searchQuery: string): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      age: number | null;
      occupation: string | null;
    }>
  >;
}
