import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase-types";

// 보안을 위해 환경 변수에서 직접 가져옴
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서버 측 Supabase 인스턴스 생성 (서비스 롤 키 사용)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey
);

export async function GET() {
  try {
    const supabaseAuthToken = cookies().get("sb-auth-token")?.value;

    if (!supabaseAuthToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 토큰 검증
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(supabaseAuthToken);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Grok API 통합 예시 (실제 구현은 API 키 및 호출 방식에 따라 다를 수 있음)
export async function POST(request: Request) {
  try {
    const supabaseAuthToken = cookies().get("sb-auth-token")?.value;

    if (!supabaseAuthToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 토큰 검증
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(supabaseAuthToken);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 요청 데이터 파싱
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 여기에 Grok API 호출 코드 구현
    // const grokResponse = await callGrokAPI(prompt, user.id)

    return NextResponse.json({
      message: "This is where you would call Grok AI with the prompt",
      userId: user.id,
      prompt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
