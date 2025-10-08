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
          { text: "매우 좋아함", value: "drink_love", icon: "🥤" },
          { text: "좋아함", value: "drink_like", icon: "☕" },
          { text: "보통", value: "drink_neutral", icon: "😐" },
          { text: "관심 없음", value: "drink_dislike", icon: "😑" },
        ],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("AI_LoadAPIKeyError: OpenAI API key is missing");
    }
    console.log("🔑 OpenAI API Key 상태: ✅ 설정됨");

    // 요청 본문 파싱
    const body = await request.json();
    const { name, age, occupation, otherUserId, userId } = body;

    console.log("🤖 서버에서 AI 기반 한국어 설문 생성 시작:", {
      name,
      age,
      occupation,
      otherUserId,
      userId,
    });

    // 설문 유형 결정
    let surveyType = "NEW_USER"; // 기본값: 신규 사용자
    let userInterests = [];

    // 사용자 ID와 상대방 ID가 모두 있으면 QR 코드 스캔 케이스
    if (userId && otherUserId) {
      surveyType = "QR_SCAN";
      console.log("📱 QR 코드 스캔 기반 설문 생성");
    }
    // 사용자 ID만 있고 기존에 설문을 완료한 경우 기존 사용자의 추가 설문
    else if (userId) {
      // 서버 사이드에서 직접 Supabase 호출
      const { supabaseServer } = require("@/lib/supabase-server");

      // 사용자의 완료된 설문 확인
      const { data: userSurveys, error: surveysError } = await supabaseServer
        .from("user_surveys")
        .select("id")
        .eq("user_id", userId)
        .eq("completed", true);

      if (!surveysError && userSurveys && userSurveys.length > 0) {
        surveyType = "EXISTING_USER";
        console.log("🔄 기존 사용자 추가 설문 생성");

        // 사용자 프로필에서 관심사 가져오기
        const { data: userData, error: userError } = await supabaseServer
          .from("users")
          .select("interests")
          .eq("id", userId)
          .single();

        if (!userError && userData && userData.interests) {
          userInterests = userData.interests;
          console.log("✅ 기존 사용자 관심사 로드 완료:", userInterests.length);
        }
      } else {
        console.log("🆕 신규 사용자 첫 설문 생성");
      }
    }

    console.log("🏷️ 설문 유형:", surveyType);

    // 폴백 설문 준비 (AI 실패 시 사용)
    const fallbackSurvey = generateKoreanFallbackSurvey({
      name,
      age,
      occupation,
    });
    if (!OPENAI_API_KEY) {
      console.log("🔑 OpenAI API Key 없음, 폴백 설문 사용");
      return NextResponse.json(fallbackSurvey);
    }

    // 상대방 정보 가져오기 (있는 경우)
    let partnerInfo = null;
    let partnerInterests = [];

    if (otherUserId) {
      try {
        // 서버 사이드에서 직접 Supabase 호출
        const { supabaseServer } = require("@/lib/supabase-server");

        // 1. 상대방 기본 정보 가져오기
        const { data: userData, error: userError } = await supabaseServer
          .from("users")
          .select("name, age, occupation, interests")
          .eq("id", otherUserId)
          .single();

        if (userError) {
          console.error("❌ 상대방 정보 조회 실패:", userError);
        } else if (userData) {
          partnerInfo = {
            name: userData.name,
            age: userData.age,
            occupation: userData.occupation,
          };

          partnerInterests = userData.interests || [];
          console.log("✅ 상대방 정보 조회 성공:", {
            name: userData.name,
            interestsCount: partnerInterests.length,
          });
        }
      } catch (error) {
        console.error("❌ 상대방 정보 조회 중 오류:", error);
      }
    }

    // 한국어 기반 트렌드 관심사 가져오기
    const trendingInterests = getTrendingInterests();
    const currentSeason = getCurrentSeason();
    const ageGroup = getAgeGroup(age);

    // 2025년 트렌드 키워드 (미래지향적)
    const trends2025 = [
      "AI 개인비서",
      "메타버스",
      "디지털 웰니스",
      "지속가능한 패션",
      "홈트레이닝",
      "가상여행",
      "디지털 디톡스",
      "마이크로 러닝",
      "로컬 푸드",
      "스마트홈",
      "웰빙 테크",
      "뉴트로",
      "워케이션",
    ];

    // 상황별 관심사 설정
    let interestsToInclude = [];

    switch (surveyType) {
      case "QR_SCAN":
        // QR 코드 스캔: 상대방 관심사 + 트렌드
        interestsToInclude = [
          ...partnerInterests.slice(0, 5),
          ...trendingInterests.slice(0, 3),
          ...trends2025.slice(0, 2),
        ];
        break;

      case "EXISTING_USER":
        // 기존 사용자: 기존 관심사 + 2025 트렌드
        interestsToInclude = [
          ...userInterests.slice(0, 3),
          ...trends2025.slice(0, 5),
          ...trendingInterests.slice(0, 2),
        ];
        break;

      default:
        // 신규 사용자: 트렌드 + 2025 트렌드
        interestsToInclude = [
          ...trendingInterests.slice(0, 5),
          ...trends2025.slice(0, 5),
        ];
    }

    // 상황별 맞춤형 프롬프트 생성
    let prompt = "";

    switch (surveyType) {
      case "QR_SCAN":
        // QR 코드 스캔 케이스 (상대방과 연결)
        prompt = `당신은 한국의 젊은 세대를 위한 매칭 설문 전문가입니다. 다음 사용자를 위한 **완전 한국어 기반** 개인 맞춤 설문조사를 생성해주세요.

**사용자 정보:**
- 이름: ${name || "사용자"}
- 나이: ${age || "미상"}세 (${ageGroup})
- 직업: ${occupation || "미상"}

**상대방 정보 (QR 코드 생성자):**
- 이름: ${partnerInfo?.name || "상대방"}
- 나이: ${partnerInfo?.age || "미상"}세
- 직업: ${partnerInfo?.occupation || "미상"}
- 관심사: ${partnerInterests.slice(0, 5).join(", ") || "정보 없음"}

**현재 트렌드:** ${interestsToInclude.join(", ")}
**계절/시기:** ${currentSeason}
**2025년 주목 키워드:** ${trends2025.slice(0, 5).join(", ")}

**중요: 이 사용자는 ${
          partnerInfo?.name || "상대방"
        }님의 QR 코드를 스캔한 사람입니다.**
- 두 사람의 직업(${occupation || "미상"} vs ${
          partnerInfo?.occupation || "미상"
        })을 고려한 질문을 포함하세요.
- 사용자의 나이(${age || "미상"}세)와 상대방의 나이(${
          partnerInfo?.age || "미상"
        }세)를 고려하세요.
- 상대방의 관심사(${
          partnerInterests.slice(0, 5).join(", ") || "정보 없음"
        })를 반영한 질문을 반드시 포함하세요.
- 두 사람의 공통점을 찾을 수 있는 질문을 최소 3개 이상 만들어주세요.
- 서로의 직업과 관련된 대화 주제가 될 만한 질문을 포함하세요.

**설문 생성 원칙:**
1. ✅ **100% 한국어**: 모든 텍스트를 자연스러운 한국어로
2. ✅ **MZ세대 친화적**: 요즘 트렌드와 문화 반영
3. ✅ **질문-답변 일치**: 질문 형태에 맞는 답변 형태 사용
4. ✅ **실용적 매칭**: 실제 만남에서 대화 소재가 될 주제
5. ✅ **연결 중심**: 두 사람의 연결점을 찾는 질문 중심`;
        break;

      case "EXISTING_USER":
        // 기존 사용자 케이스 (추가 설문)
        prompt = `당신은 한국의 젊은 세대를 위한 매칭 설문 전문가입니다. 다음 사용자를 위한 **완전 한국어 기반** 개인 맞춤 설문조사를 생성해주세요.

**사용자 정보:**
- 이름: ${name || "사용자"}
- 나이: ${age || "미상"}세 (${ageGroup})
- 직업: ${occupation || "미상"}
- 기존 관심사: ${userInterests.slice(0, 5).join(", ") || "정보 없음"}

**현재 트렌드:** ${interestsToInclude.join(", ")}
**계절/시기:** ${currentSeason}
**2025년 주목 키워드:** ${trends2025.slice(0, 5).join(", ")}

**중요: 이 사용자는 이미 설문을 완료한 기존 회원입니다.**
- 사용자의 기존 관심사(${
          userInterests.slice(0, 5).join(", ") || "정보 없음"
        })를 더 깊이 탐색하는 질문을 포함하세요.
- 2025년 트렌드와 관련된 새로운 관심사를 발견할 수 있는 질문을 포함하세요.
- 사용자의 직업(${
          occupation || "미상"
        })과 관련된 전문적인 관심사를 탐색하는 질문을 포함하세요.
- 기존 관심사를 바탕으로 더 구체적인 취향을 알아볼 수 있는 질문을 만들어주세요.
- 사용자가 새로운 취미나 활동에 도전할 의향이 있는지 탐색하는 질문을 포함하세요.

**설문 생성 원칙:**
1. ✅ **100% 한국어**: 모든 텍스트를 자연스러운 한국어로
2. ✅ **MZ세대 친화적**: 요즘 트렌드와 문화 반영
3. ✅ **질문-답변 일치**: 질문 형태에 맞는 답변 형태 사용
4. ✅ **심층 탐색**: 기존 관심사를 더 깊이 탐색하는 질문
5. ✅ **미래 지향적**: 2025년 트렌드를 반영한 새로운 관심사 탐색`;
        break;

      default:
        // 신규 사용자 케이스 (첫 설문)
        prompt = `당신은 한국의 젊은 세대를 위한 매칭 설문 전문가입니다. 다음 사용자를 위한 **완전 한국어 기반** 개인 맞춤 설문조사를 생성해주세요.

**사용자 정보:**
- 이름: ${name || "사용자"}
- 나이: ${age || "미상"}세 (${ageGroup})
- 직업: ${occupation || "미상"}

**현재 트렌드:** ${interestsToInclude.join(", ")}
**계절/시기:** ${currentSeason}
**2025년 주목 키워드:** ${trends2025.slice(0, 5).join(", ")}

**중요: 이 사용자는 처음 설문에 참여하는 신규 회원입니다.**
- 사용자의 나이(${age || "미상"}세)와 직업(${
          occupation || "미상"
        })을 고려한 맞춤형 질문을 만들어주세요.
- 2025년 트렌드와 관련된 관심사를 탐색하는 질문을 반드시 포함하세요.
- ${ageGroup}에게 인기 있는 활동과 관심사를 반영한 질문을 포함하세요.
- ${currentSeason} 시즌에 적합한 활동과 관련된 질문을 포함하세요.
- 사용자의 직업(${
          occupation || "미상"
        })과 관련된 취향이나 활동을 탐색하는 질문을 포함하세요.

**설문 생성 원칙:**
1. ✅ **100% 한국어**: 모든 텍스트를 자연스러운 한국어로
2. ✅ **MZ세대 친화적**: 요즘 트렌드와 문화 반영
3. ✅ **질문-답변 일치**: 질문 형태에 맞는 답변 형태 사용
4. ✅ **실용적 매칭**: 실제 만남에서 대화 소재가 될 주제
5. ✅ **미래 지향적**: 2025년 트렌드를 반영한 관심사 탐색`;
    }

    // 공통 프롬프트 부분 추가
    prompt += `

**🎯 중요: 질문과 답변의 일치성을 반드시 지켜주세요! 이것이 가장 중요합니다!**

**질문 유형별 가이드라인:**

**1️⃣ 관심도/선호도 질문** → 감정 기반 답변
✅ 좋은 예시:
- "웹툰을 얼마나 자주 보시나요?" → 매일/주 1-2회/거의 안 봄/전혀 안 봄
- "K-POP 음악에 대한 관심도는 어떠신가요?" → 매우 좋아함/좋아함/보통/관심 없음
- "운동하는 것을 좋아하시나요?" → 매우 좋아함/좋아함/보통/싫어함
→ 답변: 감정이나 빈도를 나타내는 선택지

**2️⃣ 선택형 질문** → 구체적인 선택지
✅ 좋은 예시:
- "주말에 가장 선호하는 활동은 무엇인가요?" → 영화 감상/운동/카페/독서
- "가장 좋아하는 음료 종류는?" → 아메리카노/라떼/에이드/차
- "선호하는 여행 스타일은?" → 계획형/즉흥형/휴양형/모험형
→ 답변: 구체적인 선택지들 (카테고리에 맞는 구체적 옵션들)

**❌ 절대 피해야 할 잘못된 예시 (이런 질문은 절대 생성하지 마세요):**
- "어떤 드라마를 좋아하세요?" → 매우 좋아함/좋아함/보통/관심 없음 (❌ 질문-답변 불일치)
- "어떤 음식을 좋아하시나요?" → 매우 좋아함/좋아함/보통/관심 없음 (❌ 질문-답변 불일치)
- "어떤 취미가 있으신가요?" → 매우 좋아함/좋아함/보통/관심 없음 (❌ 질문-답변 불일치)

**올바른 질문 형식:**
1. 관심도 질문은 "~에 대한 관심도는?" "~을 얼마나 좋아하세요?" 형태로 작성
2. 선택형 질문은 "가장 좋아하는 ~은?" "주로 어떤 ~을 선호하세요?" 형태로 작성
3. 모든 질문은 답변 옵션과 완벽하게 일치해야 함

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
      "text": "웹툰을 얼마나 자주 보시나요?",
      "category": "엔터테인먼트",
      "weight": 3,
      "type": "frequency",
      "options": [
        {"text": "매일 본다", "value": "daily", "icon": "🔥"},
        {"text": "주 2-3회", "value": "weekly", "icon": "📅"},
        {"text": "가끔", "value": "sometimes", "icon": "🕒"},
        {"text": "거의 안 본다", "value": "rarely", "icon": "❌"}
      ]
    },
    {
      "text": "주말에 가장 선호하는 활동은 무엇인가요?",
      "category": "라이프스타일",
      "weight": 2,
      "type": "choice",
      "options": [
        {"text": "카페 투어", "value": "cafe_tour", "icon": "☕"},
        {"text": "운동/헬스", "value": "exercise", "icon": "💪"},
        {"text": "영화 감상", "value": "movie_watching", "icon": "🎬"},
        {"text": "집에서 휴식", "value": "home_rest", "icon": "🏠"}
      ]
    },
    {
      "text": "K-POP 음악에 대한 관심도는 어떠신가요?",
      "category": "음악",
      "weight": 2,
      "type": "interest_level",
      "options": [
        {"text": "매우 좋아함", "value": "kpop_love", "icon": "😍"},
        {"text": "좋아함", "value": "kpop_like", "icon": "😊"},
        {"text": "보통", "value": "kpop_neutral", "icon": "😐"},
        {"text": "관심 없음", "value": "kpop_dislike", "icon": "😑"}
      ]
    }
  ]
}

**중요:** 각 질문마다 type 필드를 반드시 포함하고, 질문 형태에 맞는 답변을 제공해주세요!
- type: "interest_level" → 관심도 질문 → 매우 좋아함/좋아함/보통/관심 없음 같은 감정 기반 답변
- type: "frequency" → 빈도 질문 → 매일/주 2-3회/가끔/전혀 안함 같은 빈도 기반 답변
- type: "choice" → 선택형 질문 → 카페/영화/운동/독서 같은 구체적인 선택지
- type: "preference" → 선호도 질문 → 계획형/즉흥형, 실내/야외 같은 성향 기반 선택지

**질문과 답변의 일치성을 위한 최종 체크리스트:**
1. 관심도 질문에는 감정 기반 답변만 사용 (매우 좋아함/좋아함/보통/관심 없음)
2. 빈도 질문에는 빈도 기반 답변만 사용 (매일/주 2-3회/가끔/전혀 안함)
3. 선택형 질문에는 구체적인 선택지만 사용 (카페/영화/운동/독서)
4. "어떤 ~를 좋아하세요?"와 같은 질문에 감정 기반 답변을 사용하지 않음
5. 모든 질문은 명확하고 구체적으로 작성

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
