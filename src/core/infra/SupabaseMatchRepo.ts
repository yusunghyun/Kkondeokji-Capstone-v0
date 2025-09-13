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

  async getUserMatches(userId): Promise<Match[]> {
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
      console.error("Error fetching user matches:", error);
      return [];
    }

    // 각 매치에 대해 사용자 정보를 별도로 가져오기
    const matchesWithUsers = await Promise.all(
      data.map(async (item) => {
        // user1 정보 가져오기
        const { data: user1Data } = await supabase
          .from("users")
          .select("id, name, age, occupation")
          .eq("id", item.user1_id)
          .single();

        // user2 정보 가져오기
        const { data: user2Data } = await supabase
          .from("users")
          .select("id, name, age, occupation")
          .eq("id", item.user2_id)
          .single();

        return {
          id: item.id,
          user1Id: item.user1_id,
          user2Id: item.user2_id,
          matchScore: item.match_score,
          commonInterests: item.common_interests as {
            tags: string[];
            responses: Array<{ question: string; answer: string }>;
          } | null,
          aiInsights: item.ai_insights,
          createdAt: new Date(item.created_at),
          user1: user1Data || undefined,
          user2: user2Data || undefined,
        };
      })
    );

    return matchesWithUsers;
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
