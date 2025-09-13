import { supabase } from "@/lib/supabase";
import type { UserRepo } from "@/core/repositories/UserRepo";
import type { User, UserProfile } from "@/shared/types/domain";

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
        // 완료된 설문에서 질문, 옵션, 응답 데이터를 모두 가져오기
        const { data: surveyData, error: surveyError } = await supabase
          .from("user_responses")
          .select(
            `
            options!inner (
              value,
              text,
              icon
            ),
            questions!inner (
              text
            ),
            user_surveys!inner (
              user_id,
              completed
            )
          `
          )
          .eq("user_surveys.user_id", userId)
          .eq("user_surveys.completed", true);

        if (surveyError) {
          console.error("관심사 데이터 로드 에러:", surveyError);
          profile.interests = [];
        } else if (surveyData && surveyData.length > 0) {
          console.log("설문 원본 데이터:", surveyData.length, "개 응답");

          // 감정 태그와 가중치 매핑
          const emotionWeights = {
            love: 3, // 매우 좋아함
            like: 2, // 좋아함
            neutral: 0, // 보통 (관심사에서 제외)
            dislike: 0, // 관심 없음 (관심사에서 제외)
          };

          const interestMap = new Map<
            string,
            {
              weight: number;
              count: number;
              sources: Set<string>;
              originalText?: string;
            }
          >();

          surveyData.forEach((item: any) => {
            const optionValue = item.options?.value;
            const optionText = item.options?.text;
            const questionText = item.questions?.text;

            if (!optionValue || !questionText) return;

            // 1. 옵션이 실제 관심사인 경우 (감정 태그가 아닌 경우)
            if (!emotionWeights.hasOwnProperty(optionValue)) {
              const interest = optionValue;
              if (interestMap.has(interest)) {
                const current = interestMap.get(interest)!;
                current.count += 1;
                current.sources.add("option");
              } else {
                interestMap.set(interest, {
                  weight: 2, // 실제 선택한 관심사는 기본 가중치 2
                  count: 1,
                  sources: new Set(["option"]),
                  originalText: optionText,
                });
              }
            }
            // 2. 감정 태그인 경우, 질문에서 주제 추출
            else {
              const emotionWeight =
                emotionWeights[optionValue as keyof typeof emotionWeights];

              if (emotionWeight > 0) {
                // 좋아함/매우 좋아함만
                // 질문 텍스트에서 주제 추출 (예: "EDM·페스티벌에 얼마나 관심이 있나요?" → "EDM·페스티벌")
                const topicMatch = questionText.match(
                  /(.+?)에?\s*얼마나\s*관심이?\s*있나요?/
                );
                if (topicMatch) {
                  const topic = topicMatch[1].trim();

                  // 주제를 영어 태그로 변환 (기존 매핑 활용)
                  let interestTag = this.convertTopicToTag(topic);

                  if (interestMap.has(interestTag)) {
                    const current = interestMap.get(interestTag)!;
                    current.weight = Math.max(current.weight, emotionWeight);
                    current.count += 1;
                    current.sources.add("question");
                  } else {
                    interestMap.set(interestTag, {
                      weight: emotionWeight,
                      count: 1,
                      sources: new Set(["question"]),
                      originalText: topic,
                    });
                  }
                }
              }
            }
          });

          // 관심사를 가중치와 빈도수로 정렬
          const sortedInterests = Array.from(interestMap.entries())
            .filter(([, data]) => data.weight > 0) // 가중치가 있는 것만
            .sort(([, a], [, b]) => {
              // 1순위: 가중치, 2순위: 빈도수
              if (a.weight !== b.weight) return b.weight - a.weight;
              return b.count - a.count;
            })
            .slice(0, 20) // 상위 20개 선택
            .map(([tag, data]) => ({
              tag,
              weight: data.weight,
              count: data.count,
              text: data.originalText || tag,
              sources: Array.from(data.sources),
            }));

          console.log("처리된 관심사:", sortedInterests.length, "개");
          console.log("상위 관심사들:", sortedInterests.slice(0, 5));

          // 관심사 태그만 추출
          profile.interests = sortedInterests.map((item) => item.tag);
        } else {
          console.log("설문 데이터 없음");
          profile.interests = [];
        }
      } catch (error) {
        console.error("관심사 로딩 에러:", error);
        profile.interests = [];
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

  // 질문 주제를 관심사 태그로 변환하는 헬퍼 함수
  convertTopicToTag(topic: string): string {
    const topicMap: Record<string, string> = {
      // 미디어
      "드라마·예능": "drama_variety",
      "EDM·페스티벌": "edm_festival",
      "공포·미스터리": "horror_mystery",
      "애니·만화": "anime_manga",

      // 스포츠
      "러닝·마라톤": "running_marathon",
      "농구·NBA": "basketball_nba",
      "운동·헬스": "fitness_health",
      "다이어트·영양": "diet_nutrition",

      // 음악
      "발라드·감성": "ballad_emotional",

      // 문화/취미
      "여행·문화": "travel_culture",
      "사진·영상": "photo_video",
      "패션·뷰티": "fashion_beauty",
      "커피·차": "coffee_tea",
      "음식·쿠킹": "food_cooking",
      반려동물: "pets",
      반려식물: "plants",
      "가드닝·플랜트": "gardening",

      // 기술/비즈니스
      "과학·테크": "science_tech",
      "생산성·노하우": "productivity",
      "금융·투자": "finance_investment",
      창업팁: "startup_tips",
      "블록체인·크립토": "blockchain_crypto",
      기술서적: "tech_books",

      // 라이프스타일
      "명상·요가": "meditation_yoga",
      "환경·지속가능": "environment_sustainability",
      "봉사·사회공헌": "volunteer_social",
      "게임·취미": "games_hobby",
      "자동차·모빌리티": "automotive",
      "독서·인문학": "reading_humanities",
      "현실·자기계발": "reality_self_development",
      "스타워즈·팬덤": "starwars_fandom",
      여행사진: "travel_photography",
    };

    // 정확한 매칭 먼저 시도
    if (topicMap[topic]) {
      return topicMap[topic];
    }

    // 부분 매칭 시도
    for (const [key, value] of Object.entries(topicMap)) {
      if (topic.includes(key.split("·")[0]) || key.includes(topic)) {
        return value;
      }
    }

    // 매칭되지 않으면 원본을 안전한 태그로 변환
    return topic
      .replace(/[·\s]/g, "_")
      .replace(/[^\w가-힣]/g, "")
      .toLowerCase();
  }
}

export const supabaseUserRepo = new SupabaseUserRepo();
