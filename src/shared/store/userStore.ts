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
  fetchUser: () => Promise<User | null>;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
  updateUser: (
    userData: {
      name?: string;
      age?: number;
      occupation?: string;
    },
    userId: string
  ) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      profile: null,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      createUser: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          console.log("createUser 시작:", userData);
          const userId = await getUserRepo().create(userData);
          console.log("사용자 생성 완료, ID:", userId);

          const user = await getUserRepo().getById(userId);
          console.log("생성된 사용자 정보:", user);

          if (user) {
            set({ currentUser: user, isLoading: false });
          } else {
            throw new Error("생성된 사용자 정보를 가져오는데 실패했습니다");
          }

          return userId;
        } catch (error) {
          console.error("사용자 생성 실패:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "사용자 생성에 실패했습니다",
            isLoading: false,
          });
          throw error;
        }
      },

      fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log("fetchUser 시작");
          const authUser = await getCurrentUser();
          console.log("인증된 사용자:", authUser);

          if (!authUser?.id) {
            console.log("인증된 사용자가 없음");
            set({ currentUser: null, isLoading: false });
            return null;
          }

          const userData = await getUserRepo().getById(authUser.id);
          console.log("DB에서 가져온 사용자 정보:", userData);

          if (userData) {
            set({ currentUser: userData, isLoading: false });
            return userData;
          } else {
            console.log("DB에 사용자 정보가 없음, 새로 생성");
            // 사용자 정보가 없으면 새로 생성
            const newUser = {
              id: authUser.id,
              name: undefined,
              age: undefined,
              occupation: undefined,
              email: authUser.email,
            };

            const userId = await getUserRepo().create(newUser);
            const createdUser = await getUserRepo().getById(userId);

            if (createdUser) {
              set({ currentUser: createdUser, isLoading: false });
              return createdUser;
            }
          }

          set({ isLoading: false });
          return null;
        } catch (error) {
          console.error("사용자 정보 가져오기 실패:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "사용자 정보 가져오기에 실패했습니다",
            isLoading: false,
          });
          return null;
        }
      },

      fetchProfile: async (userId) => {
        if (!userId) {
          console.error("fetchProfile: userId가 없습니다");
          set({ error: "사용자 ID가 없습니다", isLoading: false });
          return null;
        }

        console.log("fetchProfile 시작:", userId);
        set({ isLoading: true, error: null });

        try {
          // 프로필 가져오기
          const profile = await getUserRepo().getProfile(userId);
          console.log("가져온 프로필:", profile);

          if (profile) {
            set({ profile, isLoading: false });
            return profile;
          } else {
            console.log("프로필을 찾을 수 없음, 기본 프로필 생성");
            // 기본 프로필 생성
            const defaultProfile: UserProfile = {
              id: userId,
              name: null,
              age: null,
              occupation: null,
              interests: [],
              createdAt: new Date(),
            };
            set({ profile: defaultProfile, isLoading: false });
            return defaultProfile;
          }
        } catch (error) {
          console.error("프로필 가져오기 실패:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "프로필 가져오기에 실패했습니다",
            isLoading: false,
          });

          // 에러가 발생해도 기본 프로필 반환
          const defaultProfile: UserProfile = {
            id: userId,
            name: null,
            age: null,
            occupation: null,
            interests: [],
            createdAt: new Date(),
          };
          set({ profile: defaultProfile });
          return defaultProfile;
        }
      },

      updateUser: async (userData, userId) => {
        set({ isLoading: true, error: null });
        try {
          console.log("updateUser 시작:", userData, userId);

          if (!userId) {
            throw new Error("사용자 ID가 없습니다");
          }

          await getUserRepo().update(userId, userData);
          console.log("사용자 정보 업데이트 완료");

          // 현재 사용자 정보 업데이트
          const { currentUser } = get();
          if (currentUser) {
            set({
              currentUser: {
                ...currentUser,
                ...userData,
              },
            });
          }

          // 프로필도 함께 업데이트
          const updatedProfile = await getUserRepo().getProfile(userId);
          if (updatedProfile) {
            set({ profile: updatedProfile });
          }

          set({ isLoading: false });
        } catch (error) {
          console.error("사용자 정보 업데이트 실패:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "사용자 정보 업데이트에 실패했습니다",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        console.log("userStore logout 실행");
        set({
          currentUser: null,
          profile: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
        profile: state.profile,
      }),
    }
  )
);
