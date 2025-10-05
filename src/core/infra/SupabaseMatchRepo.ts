import type { MatchRepo } from "@/core/repositories/MatchRepo";
import type { Match } from "@/shared/types/domain";
import { supabase } from "@/lib/supabase";

export const supabaseMatchRepo: MatchRepo = {
  async create(matchData): Promise<string> {
    // Ensure user1Id is lexicographically smaller than user2Id for consistency
    const [user1Id, user2Id] = [matchData.user1Id, matchData.user2Id].sort();

    const { data, error } = await supabase
      .from("matches")
      .insert([
        {
          user1_id: user1Id,
          user2_id: user2Id,
          match_score: matchData.matchScore,
          common_interests: matchData.commonInterests,
          ai_insights: matchData.aiInsights || null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating match:", error);
      throw new Error("Failed to create match");
    }

    return data.id;
  },

  async getById(matchId): Promise<Match | null> {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (error) {
      console.error("Error fetching match:", error);
      return null;
    }

    return {
      id: data.id,
      user1Id: data.user1_id,
      user2Id: data.user2_id,
      matchScore: data.match_score,
      commonInterests: data.common_interests as {
        tags: string[];
        responses: Array<{ question: string; answer: string }>;
      } | null,
      aiInsights: data.ai_insights,
      createdAt: new Date(data.created_at),
    };
  },

  async getByUserIds(user1Id, user2Id): Promise<Match | null> {
    // Ensure user1Id is lexicographically smaller than user2Id for consistency
    const [sortedUser1Id, sortedUser2Id] = [user1Id, user2Id].sort();

    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", sortedUser1Id)
      .eq("user2_id", sortedUser2Id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No match found
        return null;
      }
      console.error("Error fetching match by user IDs:", error);
      return null;
    }

    return {
      id: data.id,
      user1Id: data.user1_id,
      user2Id: data.user2_id,
      matchScore: data.match_score,
      commonInterests: data.common_interests as {
        tags: string[];
        responses: Array<{ question: string; answer: string }>;
      } | null,
      aiInsights: data.ai_insights,
      createdAt: new Date(data.created_at),
    };
  },

  async getUserMatches(userId: string): Promise<Match[]> {
    if (!userId) {
      console.error("❌ getUserMatches: userId가 없습니다");
      return [];
    }

    try {
      // 기본 매칭 데이터 조회
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          id,
          user1_id,
          user2_id,
          match_score,
          common_interests,
          ai_insights,
          created_at
        `
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ 매칭 데이터 조회 에러:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // 상대방 사용자 정보 조회
      const matchesWithUserDetails: Match[] = [];

      for (const item of data) {
        try {
          // 상대방 ID 결정
          const partnerId =
            item.user1_id === userId ? item.user2_id : item.user1_id;

          // 상대방 사용자 정보 조회
          const { data: partnerData, error: partnerError } = await supabase
            .from("users")
            .select("id, name, age, occupation")
            .eq("id", partnerId)
            .single();

          if (partnerError) {
            console.error(
              `❌ 상대방 정보 조회 에러 (ID: ${partnerId}):`,
              partnerError
            );
          }

          // 현재 사용자 정보도 조회
          const { data: currentUserData, error: currentUserError } =
            await supabase
              .from("users")
              .select("id, name, age, occupation")
              .eq("id", userId)
              .single();

          if (currentUserError) {
            console.error(`❌ 현재 사용자 정보 조회 에러:`, currentUserError);
          }

          // 매칭 객체 생성 (올바른 필드명 사용)
          const match: Match = {
            id: item.id,
            user1Id: item.user1_id,
            user2Id: item.user2_id,
            matchScore: item.match_score || 0,
            commonInterests: (item.common_interests as {
              tags: string[];
              responses: { question: string; answer: string }[];
            } | null) || { tags: [], responses: [] },
            aiInsights: item.ai_insights || "",
            createdAt: new Date(item.created_at),
            // 사용자 정보 추가
            user1:
              item.user1_id === userId
                ? {
                    id: currentUserData?.id || userId,
                    name: currentUserData?.name || "나",
                    age: currentUserData?.age || 0,
                    occupation: currentUserData?.occupation || "",
                  }
                : {
                    id: partnerData?.id || partnerId,
                    name: partnerData?.name || "알수없음",
                    age: partnerData?.age || 0,
                    occupation: partnerData?.occupation || "",
                  },
            user2:
              item.user2_id === userId
                ? {
                    id: currentUserData?.id || userId,
                    name: currentUserData?.name || "나",
                    age: currentUserData?.age || 0,
                    occupation: currentUserData?.occupation || "",
                  }
                : {
                    id: partnerData?.id || partnerId,
                    name: partnerData?.name || "알수없음",
                    age: partnerData?.age || 0,
                    occupation: partnerData?.occupation || "",
                  },
          };

          matchesWithUserDetails.push(match);
        } catch (itemError) {
          console.error(`❌ 매칭 항목 처리 에러 (ID: ${item.id}):`, itemError);
          // 개별 매칭 에러는 무시하고 계속 진행
        }
      }

      return matchesWithUserDetails;
    } catch (error) {
      console.error("❌ getUserMatches 전체 에러:", error);
      return [];
    }
  },

  async updateAiInsights(matchId, insights): Promise<void> {
    const { error } = await supabase
      .from("matches")
      .update({
        ai_insights: insights,
      })
      .eq("id", matchId);

    if (error) {
      console.error("Error updating match AI insights:", error);
      throw new Error("Failed to update match AI insights");
    }
  },
};
