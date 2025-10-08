import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * POST /api/save-user-interests
 * 설문 완료 후 필터링된 관심사만 사용자 프로필에 저장
 * (상대방 관심사나 감정 표현은 제외)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, interests } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    if (!interests || !Array.isArray(interests)) {
      return NextResponse.json(
        { error: "관심사 배열이 필요합니다" },
        { status: 400 }
      );
    }

    console.log("📝 [API] 사용자 관심사 저장 시작:", {
      userId,
      interestsCount: interests.length,
      interests,
      requestBody: body,
    });

    // 1. 기존 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabaseServer
      .from("users")
      .select("interests")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("❌ 프로필 조회 실패:", profileError);
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 2. 기존 관심사와 병합 (중복 제거)
    const existingInterests = profile?.interests || [];
    const updatedInterests = Array.from(
      new Set([...existingInterests, ...interests])
    );

    console.log("🏷️ [API] 관심사 업데이트:", {
      userId,
      기존관심사개수: existingInterests.length,
      기존관심사: existingInterests,
      추가관심사개수: interests.length,
      추가관심사: interests,
      최종관심사개수: updatedInterests.length,
      최종관심사: updatedInterests,
    });

    // 3. 프로필 업데이트
    const { error: updateError } = await supabaseServer
      .from("users")
      .update({
        interests: updatedInterests,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ 프로필 업데이트 실패:", updateError);
      return NextResponse.json(
        { error: "프로필 업데이트 실패", details: updateError.message },
        { status: 500 }
      );
    }

    console.log("✅ [API] 사용자 관심사 저장 완료:", {
      userId,
      최종관심사: updatedInterests,
    });

    return NextResponse.json({
      success: true,
      message: "관심사가 저장되었습니다",
      userId,
      addedInterests: interests.length,
      totalInterests: updatedInterests.length,
    });
  } catch (error) {
    console.error("❌ 관심사 저장 실패:", error);
    return NextResponse.json(
      {
        error: "관심사 저장 중 오류 발생",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
