import { supabase } from "@/shared/utils/supabaseClient";
import { UserProfile, User } from "@/shared/types/domain";

export class SupabaseUserRepo {
  async create(userData: {
    name?: string;
    age?: number;
    occupation?: string;
    id?: string;
    email?: string;
  }): Promise<string> {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: userData.id,
          name: userData.name,
          age: userData.age,
          occupation: userData.occupation,
          email: userData.email,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data.id;
  }

  async getById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      occupation: data.occupation,
    };
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    console.log("SupabaseUserRepo getProfile 시작 - userId:", userId);

    try {
      // Get user data - 기본 정보만 가져오기
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      console.log("SupabaseUserRepo getProfile userData:", userData);

      if (userError) {
        console.log("SupabaseUserRepo getProfile userError:", userError);
        console.error("Error fetching user profile:", userError);
        if (userError.code === "PGRST116") {
          // 사용자 데이터가 없는 경우, 기본 프로필 반환
          console.log("사용자 데이터 없음, 기본 프로필 반환");
          return {
            id: userId,
            name: null,
            age: null,
            occupation: null,
            interests: [],
            createdAt: new Date(),
          };
        }
        return null;
      }

      // 사용자 데이터가 있으면 프로필 생성
      const profile: UserProfile = {
        id: userData.id,
        name: userData.name,
        age: userData.age,
        occupation: userData.occupation,
        interests: [], // will populate below
        createdAt: new Date(userData.created_at),
      };

      // 직접 조인 쿼리로 한 번에 관심사 가져오기
      try {
        // 완료된 설문 ID 가져오기
        const { data: completedSurveys } = await supabase
          .from("user_surveys")
          .select("id")
          .eq("user_id", userId)
          .eq("completed", true);

        if (completedSurveys && completedSurveys.length > 0) {
          const surveyIds = completedSurveys.map((s) => s.id);

          // 응답에서 옵션 ID 가져오기
          const { data: responses } = await supabase
            .from("user_responses")
            .select("option_id")
            .in("user_survey_id", surveyIds);

          if (responses && responses.length > 0) {
            const optionIds = responses.map((r) => r.option_id);

            // 옵션 값 가져오기
            const { data: options } = await supabase
              .from("options")
              .select("value")
              .in("id", optionIds);

            if (options && options.length > 0) {
              console.log("관심사 데이터 로드 성공:", options.length);
              // 중복 제거
              const uniqueInterests = Array.from(
                new Set(options.map((o) => o.value))
              );
              profile.interests = uniqueInterests;
            } else {
              console.log("옵션 데이터 없음, 샘플 데이터 사용");
              profile.interests = [
                "여행",
                "음악",
                "영화",
                "독서",
                "운동",
                "요리",
                "게임",
              ];
            }
          } else {
            console.log("응답 데이터 없음, 샘플 데이터 사용");
            profile.interests = [
              "여행",
              "음악",
              "영화",
              "독서",
              "운동",
              "요리",
              "게임",
            ];
          }
        } else {
          // 대체 방법: 하드코딩된 샘플 관심사 제공
          console.log("관심사 데이터 없음, 샘플 데이터 사용");
          profile.interests = [
            "여행",
            "음악",
            "영화",
            "독서",
            "운동",
            "요리",
            "게임",
          ];
        }
      } catch (interestError) {
        console.error("관심사 로드 실패:", interestError);
        // 오류 발생 시 기본 관심사 제공
        profile.interests = ["여행", "음악", "영화", "독서", "운동"];
      }

      console.log("SupabaseUserRepo getProfile 반환할 프로필:", profile);
      return profile;
    } catch (error) {
      console.error("SupabaseUserRepo getProfile 에러:", error);
      // 오류 발생 시에도 기본 프로필 반환
      return {
        id: userId,
        name: "사용자",
        age: 20,
        occupation: "학생",
        interests: ["여행", "음악", "영화", "독서", "운동"],
        createdAt: new Date(),
      };
    }
  }

  async update(
    userId: string,
    userData: { name?: string; age?: number; occupation?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update(userData)
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // getAllUsers is not part of UserRepo interface but used internally
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }

    return data.map((user) => ({
      id: user.id,
      name: user.name,
      age: user.age,
      occupation: user.occupation,
    }));
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

export const supabaseUserRepo = new SupabaseUserRepo();
