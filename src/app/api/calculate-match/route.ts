import { NextRequest, NextResponse } from "next/server";
import { calculateRealMatch } from "@/core/services/RealMatchService";
import { getMatchRepo } from "@/core/infra/RepositoryFactory";

/**
 * POST /api/calculate-match
 * 두 사용자 간의 매칭을 계산하고 DB에 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user1Id, user2Id } = body;

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { error: "user1Id and user2Id are required" },
        { status: 400 }
      );
    }

    console.log("🎯 [API] 매칭 계산 시작:", { user1Id, user2Id });

    // 1. 기존 매칭이 있는지 확인
    const matchRepo = getMatchRepo();
    let existingMatch = await matchRepo.getByUserIds(user1Id, user2Id);

    if (existingMatch) {
      console.log("✅ [API] 기존 매칭 발견:", {
        matchId: existingMatch.id,
        score: existingMatch.matchScore,
        user1Id,
        user2Id,
      });
      return NextResponse.json({
        success: true,
        matchId: existingMatch.id,
        score: existingMatch.matchScore,
        message: "기존 매칭을 반환합니다",
      });
    }

    // 2. 새로운 매칭 계산
    console.log("🔄 [API] 새로운 매칭 계산 시작:", { user1Id, user2Id });
    const matchResult = await calculateRealMatch(user1Id, user2Id);

    console.log("📊 [API] 매칭 계산 완료:", {
      user1Id,
      user2Id,
      score: matchResult.score,
      commonTagsCount: matchResult.commonTags.length,
      commonTags: matchResult.commonTags,
    });

    // 3. 매칭 결과를 DB에 저장
    console.log("💾 [API] 매칭 결과 DB 저장 시작:", {
      user1Id,
      user2Id,
      score: matchResult.score,
    });
    const matchId = await matchRepo.create({
      user1Id,
      user2Id,
      matchScore: matchResult.score,
      commonInterests: {
        tags: matchResult.commonTags,
        responses: matchResult.commonResponses,
      },
      aiInsights: matchResult.aiInsights || null,
      createdAt: new Date(),
    });

    console.log("✅ [API] 매칭 저장 완료:", {
      matchId,
      user1Id,
      user2Id,
      score: matchResult.score,
    });

    return NextResponse.json({
      success: true,
      matchId,
      score: matchResult.score,
      commonTags: matchResult.commonTags,
      message: "새로운 매칭이 생성되었습니다",
    });
  } catch (error) {
    console.error("❌ 매칭 계산 실패:", error);
    return NextResponse.json(
      {
        error: "매칭 계산 중 오류 발생",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
