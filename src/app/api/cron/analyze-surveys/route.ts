import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase-types";

// 보안을 위해 환경 변수에서 직접 가져옴
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET;

// 서버 측 Supabase 인스턴스 생성 (서비스 롤 키 사용)
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  // 보안 검증 - 이 엔드포인트는 Vercel Cron 또는 다른 스케줄러에서만 호출되어야 함
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. 최근 설문 데이터 가져오기
    const { data: surveys, error: surveysError } = await supabaseAdmin
      .from("user_surveys")
      .select(
        `
        id,
        user_id,
        survey_template_id,
        completed,
        completed_at,
        users (
          id,
          name,
          age,
          occupation
        ),
        user_responses (
          id,
          question_id,
          option_id
        )
      `
      )
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(100);

    if (surveysError) {
      throw new Error(`Error fetching surveys: ${surveysError.message}`);
    }

    // TODO: 여기에 Grok AI를 사용한 설문 분석 로직 구현
    // 설문 트렌드, 선호도 패턴 등을 분석할 수 있음

    // 2. 분석 결과를 기반으로 새로운 설문 템플릿 생성 또는 기존 템플릿 최적화
    // 이 예시에서는 단순히 로그만 남김
    console.log(`Analyzed ${surveys.length} completed surveys`);

    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${surveys.length} surveys`,
      lastRunAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Survey analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
