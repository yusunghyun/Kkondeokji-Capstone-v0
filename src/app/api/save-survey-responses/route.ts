import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserRepo } from "@/core/infra/RepositoryFactory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, responses } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: "응답 데이터가 필요합니다" },
        { status: 400 }
      );
    }

    console.log("📝 설문 응답 저장 시작:", {
      userId,
      responsesCount: responses.length,
    });

    // 2. 사용자의 프로필에 interests 추가
    const userRepo = getUserRepo();
    const profile = await userRepo.getProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 3. 응답에서 category를 추출하여 interests에 추가
    const newInterests = responses
      .map((r: any) => r.category)
      .filter((c: string) => c && c.trim());

    const existingInterests = profile.interests || [];
    const updatedInterests = [
      ...new Set([...existingInterests, ...newInterests]),
    ];

    console.log("🏷️ 관심사 업데이트:", {
      기존: existingInterests.length,
      추가: newInterests.length,
      최종: updatedInterests.length,
    });

    // 4. 프로필 업데이트
    const { error: updateError } = await supabaseServer
      .from("users")
      .update({
        interests: updatedInterests,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ 프로필 업데이트 에러:", updateError);
      return NextResponse.json(
        { error: "프로필 업데이트 실패", details: updateError.message },
        { status: 500 }
      );
    }

    console.log("✅ 설문 응답 저장 및 프로필 업데이트 완료");

    return NextResponse.json({
      success: true,
      message: "설문 응답이 저장되었습니다",
      addedInterests: newInterests.length,
      totalInterests: updatedInterests.length,
    });
  } catch (error) {
    console.error("❌ 설문 응답 저장 실패:", error);
    return NextResponse.json(
      {
        error: "설문 응답 저장 중 오류 발생",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
