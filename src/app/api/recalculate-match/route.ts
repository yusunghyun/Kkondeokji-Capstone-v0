import { NextRequest, NextResponse } from "next/server";
import { calculateRealMatch } from "@/core/services/RealMatchService";
import { generateEnhancedMatchReport } from "@/core/services/MatchService";
import { createClient } from "@supabase/supabase-js";

// 서버용 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    console.log("🔄 [STEP 1] 매칭 완전 재계산 시작 - matchId:", matchId);

    // 1️⃣ 기존 매칭 데이터 조회 (서버용 supabase로 직접 조회)
    let existingMatch;
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (error) {
        console.error("❌ [STEP 1] 기존 매칭 조회 실패:", error);
        return NextResponse.json(
          {
            error: "기존 매칭 데이터를 조회할 수 없습니다",
            details: error.message,
          },
          { status: 500 }
        );
      }

      if (!data) {
        console.error("❌ [STEP 1] 매칭 데이터 없음");
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }

      // 데이터 변환
      existingMatch = {
        id: data.id,
        user1Id: data.user1_id,
        user2Id: data.user2_id,
        matchScore: data.match_score,
        commonInterests: data.common_interests as {
          tags: string[];
          responses: { question: string; answer: string }[];
        } | null,
        aiInsights: data.ai_insights || "",
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error("❌ [STEP 1] 기존 매칭 조회 실패:", error);
      return NextResponse.json(
        {
          error: "기존 매칭 데이터를 조회할 수 없습니다",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    const { user1Id, user2Id } = existingMatch;
    console.log("👥 [STEP 2] 매칭 사용자:", { user1Id, user2Id });

    // 2️⃣ 기존 매칭 데이터 백업 (비교용)
    const previousMatch = {
      score: existingMatch.matchScore,
      commonTags: existingMatch.commonInterests?.tags || [],
      commonResponses: existingMatch.commonInterests?.responses || [],
      aiInsights: existingMatch.aiInsights,
    };

    console.log("💾 [STEP 3] 이전 매칭 데이터 백업:", {
      previousScore: previousMatch.score,
      previousTagsCount: previousMatch.commonTags.length,
      hasAiInsights: !!previousMatch.aiInsights,
    });

    // 3️⃣ Supabase에서 직접 기존 매칭 삭제
    console.log("🗑️ [STEP 4] 기존 매칭 데이터 삭제");
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (deleteError) {
      console.error("❌ [STEP 4] 기존 매칭 삭제 에러:", deleteError);
      return NextResponse.json(
        {
          error: "기존 매칭을 삭제할 수 없습니다",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    // 4️⃣ 새로운 매칭 계산
    console.log("🧮 [STEP 5] 새로운 매칭 계산 시작");
    let newMatchResult;
    try {
      newMatchResult = await calculateRealMatch(user1Id, user2Id);
      console.log("✅ [STEP 5] 매칭 계산 완료:", newMatchResult);
    } catch (error) {
      console.error("❌ [STEP 5] 매칭 계산 실패:", error);
      console.error("❌ [STEP 5] 에러 상세:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        {
          error: "매칭 계산 중 오류가 발생했습니다",
          details: error instanceof Error ? error.message : String(error),
          step: "calculateRealMatch",
        },
        { status: 500 }
      );
    }

    // 5️⃣ 새로운 매칭 데이터 조회 (서버용 supabase로 직접 조회)
    console.log("🔍 [STEP 6] 새로운 매칭 데이터 조회");
    const [sortedUser1Id, sortedUser2Id] = [user1Id, user2Id].sort();

    const { data: newMatchData, error: newMatchError } = await supabase
      .from("matches")
      .select("*")
      .eq("user1_id", sortedUser1Id)
      .eq("user2_id", sortedUser2Id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (newMatchError || !newMatchData) {
      console.error("❌ [STEP 6] 새로운 매칭 데이터 없음:", newMatchError);
      return NextResponse.json(
        { error: "새로운 매칭 데이터를 찾을 수 없습니다" },
        { status: 500 }
      );
    }

    const newMatch = {
      id: newMatchData.id,
      user1Id: newMatchData.user1_id,
      user2Id: newMatchData.user2_id,
      matchScore: newMatchData.match_score,
      commonInterests: newMatchData.common_interests as {
        tags: string[];
        responses: { question: string; answer: string }[];
      } | null,
      aiInsights: newMatchData.ai_insights || "",
      createdAt: new Date(newMatchData.created_at),
    };

    console.log("✅ [STEP 6] 새로운 매칭 데이터 조회 완료:", newMatch.id);

    // 6️⃣ AI 기반 향상된 리포트 자동 생성
    console.log("🤖 [STEP 7] AI 기반 향상된 리포트 자동 생성");
    try {
      await generateEnhancedMatchReport(newMatch.id);
      console.log("✅ [STEP 7] AI 리포트 생성 완료");
    } catch (error) {
      console.error("⚠️ [STEP 7] AI 리포트 생성 실패 (계속 진행):", error);
      // AI 리포트 실패는 치명적이지 않으므로 계속 진행
    }

    // 7️⃣ 최종 매칭 데이터 조회 (AI 리포트 포함, 서버용 supabase로 직접 조회)
    console.log("🔍 [STEP 8] 최종 매칭 데이터 조회");

    const { data: finalMatchData, error: finalMatchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", newMatch.id)
      .single();

    if (finalMatchError || !finalMatchData) {
      console.error("❌ [STEP 8] 최종 매칭 데이터 없음:", finalMatchError);
      return NextResponse.json(
        { error: "최종 매칭 데이터를 찾을 수 없습니다" },
        { status: 500 }
      );
    }

    const finalMatch = {
      id: finalMatchData.id,
      user1Id: finalMatchData.user1_id,
      user2Id: finalMatchData.user2_id,
      matchScore: finalMatchData.match_score,
      commonInterests: finalMatchData.common_interests as {
        tags: string[];
        responses: { question: string; answer: string }[];
      } | null,
      aiInsights: finalMatchData.ai_insights || "",
      createdAt: new Date(finalMatchData.created_at),
    };

    console.log("✅ [STEP 8] 최종 매칭 데이터 조회 완료");

    // 8️⃣ 변경사항 분석
    console.log("📊 [STEP 9] 변경사항 분석");
    const changes = analyzeChanges(previousMatch, {
      score: finalMatch.matchScore,
      commonTags: finalMatch.commonInterests?.tags || [],
      commonResponses: finalMatch.commonInterests?.responses || [],
      aiInsights: finalMatch.aiInsights,
    });

    console.log("✅ [STEP 9] 매칭 재계산 완료:", {
      newScore: finalMatch.matchScore,
      newTagsCount: finalMatch.commonInterests?.tags?.length || 0,
      changes,
    });

    return NextResponse.json({
      success: true,
      matchId: finalMatch.id,
      previousMatch,
      newMatch: {
        score: finalMatch.matchScore,
        commonTags: finalMatch.commonInterests?.tags || [],
        commonResponses: finalMatch.commonInterests?.responses || [],
        aiInsights: finalMatch.aiInsights,
      },
      changes,
      message: "매칭이 성공적으로 재계산되었습니다",
    });
  } catch (error) {
    console.error("❌ 매칭 재계산 실패:", error);
    return NextResponse.json(
      {
        error: "매칭 재계산 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 변경사항 분석 함수
function analyzeChanges(previous: any, current: any) {
  const changes = {
    scoreChanged: false,
    scoreDifference: 0,
    tagsAdded: 0,
    tagsRemoved: 0,
    newCommonResponses: 0,
    aiInsightsUpdated: false,
    significantChange: false,
  };

  // 점수 변화
  changes.scoreChanged = previous.score !== current.score;
  changes.scoreDifference = current.score - previous.score;

  // 태그 변화
  const previousTagsSet = new Set(previous.commonTags);
  const currentTagsSet = new Set(current.commonTags);

  changes.tagsAdded = current.commonTags.filter(
    (tag: string) => !previousTagsSet.has(tag)
  ).length;

  changes.tagsRemoved = previous.commonTags.filter(
    (tag: string) => !currentTagsSet.has(tag)
  ).length;

  // 공통 응답 변화
  changes.newCommonResponses =
    current.commonResponses.length - previous.commonResponses.length;

  // AI 인사이트 업데이트
  changes.aiInsightsUpdated = previous.aiInsights !== current.aiInsights;

  // 중요한 변화인지 판단
  changes.significantChange =
    Math.abs(changes.scoreDifference) >= 5 ||
    changes.tagsAdded > 0 ||
    changes.tagsRemoved > 0 ||
    changes.newCommonResponses !== 0;

  return changes;
}
