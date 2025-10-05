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

    const prompt = `당신은 한국의 젊은 세대를 위한 매칭 전문가입니다. 두 사용자의 설문 응답을 분석하여 깊이 있는 매칭 인사이트를 제공해주세요.

**${user1Name}님의 응답:**
${user1Text}

**${user2Name}님의 응답:**
${user2Text}

**매칭 점수:** ${matchScore}점

다음 관점에서 분석해주세요:

1. **공통점 발견**: 직접적인 공통점뿐만 아니라 숨겨진 연결고리도 찾아주세요
   - 같은 카테고리의 관심사나 활동
   - 비슷한 라이프스타일이나 가치관
   - 상호 보완적인 특성들

2. **성격 궁합**: 두 사람의 취향에서 보이는 성격적 특징
   - 공통된 성향이나 가치관
   - 서로를 보완할 수 있는 차이점

3. **관계 발전 가능성**: 이 매칭에서의 장기적 잠재력
   - 함께 즐길 수 있는 활동들
   - 서로에게 새로운 경험을 제공할 수 있는 부분

4. **대화 주제 제안**: 구체적이고 실용적인 대화 시작점
   - 공통 관심사를 바탕으로 한 자연스러운 대화 주제
   - 첫 만남에서 활용할 수 있는 아이스브레이커

**출력 형식:**
- 3-4문장으로 간결하게 작성
- 친근하고 따뜻한 톤으로 작성
- 구체적인 예시나 제안 포함
- 긍정적이지만 현실적인 조언

매칭 점수가 낮더라도 두 사람의 잠재적 연결점을 찾아 희망적인 메시지를 전달해주세요. 실제 사용자들이 서로에 대해 더 관심을 갖게 만드는 인사이트를 제공해주세요.`;

    console.log("🚀 OpenAI GPT-4o-mini로 매치 인사이트 요청 중...");

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 500,
      temperature: 0.7,
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
