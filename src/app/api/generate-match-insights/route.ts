import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user1Responses,
      user2Responses,
      matchScore,
      user1Name = "사용자 1",
      user2Name = "사용자 2",
    } = body;

    console.log("🤖 서버에서 매치 인사이트 생성 시작");

    // 환경변수에서 API 키 확인 (서버 사이드에서만 접근 가능)
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("🔑 OpenAI API Key 상태:", apiKey ? "✅ 설정됨" : "❌ 없음");

    if (!apiKey) {
      console.log("🔄 API 키가 없어 기본 인사이트 반환");
      return NextResponse.json({
        insights: `${user1Name}님과 ${user2Name}님의 매칭 점수는 ${matchScore}점입니다. 서로의 취향을 더 알아가며 대화해보세요!`,
      });
    }

    // 응답 데이터를 텍스트로 변환
    const user1Text = user1Responses
      .map((r: any) => `질문: ${r.question}\n답변: ${r.answer}`)
      .join("\n\n");

    const user2Text = user2Responses
      .map((r: any) => `질문: ${r.question}\n답변: ${r.answer}`)
      .join("\n\n");

    const prompt = `당신은 매칭 분석 전문가입니다. 두 사용자의 실제 응답만을 기반으로 간결한 인사이트를 제공하세요.

**${user1Name}님의 응답:**
${user1Text}

**${user2Name}님의 응답:**
${user2Text}

**매칭 점수:** ${matchScore}점

**중요 규칙:**
1. **실제 응답에서 발견된 내용만 언급** - "예를 들어", "만약", "~라면" 같은 가정적 표현 금지
2. **구체적인 공통점이나 차이점만 명시** - 위 응답에 없는 내용은 절대 추측하지 말 것
3. **2-3문장으로 매우 간결하게** - 핵심만 전달
4. **친근하고 긍정적인 톤** 유지

출력 형식 예시:
- "두 분 모두 [구체적 공통점]을 좋아하시네요. [간단한 한 줄 조언]"
- 또는 "서로 다른 [차이점]이 있지만, [긍정적 관점 한 줄]"

응답에 없는 내용은 절대 만들어내지 마세요. 실제 데이터만 사용하세요.`;

    console.log("🚀 OpenAI GPT-5-nano-2025-08-07로 매치 인사이트 요청 중...");

    const { text } = await generateText({
      model: openai("gpt-5-nano-2025-08-07"),
      prompt,
      temperature: 1,
    });

    console.log("✅ AI 매치 인사이트 생성 완료!");

    return NextResponse.json({
      insights: text.trim(),
    });
  } catch (error) {
    console.error("❌ AI 매치 인사이트 생성 실패:", error);
    const body = await request.json();
    const { matchScore, user1Name = "사용자 1", user2Name = "사용자 2" } = body;

    return NextResponse.json({
      insights: `${user1Name}님과 ${user2Name}님의 매칭 점수는 ${matchScore}점입니다. 서로 다른 관심사도 새로운 대화의 시작점이 될 수 있어요. 상대방의 취향에 대해 궁금한 점들을 물어보며 서로를 알아가보세요!`,
    });
  }
}
