import { createClient } from "@supabase/supabase-js";
import type { UserRepo } from "@/core/repositories/UserRepo";
import type { User, UserProfile } from "@/shared/types/domain";
import { supabase } from "@/lib/supabase";
import { extractInterestStrings } from "@/shared/utils/smartInterestExtraction";

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
    console.log("🔍 SupabaseUserRepo getById 시작 - userId:", userId);

    if (!userId) {
      console.error("❌ userId가 없습니다");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, age, occupation, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ 사용자 조회 에러:", error);
        if (error.code === "PGRST116") {
          console.log("🔍 사용자가 존재하지 않음");
          return null;
        }
        throw error;
      }

      if (!data) {
        console.log("⚠️ 사용자 데이터가 없음");
        return null;
      }

      console.log("✅ 사용자 조회 성공:", {
        id: (data as any).id,
        name: (data as any).name,
        email: (data as any).email,
      });

      return {
        id: (data as any).id,
        name: (data as any).name,
        email: (data as any).email,
        age: (data as any).age,
        occupation: (data as any).occupation,
        createdAt: new Date((data as any).created_at),
        updatedAt: (data as any).updated_at
          ? new Date((data as any).updated_at)
          : null,
      };
    } catch (error) {
      console.error("❌ getById 전체 에러:", error);
      return null;
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    console.log("🔍 SupabaseUserRepo getProfile 시작 - userId:", userId);

    if (!userId) {
      console.error("❌ userId가 없습니다");
      return null;
    }

    try {
      // 🎯 1단계: 기본 사용자 정보 조회
      console.log("📋 1단계: 기본 사용자 정보 조회 시작");
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("❌ 사용자 정보 조회 에러:", userError);
        if (userError.code === "PGRST116") {
          console.log(
            "🔍 사용자가 데이터베이스에 존재하지 않음, 신규 사용자로 처리"
          );
          return null;
        }
        throw userError;
      }

      if (!userData) {
        console.log("⚠️ 사용자 데이터가 비어있음");
        return null;
      }

      console.log("✅ 사용자 정보 조회 성공:", {
        id: userData.id,
        name: userData.name,
        age: userData.age,
        occupation: userData.occupation,
      });

      // 🎯 2단계: 설문 응답 데이터 조회 (관심사 추출용)
      console.log("📊 2단계: 설문 응답 데이터 조회 시작");
      const { data: surveyData, error: surveyError } = await supabase
        .from("user_responses")
        .select(
          `
          id,
          options (
            id,
            value,
            text,
            icon
          ),
          questions (
            id,
            text,
            weight
          ),
          user_surveys (
            id,
            user_id,
            completed
          )
        `
        )
        .eq("user_surveys.user_id", userId)
        .eq("user_surveys.completed", true);

      if (surveyError) {
        console.error("❌ 설문 데이터 조회 에러:", surveyError);
        console.log("🔄 설문 에러 무시하고 기본 프로필 반환");
      }

      console.log("📊 설문 응답 데이터:", {
        총개수: surveyData?.length || 0,
        샘플: surveyData?.slice(0, 2) || [],
      });

      // 🎯 3단계: 프로필 기본 정보 구성
      const profile: UserProfile = {
        id: userData.id,
        name: userData.name || "사용자",
        age: userData.age || 20,
        occupation: userData.occupation || "학생",
        interests: [],
        createdAt: new Date(userData.created_at || Date.now()),
      };

      // 🎯 4단계: 관심사 추출
      if (!surveyData || surveyData.length === 0) {
        console.log("📋 설문 응답 데이터가 없음 - 상세 정보:", {
          surveyData: surveyData,
          surveyDataLength: surveyData?.length,
          userId: userId,
        });

        // 🔍 혹시 다른 방법으로 매칭 데이터에서 관심사 복구 시도
        console.log("🔄 매칭 데이터에서 관심사 복구 시도");
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select("common_interests")
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .limit(5);

        console.log("📊 매칭 데이터 복구 결과:", {
          matchData,
          matchError,
          count: matchData?.length,
        });

        if (!matchError && matchData && matchData.length > 0) {
          const recoveredInterests: string[] = [];
          matchData.forEach((match: any) => {
            if (match.common_interests?.tags) {
              recoveredInterests.push(...match.common_interests.tags);
            }
          });

          const uniqueRecovered = Array.from(new Set(recoveredInterests));
          if (uniqueRecovered.length > 0) {
            console.log(
              "🎯 매칭 데이터에서 관심사 복구 성공:",
              uniqueRecovered
            );
            profile.interests = uniqueRecovered.slice(0, 10); // 최대 10개
          } else {
            console.log("❌ 매칭 데이터에서도 관심사 복구 실패");
            profile.interests = [];
          }
        } else {
          console.log("❌ 매칭 데이터 조회 실패 또는 데이터 없음");
          profile.interests = [];
        }
      } else if (surveyData && surveyData.length > 0) {
        console.log("🧠 스마트 관심사 추출 시작");
        console.log(
          "📊 원본 설문 데이터:",
          JSON.stringify(surveyData.slice(0, 2), null, 2)
        );

        // Supabase 데이터를 스마트 추출 함수가 기대하는 형태로 변환
        const transformedData = surveyData.map((item: any, index: number) => {
          console.log(`🔍 응답 ${index + 1} 변환:`, {
            원본: item,
            options: item.options,
            questions: item.questions,
          });

          return {
            options: {
              value:
                item.options?.[0]?.value || item.options?.value || "unknown",
              text:
                item.options?.[0]?.text || item.options?.text || "알 수 없음",
            },
            questions: {
              text:
                item.questions?.[0]?.text ||
                item.questions?.text ||
                "질문 없음",
            },
          };
        });

        console.log(
          "🔄 변환된 데이터:",
          JSON.stringify(transformedData.slice(0, 2), null, 2)
        );

        // 새로운 스마트 관심사 추출 시스템 사용
        const extractedInterests = extractInterestStrings(transformedData);

        console.log("✅ 추출된 관심사:", extractedInterests.length, "개");
        console.log("📝 관심사 목록:", extractedInterests);

        // 🎯 추가 폴백: 기본 추출 방식도 시도
        if (extractedInterests.length === 0) {
          console.log("⚠️ 스마트 추출 실패, 기본 추출 방식 시도");

          const basicInterests: string[] = [];

          surveyData.forEach((item: any) => {
            // 직접적인 관심사 태그 추출
            const optionValue = item.options?.[0]?.value || item.options?.value;
            const optionText = item.options?.[0]?.text || item.options?.text;

            if (
              optionValue &&
              ![
                "love",
                "like",
                "neutral",
                "dislike",
                "매우좋아함",
                "좋아함",
                "보통",
                "관심없음",
              ].includes(optionValue)
            ) {
              basicInterests.push(optionValue);
            }

            // 질문에서 키워드 추출 시도
            const questionText =
              item.questions?.[0]?.text || item.questions?.text || "";
            const keywords = [
              "드라마",
              "웹툰",
              "영화",
              "음악",
              "운동",
              "카페",
              "여행",
              "책",
              "게임",
              "요리",
            ];

            keywords.forEach((keyword) => {
              if (
                questionText.includes(keyword) &&
                optionText?.includes("좋아함")
              ) {
                basicInterests.push(keyword);
              }
            });
          });

          // 중복 제거
          const uniqueBasicInterests = Array.from(new Set(basicInterests));
          console.log("🔄 기본 추출 결과:", uniqueBasicInterests);

          profile.interests =
            uniqueBasicInterests.length > 0 ? uniqueBasicInterests : ["일반"];
        } else {
          profile.interests = extractedInterests;
        }

        // 관심사 통계 출력
        if (profile.interests.length > 0) {
          console.log("🎯 사용자 관심사 프로필 완성!");
          console.log("🏷️ 최종 관심사 태그:", profile.interests);
        } else {
          console.log("⚠️ 관심사 추출 완전 실패 - 기본값 설정");
          profile.interests = ["일반", "대화"];
        }
      } else {
        console.log("📋 설문 데이터가 없어 관심사를 빈 배열로 설정");
        profile.interests = [];
      }

      console.log("🎉 최종 프로필:", {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        occupation: profile.occupation,
        interests: profile.interests,
        interestCount: profile.interests.length,
      });

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

  /**
   * 🔍 이메일 아이디 또는 이름으로 사용자 검색
   */
  async searchUsers(searchQuery: string): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      age: number | null;
      occupation: string | null;
    }>
  > {
    console.log("🔍 사용자 검색 시작:", searchQuery);

    if (!searchQuery || searchQuery.trim().length < 2) {
      console.log("⚠️ 검색어가 너무 짧음");
      return [];
    }

    const cleanQuery = searchQuery.trim().toLowerCase();

    try {
      // 🎯 1단계: 이메일 @ 앞부분으로 검색
      console.log("📧 1단계: 이메일 아이디로 검색");
      const { data: emailResults, error: emailError } = await supabase
        .from("users")
        .select("id, name, email, age, occupation")
        .ilike("email", `${cleanQuery}%`) // 시작하는 이메일
        .limit(10);

      if (emailError) {
        console.error("❌ 이메일 검색 에러:", emailError);
      }

      console.log("📧 이메일 검색 결과:", emailResults?.length || 0, "개");

      // 🎯 2단계: 이름으로 검색
      console.log("👤 2단계: 이름으로 검색");
      const { data: nameResults, error: nameError } = await supabase
        .from("users")
        .select("id, name, email, age, occupation")
        .ilike("name", `%${cleanQuery}%`) // 포함하는 이름
        .limit(10);

      if (nameError) {
        console.error("❌ 이름 검색 에러:", nameError);
      }

      console.log("👤 이름 검색 결과:", nameResults?.length || 0, "개");

      // 🎯 3단계: 결과 합치기 및 중복 제거
      const combinedResults = [
        ...((emailResults as any[]) || []),
        ...((nameResults as any[]) || []),
      ];

      // ID 기준으로 중복 제거
      const uniqueResults = combinedResults.filter(
        (user: any, index: number, array: any[]) =>
          array.findIndex((u: any) => u.id === user.id) === index
      );

      // 이메일에서 @ 앞부분 추출해서 매칭도 계산
      const scoredResults = uniqueResults.map((user: any) => {
        const emailId = user.email?.split("@")[0]?.toLowerCase() || "";
        const userName = user.name?.toLowerCase() || "";

        let score = 0;

        // 이메일 아이디 정확 매칭
        if (emailId === cleanQuery) score += 100;
        else if (emailId.startsWith(cleanQuery)) score += 80;
        else if (emailId.includes(cleanQuery)) score += 60;

        // 이름 매칭
        if (userName === cleanQuery) score += 90;
        else if (userName.startsWith(cleanQuery)) score += 70;
        else if (userName.includes(cleanQuery)) score += 50;

        return { ...user, score };
      });

      // 점수 순으로 정렬
      const sortedResults = scoredResults
        .filter((user: any) => user.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 8); // 최대 8개

      console.log("🎯 최종 검색 결과:", {
        총개수: sortedResults.length,
        상위결과: sortedResults.slice(0, 3).map((u: any) => ({
          name: u.name,
          emailId: u.email?.split("@")[0],
          score: u.score,
        })),
      });

      return sortedResults.map(({ score, ...user }: any) => user) as any; // 타입 임시 수정
    } catch (error) {
      console.error("❌ 사용자 검색 전체 에러:", error);
      return [];
    }
  }
}

export const supabaseUserRepo = new SupabaseUserRepo();
