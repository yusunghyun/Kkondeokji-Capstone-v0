import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user1Responses, user2Responses } = body;

    console.log("🧠 서버에서 의미적 유사성 분석 시작");

    // 환경변수에서 API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log("🔄 API 키가 없어 기본 분석 반환");
      return NextResponse.json({
        semanticMatches: [],
        boostScore: 0,
      });
    }

    // 응답 데이터를 비교 가능한 형태로 변환
    const user1Text = user1Responses
      .map((r: any) => `질문: ${r.question}\n답변: ${r.answer}`)
      .join("\n\n");

    const user2Text = user2Responses
      .map((r: any) => `질문: ${r.question}\n답변: ${r.answer}`)
      .join("\n\n");

    const prompt = `당신은 한국 문화와 트렌드에 정통한 매칭 전문가입니다. 두 사용자의 설문 응답을 분석하여 **숨겨진 공통점과 의미적 유사성**을 찾아주세요.

**사용자 1의 응답:**
${user1Text}

**사용자 2의 응답:**
${user2Text}

다음 기준으로 의미적 유사성을 분석해주세요:

1. **카테고리별 연결점 찾기:**
   - 엔터테인먼트: 드라마, 예능, 영화, OTT 콘텐츠 등
   - 운동/건강: 모든 형태의 신체 활동 및 건강 관리
   - 음식/문화: 외식, 카페, 요리, 맛집 탐방 등
   - 라이프스타일: 독서, 음악, 게임, 취미 활동 등

2. **세대/트렌드별 연결:**
   - 현재 인기 있는 콘텐츠나 활동
   - 같은 세대가 공감할 수 있는 문화적 요소
   - 계절이나 시기적 특성을 고려한 활동

3. **가치관/성향 연결:**
   - 활동의 성격 (사교적/개인적, 실내/야외 등)
   - 선호하는 분위기나 환경
   - 라이프스타일의 패턴

**출력 형식 (JSON):**
{
  "semanticMatches": [
    {
      "user1Answer": "첫번째 사용자 답변",
      "user2Answer": "두번째 사용자 답변", 
      "commonCategories": ["공통 카테고리1", "공통 카테고리2"],
      "similarity": 75,
      "explanation": "두 답변이 어떻게 연결되는지에 대한 자연스러운 설명"
    }
  ],
  "boostScore": 15
}

- similarity: 0-100 점수 (높을수록 유사)
- boostScore: 전체 매칭 점수에 추가할 보너스 점수 (0-20)
- 매칭이 전혀 없으면 빈 배열과 0점 반환

**중요:** 억지로 연결하지 말고, 정말 의미있는 공통점만 찾아주세요. 자연스럽고 납득할 만한 연결점을 제시해주세요.`;

    console.log("🚀 OpenAI GPT-4o-mini로 의미적 유사성 분석 중...");

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 1000,
      temperature: 0.3,
    });

    console.log("✅ AI 의미적 유사성 분석 완료!");

    try {
      const result = JSON.parse(text.trim());

      // 결과 검증
      if (!result.semanticMatches || !Array.isArray(result.semanticMatches)) {
        throw new Error("잘못된 응답 형식");
      }

      // boostScore 범위 제한 (0-20)
      result.boostScore = Math.max(0, Math.min(20, result.boostScore || 0));

      console.log("📊 의미적 매칭 결과:", {
        매칭수: result.semanticMatches.length,
        보너스점수: result.boostScore,
      });

      return NextResponse.json(result);
    } catch (parseError) {
      console.error("JSON 파싱 실패:", parseError);
      return NextResponse.json({
        semanticMatches: [],
        boostScore: 0,
      });
    }
  } catch (error) {
    console.error("❌ 의미적 유사성 분석 실패:", error);
    return NextResponse.json({
      semanticMatches: [],
      boostScore: 0,
    });
  }
}
