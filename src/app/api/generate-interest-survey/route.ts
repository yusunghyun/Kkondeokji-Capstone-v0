import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      partnerInterests,
      partnerName = "상대방",
      currentUserName = "당신",
    } = body;

    console.log("🎯 상대방 관심사 기반 설문 생성 시작");

    // 환경변수에서 API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log("🔄 API 키가 없어 기본 설문 반환");
      return NextResponse.json({
        surveyQuestions: generateFallbackSurvey(partnerInterests, partnerName),
      });
    }

    // 관심사 목록을 텍스트로 변환
    const interestsText =
      Array.isArray(partnerInterests) && partnerInterests.length > 0
        ? partnerInterests.join(", ")
        : "일반적인 취미와 관심사";

    console.log("📝 관심사 텍스트 변환 결과:", {
      원본: partnerInterests,
      변환됨: interestsText,
      길이: partnerInterests?.length || 0,
    });

    const prompt = `당신은 한국의 매칭 플랫폼 전문가입니다. ${partnerName}님의 관심사에 대해 ${currentUserName}님에게 **직접적이고 구체적으로** 물어보는 설문 3-5개를 만들어주세요.

**🎯 핵심 목표: ${partnerName}님의 관심사에 대한 ${currentUserName}님의 관심도와 경험을 정확히 파악하는 설문 생성**

**${partnerName}님의 관심사:**
${interestsText}

**📝 설문 생성 가이드라인:**

1️⃣ **직접적인 질문 작성법 (필수)**:
   - ❌ 나쁜 예: "${partnerName}님이 좋아하는 활동에 대해 어떻게 생각하세요?" (너무 모호함)
   - ❌ 나쁜 예: "취미가 무엇인가요?" (상대방 관심사와 무관함)
   - ✅ 좋은 예: "${partnerName}님이 좋아하는 '논문 리뷰'를 해본 적 있나요?" (구체적)
   - ✅ 좋은 예: "'러닝'을 얼마나 자주 하시나요?" (빈도 질문)
   - ✅ 좋은 예: "'EDM 페스티벌'에 가본 적 있나요?" (경험 질문)

2️⃣ **카테고리 설정 (필수)**:
   - 카테고리는 반드시 ${partnerName}님의 실제 관심사 단어를 그대로 사용
   - ❌ 나쁜 예: category: "운동" (너무 일반적)
   - ✅ 좋은 예: category: "러닝" (구체적 관심사)
   - ✅ 좋은 예: category: "논문 리뷰" (정확한 관심사)

3️⃣ **답변 옵션 유형별 가이드 (필수)**:
   - **경험/빈도형 질문**:
     ["자주 해요", "가끔 해요", "해본 적 있어요", "관심 없어요"]
   
   - **선호도형 질문**:
     ["매우 좋아해요", "좋아해요", "보통이에요", "별로예요"]
   
   - **경험/관심형 질문**:
     ["네, 관심있어요", "한 번 해보고 싶어요", "잘 모르겠어요", "별로예요"]
   
   - **구체적 선택형 질문**:
     [관심사 관련 구체적 선택지 4개]

4️⃣ **질문 유형 다양화 (권장)**:
   - 경험 질문: "~를 해보신 적 있나요?"
   - 빈도 질문: "~를 얼마나 자주 하시나요?"
   - 선호도 질문: "~에 대해 어떻게 생각하시나요?"
   - 구체적 선택 질문: "~중에서 가장 좋아하는 것은?"

아래 출력 형식을 꼭 따라주세요.

** 출력 형식 (JSON):**
{
  "surveyQuestions": [
    {
      "id": 1,
      "question": "질문 내용 (반드시 ${partnerName}님의 관심사 포함)",
      "category": "관심사 카테고리 (${partnerName}님의 실제 관심사)",
      "options": [
        { "text": "선택지1", "value": "value1" },
        { "text": "선택지2", "value": "value2" },
        { "text": "선택지3", "value": "value3" },
        { "text": "선택지4", "value": "value4" }
      ]
    }
  ]
}

**⚠️ 중요 규칙:**
- 반드시 3-4개의 질문만 생성 (간결하게)
- 모든 질문에 ${partnerName}님의 실제 관심사를 직접적으로 언급
- 친근하고 부담스럽지 않은 대화체 사용
- ${partnerName}님과의 대화 소재가 될 만한 실용적인 질문 작성
- 모든 사람이 쉽게 답할 수 있는 난이도 유지
${
  partnerInterests && partnerInterests.length > 0
    ? `- ${partnerName}님의 실제 관심사(${partnerInterests
        .slice(0, 3)
        .join(", ")})를 최우선적으로 활용`
    : `- 일반적인 관심사나 성향에 대한 질문도 좋음`
}

**📝 최종 체크리스트:**
- 모든 질문이 ${partnerName}님의 관심사를 직접 언급하는가?
- 카테고리가 ${partnerName}님의 실제 관심사와 일치하는가?
- 답변 옵션이 질문 유형에 적합한가?
- 질문이 자연스럽고 대화를 이끌어낼 수 있는가?
- 설문이 두 사람의 공통점을 찾는 데 도움이 되는가?

이 설문을 통해 ${currentUserName}님과 ${partnerName}님의 교집합을 찾아 더 의미있는 매칭이 될 수 있도록 도와주세요!`;

    console.log("🚀 OpenAI GPT-5-nano-2025-08-07로 관심사 설문 생성 중...");

    const { text } = await generateText({
      model: openai("gpt-5-nano-2025-08-07"),
      prompt,
      temperature: 1,
    });

    console.log("✅ AI 관심사 설문 생성 완료!");

    try {
      // AI 응답에서 ```json ... ``` 마크다운 제거
      let cleanedText = text.trim();

      // ```json으로 시작하면 제거
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7); // '```json' 제거
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3); // '```' 제거
      }

      // 끝의 ``` 제거
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }

      const result = JSON.parse(cleanedText.trim());

      // 결과 검증
      if (!result.surveyQuestions || !Array.isArray(result.surveyQuestions)) {
        throw new Error("잘못된 응답 형식");
      }

      console.log("📝 생성된 설문 문항수:", result.surveyQuestions.length);

      return NextResponse.json(result);
    } catch (parseError) {
      console.error("JSON 파싱 실패:", parseError);
      return NextResponse.json({
        surveyQuestions: generateFallbackSurvey(partnerInterests, partnerName),
      });
    }
  } catch (error) {
    console.error("❌ 관심사 설문 생성 실패:", error);
    const body = await request.json();
    const { partnerInterests, partnerName } = body;

    return NextResponse.json({
      surveyQuestions: generateFallbackSurvey(partnerInterests, partnerName),
    });
  }
}

// 폴백 설문 생성 함수
function generateFallbackSurvey(interests: string[], partnerName: string) {
  console.log("🔄 폴백 설문 생성 시작:", { interests, partnerName });

  // 관심사가 있는 경우와 없는 경우 다르게 처리
  const hasInterests = interests && interests.length > 0;
  const firstInterest = hasInterests ? interests[0] : "일상 활동";

  const baseQuestions = [
    {
      id: 1,
      question: hasInterests
        ? `${firstInterest}에 대한 관심도는 어느 정도인가요?`
        : `평소 여가 시간을 어떻게 보내시나요?`,
      category: hasInterests ? firstInterest : "여가활동",
      options: hasInterests
        ? [
            { text: "매우 좋아함", value: "very_like" },
            { text: "좋아함", value: "like" },
            { text: "보통", value: "neutral" },
            { text: "관심 없음", value: "not_interested" },
          ]
        : [
            { text: "집에서 편안하게", value: "home_relax" },
            { text: "밖에서 활동적으로", value: "outdoor_active" },
            { text: "친구들과 함께", value: "with_friends" },
            { text: "혼자만의 시간", value: "alone_time" },
          ],
    },
    {
      id: 2,
      question: `${partnerName}님과 함께 하고 싶은 활동이 있다면?`,
      category: "함께하는 활동",
      options: [
        {
          text: hasInterests ? "같은 취미 공유하기" : "새로운 취미 찾기",
          value: "hobby_sharing",
        },
        { text: "새로운 곳 탐험하기", value: "exploration" },
        { text: "대화하며 서로 알아가기", value: "conversation" },
        { text: "천천히 생각해보기", value: "think_slowly" },
      ],
    },
    {
      id: 3,
      question: hasInterests
        ? `새로운 관심사를 배우는 것에 대해 어떻게 생각하시나요?`
        : `새로운 사람과의 만남에서 가장 중요하게 생각하는 것은?`,
      category: hasInterests ? "학습태도" : "만남의 가치관",
      options: hasInterests
        ? [
            { text: "항상 열려있어요", value: "always_open" },
            { text: "흥미로우면 도전해요", value: "if_interesting" },
            { text: "신중하게 고려해요", value: "carefully_consider" },
            { text: "기존 것에 집중해요", value: "focus_existing" },
          ]
        : [
            { text: "공통 관심사 발견", value: "common_interests" },
            { text: "편안한 대화 분위기", value: "comfortable_talk" },
            { text: "서로의 가치관 이해", value: "values_understanding" },
            { text: "자연스러운 교감", value: "natural_connection" },
          ],
    },
    {
      id: 4,
      question: hasInterests
        ? `주말에 주로 하는 활동은 무엇인가요?`
        : `스트레스를 해소하는 자신만의 방법이 있나요?`,
      category: hasInterests ? "주말활동" : "스트레스 관리",
      options: hasInterests
        ? [
            { text: "취미 활동", value: "hobby_activities" },
            { text: "사람들과 만나기", value: "meeting_people" },
            { text: "휴식과 재충전", value: "rest_recharge" },
            { text: "새로운 경험하기", value: "new_experiences" },
          ]
        : [
            { text: "운동이나 활동", value: "exercise_activity" },
            { text: "음악 듣기", value: "listening_music" },
            { text: "친구들과 수다", value: "chatting_friends" },
            { text: "혼자만의 시간", value: "me_time" },
          ],
    },
  ];

  // 3개만 선택해서 반환
  const selectedQuestions = baseQuestions.slice(0, 3);

  console.log("✅ 폴백 설문 생성 완료:", {
    questionsCount: selectedQuestions.length,
    hasInterests,
  });

  return selectedQuestions;
}
