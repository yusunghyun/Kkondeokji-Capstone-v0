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

**🎯 분석 가이드라인:**

1️⃣ **카테고리별 연결점 찾기 (핵심):**
   - **엔터테인먼트**: 드라마, 예능, 영화, OTT 콘텐츠, 웹툰, 유튜브 등
   - **운동/건강**: 러닝, 헬스, 요가, 등산, 홈트레이닝, 스포츠 등
   - **음식/카페**: 맛집, 카페, 디저트, 요리, 음료 취향 등
   - **라이프스타일**: 독서, 음악, 게임, 취미, 패션, 뷰티, 여행 등
   - **디지털/기술**: AI, 메타버스, 스마트홈, 앱, 디지털 기기 등
   - **가치관/성향**: MBTI, 연애관, 인생관, 소통 방식, 취향 등

2️⃣ **의미적 연결 분석 (심층):**
   - **직접적 일치**: 동일한 취향/활동 (예: 둘 다 '등산' 좋아함)
   - **간접적 일치**: 같은 카테고리 내 유사 취향 (예: '넷플릭스'와 'OTT 시청')
   - **맥락적 일치**: 비슷한 맥락/환경 (예: '카페에서 독서'와 '조용한 장소 선호')
   - **가치관 일치**: 비슷한 가치관/태도 (예: '계획적인 여행'과 '체계적인 일처리')
   - **트렌드 일치**: 같은 트렌드에 관심 (예: 'AI 기술'과 '최신 기술 관심')

3️⃣ **유사성 점수 산정 기준:**
   - **90-100점**: 거의 동일한 관심사/취향 (예: 둘 다 '주 3회 러닝' + '같은 러닝 코스')
   - **70-89점**: 매우 유사한 관심사/취향 (예: '러닝'과 '마라톤 준비')
   - **50-69점**: 관련성 높은 관심사 (예: '넷플릭스 드라마'와 '티빙 드라마')
   - **30-49점**: 간접적 연관성 (예: '영화 감상'과 '팝콘 좋아함')
   - **10-29점**: 약한 연관성 (예: '야외 활동'과 '자연 사진')
   - **0-9점**: 의미 있는 연관성 없음

   아래 출력 형식을 꼭 따라주세요.
   
** 출력 형식 (JSON):**
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

**⚠️ 중요 규칙:**
1. **정직한 분석**: 억지로 연결하지 말고, 정말 의미있는 공통점만 찾아주세요.
2. **구체적 설명**: "둘 다 음악을 좋아함"보다 "둘 다 힙합 장르를 선호하며 특히 국내 아티스트에 관심이 있음"처럼 구체적으로.
3. **보너스 점수 산정**: 공통점 개수, 유사성 강도, 희소성을 고려해 0-20점 사이로 부여.
4. **한국 문화 맥락**: 한국적 맥락에서 의미 있는 연결점을 찾아주세요.
5. **실용적 매칭**: 실제 대화나 만남에서 활용할 수 있는 공통점을 우선시하세요.

**📝 최종 체크리스트:**
- 모든 응답을 꼼꼼히 분석했는가?
- 공통점이 구체적이고 의미 있는가?
- 유사성 점수가 기준에 맞게 부여되었는가?
- 보너스 점수가 적절한가? (0-20점)
- 설명이 자연스럽고 납득 가능한가?

이 분석을 통해 두 사용자가 더 깊은 대화와 교류를 나눌 수 있도록 도와주세요!`;

    console.log("🚀 OpenAI GPT-4o-mini로 의미적 유사성 분석 중...");

    const { text } = await generateText({
      model: openai("gpt-5-nano-2025-08-07"),
      prompt,
      temperature: 1,
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
