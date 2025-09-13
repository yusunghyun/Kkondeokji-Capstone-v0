import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  getTrendingInterests,
  getKoreanInterestKeywords,
} from "@/shared/utils/interestTranslation";

// 계절 정보 가져오기
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "봄";
  if (month >= 6 && month <= 8) return "여름";
  if (month >= 9 && month <= 11) return "가을";
  return "겨울";
}

// 연령대 분류
function getAgeGroup(age?: number): string {
  if (!age) return "2030세대";
  if (age < 25) return "Z세대 (20대 초반)";
  if (age < 30) return "밀레니얼 (20대 후반)";
  if (age < 35) return "3030세대 (30대 초반)";
  return "3040세대";
}

// JSON 파싱 유틸리티
function parseSurveyResponse(text: string) {
  try {
    // JSON 부분만 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 기본 구조 검증
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid survey structure");
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing survey response:", error);
    throw new Error("Failed to parse survey response");
  }
}

// 한국어 폴백 설문 생성
function generateKoreanFallbackSurvey(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
}): any {
  const ageGroup = getAgeGroup(userInfo.age);
  const currentSeason = getCurrentSeason();

  console.log("🔄 한국어 기본 설문으로 폴백:", ageGroup, currentSeason);

  return {
    title: `${userInfo.name || "당신"}을 위한 맞춤 설문`,
    description: "AI가 생성한 개인 맞춤형 한국어 설문조사",
    questions: [
      {
        text: "요즘 가장 즐겨보는 콘텐츠는?",
        category: "엔터테인먼트",
        weight: 3,
        options: [
          { text: "매우 좋아함", value: "content_love", icon: "😍" },
          { text: "좋아함", value: "content_like", icon: "😊" },
          { text: "보통", value: "content_neutral", icon: "😐" },
          { text: "관심 없음", value: "content_dislike", icon: "😑" },
        ],
      },
      {
        text: `${currentSeason}에 가장 하고 싶은 활동은?`,
        category: "계절활동",
        weight: 2,
        options: [
          { text: "매우 좋아함", value: "seasonal_love", icon: "🌟" },
          { text: "좋아함", value: "seasonal_like", icon: "👍" },
          { text: "보통", value: "seasonal_neutral", icon: "😐" },
          { text: "관심 없음", value: "seasonal_dislike", icon: "👎" },
        ],
      },
      {
        text: "주말 데이트로 가장 선호하는 장소는?",
        category: "데이트",
        weight: 3,
        options: [
          { text: "매우 좋아함", value: "date_love", icon: "💕" },
          { text: "좋아함", value: "date_like", icon: "❤️" },
          { text: "보통", value: "date_neutral", icon: "😐" },
          { text: "관심 없음", value: "date_dislike", icon: "😑" },
        ],
      },
      {
        text: "카페에서 주로 마시는 음료는?",
        category: "음식",
        weight: 2,
        options: [
          { text: "매우 좋아함", value: "drink_love", icon: "☕" },
          { text: "좋아함", value: "drink_like", icon: "🥤" },
          { text: "보통", value: "drink_neutral", icon: "😐" },
          { text: "관심 없음", value: "drink_dislike", icon: "😑" },
        ],
      },
      {
        text: "운동이나 액티비티에 대한 관심도는?",
        category: "운동",
        weight: 2,
        options: [
          { text: "매우 좋아함", value: "exercise_love", icon: "💪" },
          { text: "좋아함", value: "exercise_like", icon: "🏃" },
          { text: "보통", value: "exercise_neutral", icon: "😐" },
          { text: "관심 없음", value: "exercise_dislike", icon: "😴" },
        ],
      },
      {
        text: "여행을 계획할 때 가장 중요한 요소는?",
        category: "여행",
        weight: 2,
        options: [
          { text: "매우 중요함", value: "travel_love", icon: "✈️" },
          { text: "중요함", value: "travel_like", icon: "🗺️" },
          { text: "보통", value: "travel_neutral", icon: "😐" },
          { text: "중요하지 않음", value: "travel_dislike", icon: "😑" },
        ],
      },
      {
        text: "새로운 사람과 만날 때 선호하는 분위기는?",
        category: "소통",
        weight: 3,
        options: [
          { text: "매우 선호함", value: "meeting_love", icon: "🤝" },
          { text: "선호함", value: "meeting_like", icon: "😊" },
          { text: "보통", value: "meeting_neutral", icon: "😐" },
          { text: "선호하지 않음", value: "meeting_dislike", icon: "😑" },
        ],
      },
      {
        text: "MBTI가 실제 성격을 잘 나타낸다고 생각하나요?",
        category: "성격",
        weight: 1,
        options: [
          { text: "매우 그렇다", value: "mbti_love", icon: "🎯" },
          { text: "그렇다", value: "mbti_like", icon: "👍" },
          { text: "보통", value: "mbti_neutral", icon: "😐" },
          { text: "그렇지 않다", value: "mbti_dislike", icon: "👎" },
        ],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, age, occupation, otherUserId } = body;

    console.log("🤖 서버에서 AI 기반 한국어 설문 생성 시작:", {
      name,
      age,
      occupation,
    });

    // 환경변수에서 API 키 확인 (서버 사이드에서만 접근 가능)
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("🔑 OpenAI API Key 상태:", apiKey ? "✅ 설정됨" : "❌ 없음");

    if (!apiKey) {
      console.log("🔄 API 키가 없어 폴백 설문 사용");
      const fallbackSurvey = generateKoreanFallbackSurvey({
        name,
        age,
        occupation,
      });
      return NextResponse.json(fallbackSurvey);
    }

    // 한국어 기반 트렌드 관심사 가져오기
    const trendingInterests = getTrendingInterests();
    const currentSeason = getCurrentSeason();
    const ageGroup = getAgeGroup(age);

    const prompt = `당신은 한국의 젊은 세대를 위한 매칭 설문 전문가입니다. 다음 사용자를 위한 **완전 한국어 기반** 개인 맞춤 설문조사를 생성해주세요.

**사용자 정보:**
- 이름: ${name || "사용자"}
- 나이: ${age || "미상"}세 (${ageGroup})
- 직업: ${occupation || "미상"}

**현재 트렌드:** ${trendingInterests.slice(0, 10).join(", ")}
**계절/시기:** ${currentSeason}

**🎯 중요: 질문과 답변의 일치성을 반드시 지켜주세요!**

**질문 유형별 가이드라인:**

**1️⃣ 관심도/선호도 질문** → 감정 기반 답변
✅ 좋은 예시:
- "웹툰에 대한 관심도는 어느 정도인가요?"
- "K-POP 음악을 얼마나 좋아하시나요?"
- "운동에 대해 어떻게 생각하시나요?"
→ 답변: 매우좋아함/좋아함/보통/관심없음

**2️⃣ 선택형 질문** → 구체적인 선택지
✅ 좋은 예시:
- "요즘 가장 즐겨보는 장르는?"
- "주말에 가장 하고 싶은 활동은?"
- "선호하는 카페 음료는?"
→ 답변: 구체적인 옵션들 (드라마/예능/웹툰/영화 등)

**❌ 절대 피해야 할 잘못된 예시:**
- "최근 웹툰 중 제일 좋았던 것은?" → 매우좋아함/좋아함/보통/관심없음 (❌ 질문-답변 불일치)
- "어떤 드라마를 보시나요?" → 매우좋아함/좋아함/보통/관심없음 (❌ 질문-답변 불일치)

**설문 생성 원칙:**
1. ✅ **100% 한국어**: 모든 텍스트를 자연스러운 한국어로
2. ✅ **MZ세대 친화적**: 요즘 트렌드와 문화 반영
3. ✅ **질문-답변 일치**: 질문 형태에 맞는 답변 형태 사용
4. ✅ **실용적 매칭**: 실제 만남에서 대화 소재가 될 주제
5. ✅ **지역/나이별 맞춤**: ${ageGroup}에 적합한 주제

**질문 영역 (8개 문항):**
- 엔터테인먼트 (드라마, 예능, 웹툰, 유튜브)
- 라이프스타일 (운동, 카페, 취미)
- 음식/카페 (맛집, 디저트, 음료)
- 여가활동 (여행, 쇼핑, 문화생활)
- 성격/가치관 (MBTI, 연애관, 인생관)
- 지역/장소 (동네, 핫플레이스)
- 계절 트렌드 (${currentSeason} 특별 주제)
- 소통 스타일 (대화 방식, 만남 선호)

**출력 형식 (JSON):**
{
  "title": "당신만의 매칭 설문조사",
  "description": "AI가 생성한 맞춤형 한국어 설문",
  "questions": [
    {
      "text": "웹툰에 대한 관심도는 어느 정도인가요?",
      "category": "엔터테인먼트",
      "weight": 3,
      "type": "interest_level",
      "options": [
        {"text": "매우 좋아함", "value": "webtoon_love", "icon": "😍"},
        {"text": "좋아함", "value": "webtoon_like", "icon": "😊"},
        {"text": "보통", "value": "webtoon_neutral", "icon": "😐"},
        {"text": "관심 없음", "value": "webtoon_dislike", "icon": "😑"}
      ]
    },
    {
      "text": "주말에 가장 하고 싶은 활동은?",
      "category": "라이프스타일",
      "weight": 2,
      "type": "choice",
      "options": [
        {"text": "카페 투어", "value": "cafe_tour", "icon": "☕"},
        {"text": "운동/헬스", "value": "exercise", "icon": "💪"},
        {"text": "영화 감상", "value": "movie_watching", "icon": "🎬"},
        {"text": "집에서 휴식", "value": "home_rest", "icon": "🏠"}
      ]
    }
  ]
}

**구체적인 질문 예시:**

**관심도 질문들:**
- "${currentSeason} 드라마에 대한 관심도는?"
- "K-POP 음악을 얼마나 좋아하시나요?"
- "운동에 대해 어떻게 생각하시나요?"
- "카페 문화에 대한 관심은?"
- "여행에 대해 어떻게 생각하시나요?"

**선택형 질문들:**
- "요즘 가장 즐겨보는 콘텐츠 장르는?"
- "주말 데이트로 선호하는 장소는?"
- "카페에서 주로 주문하는 음료는?"
- "새로운 사람과 만날 때 편한 장소는?"
- "${currentSeason}에 가장 하고 싶은 야외활동은?"

**중요:** 각 질문마다 type 필드를 반드시 포함하고, 질문 형태에 맞는 답변을 제공해주세요!
- type: "interest_level" → 관심도 질문 → 감정 기반 답변
- type: "choice" → 선택형 질문 → 구체적인 선택지

지금 당장 한국 ${ageGroup}들 사이에서 핫한 주제들로 **자연스럽고 일치하는 8개 질문**을 만들어주세요!`;

    console.log("🚀 OpenAI GPT-4o-mini로 한국어 설문 요청 중...");

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 2000,
      temperature: 0.8, // 창의성 향상
    });

    console.log("✅ AI 설문 생성 완료!");
    const result = parseSurveyResponse(text);

    console.log("📋 생성된 설문 미리보기:", {
      title: result?.title,
      questionCount: result?.questions?.length,
      sampleQuestion: result?.questions?.[0]?.text,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ AI 설문 생성 실패:", error);

    // 폴백 설문 제공
    const body = await request.json();
    const fallbackSurvey = generateKoreanFallbackSurvey(body);

    return NextResponse.json(fallbackSurvey);
  }
}
