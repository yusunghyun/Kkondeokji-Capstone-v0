import { NextRequest, NextResponse } from "next/server";
import { getMatchRepo } from "@/core/infra/RepositoryFactory";
import { calculateRealMatch } from "@/core/services/RealMatchService";
import { generateEnhancedMatchReport } from "@/core/services/MatchService";
import { supabase } from "@/lib/supabase";

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

    console.log("🔄 매칭 완전 재계산 시작 - matchId:", matchId);

    // 1️⃣ 기존 매칭 데이터 조회
    const matchRepo = getMatchRepo();
    const existingMatch = await matchRepo.getById(matchId);

    if (!existingMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const { user1Id, user2Id } = existingMatch;
    console.log("👥 매칭 사용자:", { user1Id, user2Id });

    // 2️⃣ 기존 매칭 데이터 백업 (비교용)
    const previousMatch = {
      score: existingMatch.matchScore,
      commonTags: existingMatch.commonInterests?.tags || [],
      commonResponses: existingMatch.commonInterests?.responses || [],
      aiInsights: existingMatch.aiInsights,
    };

    console.log("💾 이전 매칭 데이터 백업:", {
      previousScore: previousMatch.score,
      previousTagsCount: previousMatch.commonTags.length,
      hasAiInsights: !!previousMatch.aiInsights,
    });

    // 3️⃣ Supabase에서 직접 기존 매칭 삭제
    console.log("🗑️ 기존 매칭 데이터 삭제");
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (deleteError) {
      console.error("❌ 기존 매칭 삭제 에러:", deleteError);
      throw new Error("기존 매칭을 삭제할 수 없습니다");
    }

    // 4️⃣ 새로운 매칭 계산
    console.log("🧮 새로운 매칭 계산 시작");
    const newMatchResult = await calculateRealMatch(user1Id, user2Id);

    // 5️⃣ 새로운 매칭 데이터 조회
    const newMatch = await matchRepo.getByUserIds(user1Id, user2Id);

    if (!newMatch) {
      throw new Error("새로운 매칭 데이터를 찾을 수 없습니다");
    }

    // 6️⃣ AI 기반 향상된 리포트 자동 생성
    console.log("🤖 AI 기반 향상된 리포트 자동 생성");
    await generateEnhancedMatchReport(newMatch.id);

    // 7️⃣ 최종 매칭 데이터 조회 (AI 리포트 포함)
    const finalMatch = await matchRepo.getById(newMatch.id);

    if (!finalMatch) {
      throw new Error("최종 매칭 데이터를 찾을 수 없습니다");
    }

    // 8️⃣ 변경사항 분석
    const changes = analyzeChanges(previousMatch, {
      score: finalMatch.matchScore,
      commonTags: finalMatch.commonInterests?.tags || [],
      commonResponses: finalMatch.commonInterests?.responses || [],
      aiInsights: finalMatch.aiInsights,
    });

    console.log("✅ 매칭 재계산 완료:", {
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
