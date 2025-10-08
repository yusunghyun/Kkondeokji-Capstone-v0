import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  getTrendingInterests,
  getKoreanInterestKeywords,
} from "@/shared/utils/interestTranslation";

export async function generateSurveyWithOpenAI(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
  otherUserId?: string;
  userId?: string;
}): Promise<any> {
  console.log("🤖 클라이언트에서 설문 생성 API 호출:", userInfo);

  try {
    // 내부 API Route 호출 (보안 안전)
    const response = await fetch("/api/generate-survey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ 설문 생성 API 응답:", {
      hasTitle: !!result.title,
      hasQuestions: !!result.questions,
      questionCount: result.questions?.length,
      firstQuestion: result.questions?.[0]?.text,
    });

    if (!result || !result.questions || result.questions.length === 0) {
      throw new Error("설문 데이터가 올바르지 않습니다");
    }

    console.log("✅ 서버에서 설문 생성 완료!");
    console.log("📋 생성된 설문:", {
      title: result?.title,
      questionCount: result?.questions?.length,
      sampleQuestion: result?.questions?.[0]?.text,
    });

    return result;
  } catch (error) {
    console.error("❌ 설문 생성 API 호출 실패:", error);

    // 최종 폴백: 클라이언트 사이드 기본 설문
    return generateKoreanFallbackSurvey(userInfo);
  }
}

export async function generateMatchInsightsWithOpenAI(
  user1Responses: any[],
  user2Responses: any[]
) {
  const prompt = createMatchPrompt(user1Responses, user2Responses);

  try {
    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt,
      temperature: 0.7,
      maxTokens: 1000, // 토큰 수 줄여서 비용 절약
    });

    return parseMatchResponse(text);
  } catch (error) {
    console.error("Error generating match insights with OpenAI:", error);
    throw new Error("Failed to generate match insights");
  }
}

interface MatchInsightsInput {
  score: number;
  commonTags: string[];
  commonResponses: Array<{ question: string; answer: string }>;
}

export async function generatePersonalizedMatchInsights(
  user1Responses: any[],
  user2Responses: any[],
  matchScore: number,
  user1Name?: string,
  user2Name?: string
): Promise<string> {
  console.log("🤖 매치 인사이트 생성 API 호출");

  try {
    // 서버 환경에서는 절대 URL, 클라이언트에서는 상대 URL 사용
    const baseUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        : "";

    const response = await fetch(`${baseUrl}/api/generate-match-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user1Responses,
        user2Responses,
        matchScore,
        user1Name,
        user2Name,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const result = await response.json();

    console.log("✅ 서버에서 매치 인사이트 생성 완료!");
    return result.insights;
  } catch (error) {
    console.error("❌ 매치 인사이트 생성 API 호출 실패:", error);

    // 최종 폴백: 기본 인사이트 반환
    const fallbackInsight = `${user1Name || "당신"}님과 ${
      user2Name || "상대방"
    }님의 매칭 점수는 ${matchScore}점입니다. 서로 다른 관심사도 새로운 대화의 시작점이 될 수 있어요!`;

    return fallbackInsight;
  }
}

function generateBasicMatchInsights(matchData: MatchInsightsInput): string {
  const scoreMessage =
    matchData.score >= 80
      ? "매우 좋은"
      : matchData.score >= 60
      ? "좋은"
      : matchData.score >= 40
      ? "괜찮은"
      : "새로운";

  const commonTagsText =
    matchData.commonTags.length > 0
      ? `"${matchData.commonTags.slice(0, 3).join(", ")}" 등의 공통 관심사`
      : "서로 다른 매력적인 취향";

  return `📊 **${matchData.score}점의 ${scoreMessage} 매칭!**

💕 **공통점 분석**
${commonTagsText}를 가지고 계시네요! 이런 공통점들은 자연스러운 대화의 시작점이 될 거예요.

💬 **대화 시작하기**
${
  matchData.commonResponses.length > 0
    ? `"${matchData.commonResponses[0].answer}"에 대해 서로의 경험을 나눠보세요!`
    : "서로의 다른 취향에 대해 궁금한 점을 물어보는 것부터 시작해보세요!"
}

🌟 **관계 조언**
공통점은 친밀감의 기반이 되고, 차이점은 서로를 성장시키는 자극이 됩니다. 열린 마음으로 대화를 나누어보세요!`;
}

function createSurveyPrompt(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
  otherUserId?: string;
}) {
  const isMatching = !!userInfo.otherUserId;

  let prompt = `껀덕지(Geondeokji)는 "공통점"을 찾는 소셜 매칭 앱입니다. 사용자별로 개인화된 설문을 생성해주세요.`;

  if (userInfo.name || userInfo.age || userInfo.occupation) {
    prompt += ` 사용자 정보: `;
    if (userInfo.name) prompt += `이름 ${userInfo.name}, `;
    if (userInfo.age) prompt += `나이 ${userInfo.age}세, `;
    if (userInfo.occupation) prompt += `직업 ${userInfo.occupation}`;
    prompt = prompt.replace(/,$/, "");
  }

  prompt += `

다음 원칙에 따라 8개의 질문을 생성해주세요:

1. 질문 철학:
   - "신상"이 아닌 "취향" 중심: "요즘 빠진 콘텐츠/활동/도구/동네/책"
   - 세대 감수성 고려: 20대에 적합한 질문
   - 감정 스케일과 경험 단계 혼합

2. 필수 카테고리 (각 카테고리당 1-2개 질문):
   - 미디어 (드라마/예능/영화/유튜브)
   - 운동/헬스
   - 음악
   - 지역/동네
   - 독서/인문학
   - 작업/도구
   - 일상 루틴
   - 소셜 활동

3. 응답 표준화:
   - 각 질문마다 정확히 4개 선택지
   - 선택지는 구체적이고 매칭 가능한 태그로 구성
   - 태그는 영어 대문자로 표준화 (예: K_POP, NETFLIX_DRAMA, GANGNAM_GU)

4. 매칭 최적화:
   - 비슷한 응답을 한 사용자들이 매칭될 수 있도록 설계
   - 공통 관심사 발견이 쉬운 구조

JSON 형식으로 응답해주세요:
{
  "title": "개인화된 설문 제목",
  "description": "이 설문의 목적 설명",
  "questions": [
    {
      "text": "질문 텍스트",
      "weight": 1-3,
      "options": [
        {
          "text": "선택지 텍스트",
          "value": "STANDARDIZED_TAG",
          "icon": "이모지"
        }
      ]
    }
  ]
}

`;
  return prompt;
}

function createMatchPrompt(user1Responses: any[], user2Responses: any[]) {
  return `
두 사용자의 설문 응답을 분석하여 매칭 인사이트를 생성해주세요.

사용자 1 응답: ${JSON.stringify(user1Responses)}
사용자 2 응답: ${JSON.stringify(user2Responses)}

다음 형식으로 응답해주세요:
{
  "matchScore": 0-100,
  "commonInterests": ["공통 관심사1", "공통 관심사2"],
  "insights": "매칭에 대한 인사이트",
  "conversationStarters": ["대화 시작 문장1", "대화 시작 문장2"]
}
`;
}

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

function parseMatchResponse(text: string) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error parsing match response:", error);
    throw new Error("Failed to parse match response");
  }
}

interface EnhancedSurveyInput {
  userProfile: {
    name?: string;
    age?: number;
    occupation?: string;
    currentInterests: string[];
  };
  matchHistory?: {
    partnerInterests: string[];
    commonInterests: string[];
    matchScore: number;
  }[];
  surveyCount: number; // 기존 완료한 설문 수
}

export async function generateEnhancedPersonalizedSurvey(
  input: EnhancedSurveyInput
): Promise<any> {
  try {
    const trendingInterests = getTrendingInterests();
    const allKoreanInterests = getKoreanInterestKeywords();

    // 사용자의 현재 관심사와 겹치지 않는 새로운 관심사 발굴
    const unexploredInterests = allKoreanInterests.filter(
      (interest) => !input.userProfile.currentInterests.includes(interest)
    );

    // 매칭 파트너들의 관심사 중 사용자가 아직 탐색하지 않은 것들
    const partnerInfluencedInterests =
      input.matchHistory
        ?.flatMap((match) => match.partnerInterests)
        .filter(
          (interest) => !input.userProfile.currentInterests.includes(interest)
        ) || [];

    const prompt = `당신은 개인 맞춤형 관심사 발굴 전문가입니다. 다음 사용자를 위한 ${
      input.surveyCount >= 2 ? "3-5개의 심화" : "3-4개의"
    } 설문 질문을 한국어로 생성해주세요.

**사용자 정보:**
- 이름: ${input.userProfile.name || "사용자"}
- 나이: ${input.userProfile.age || "미상"}세  
- 직업: ${input.userProfile.occupation || "미상"}
- 기존 관심사: ${input.userProfile.currentInterests.join(", ") || "없음"}
- 완료한 설문 수: ${input.surveyCount}개

**매칭 이력:**
${
  input.matchHistory
    ?.map(
      (match) =>
        `- 매칭점수 ${
          match.matchScore
        }점, 공통관심사: ${match.commonInterests.join(
          ", "
        )}, 상대방관심사: ${match.partnerInterests.join(", ")}`
    )
    .join("\n") || "매칭 이력 없음"
}

**현재 트렌드 관심사:** ${trendingInterests.slice(0, 15).join(", ")}

**생성 규칙:**
1. 사용자의 기존 관심사와는 다르지만 관련성 있는 새로운 영역 탐색
2. 매칭 파트너의 관심사 중 흥미로울 만한 것들 포함 (${partnerInfluencedInterests
      .slice(0, 5)
      .join(", ")})
3. 현재 트렌드와 사용자 프로필에 맞는 시의적절한 주제
4. ${
      input.surveyCount >= 2
        ? "기존 설문보다 더 구체적이고 심화된 질문"
        : "접근하기 쉬운 질문"
    }
5. 각 질문마다 4개의 선택지 제공 (매우좋아함/좋아함/보통/관심없음)

**출력 형식 (JSON):**
{
  "questions": [
    {
      "text": "질문 내용",
      "category": "카테고리명",
      "options": [
        {"text": "매우 좋아함", "value": "매우좋아함", "weight": 3},
        {"text": "좋아함", "value": "좋아함", "weight": 2},
        {"text": "보통", "value": "보통", "weight": 1},
        {"text": "관심 없음", "value": "관심없음", "weight": 0}
      ],
      "interest_tags": ["추출될_관심사_키워드들"]
    }
  ]
}

**예시 질문들:**
- "최근 인기 있는 '웹툰 기반 드라마'에 대해 어떻게 생각하시나요?"
- "요즘 많이 하는 '홈 카페' 취미에 관심이 있으신가요?"
- "'인공지능 도구 활용'에 대한 관심도는 어느 정도인가요?"

실제 트렌드를 반영하고 사용자에게 새로운 관심사 발굴 기회를 제공하는 ${
      input.surveyCount >= 2 ? "3-5개" : "3-4개"
    }의 질문을 생성해주세요.`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 1500,
      temperature: 0.8, // 창의성 높임
    });

    return parseSurveyResponse(text);
  } catch (error) {
    console.error("Error generating enhanced survey with OpenAI:", error);

    // 폴백: 기본 향상된 설문 제공
    return generateFallbackEnhancedSurvey(input);
  }
}

function generateFallbackEnhancedSurvey(input: EnhancedSurveyInput): any {
  const trendingInterests = getTrendingInterests();
  const currentMonth = new Date().getMonth() + 1;

  // 계절별 질문 생성
  const seasonalQuestions = [
    {
      text: `요즘 인기인 '${trendingInterests[0]}'에 대한 관심도는?`,
      category: "트렌드",
      options: [
        { text: "매우 좋아함", value: "매우좋아함", weight: 3 },
        { text: "좋아함", value: "좋아함", weight: 2 },
        { text: "보통", value: "보통", weight: 1 },
        { text: "관심 없음", value: "관심없음", weight: 0 },
      ],
      interest_tags: [trendingInterests[0]],
    },
    {
      text: "새로운 취미로 '홈카페' 만들기에 관심이 있나요?",
      category: "라이프스타일",
      options: [
        { text: "매우 좋아함", value: "매우좋아함", weight: 3 },
        { text: "좋아함", value: "좋아함", weight: 2 },
        { text: "보통", value: "보통", weight: 1 },
        { text: "관심 없음", value: "관심없음", weight: 0 },
      ],
      interest_tags: ["홈카페", "취미"],
    },
    {
      text: "AI 도구 활용 (ChatGPT, 미드저니 등)에 대한 관심은?",
      category: "기술",
      options: [
        { text: "매우 좋아함", value: "매우좋아함", weight: 3 },
        { text: "좋아함", value: "좋아함", weight: 2 },
        { text: "보통", value: "보통", weight: 1 },
        { text: "관심 없음", value: "관심없음", weight: 0 },
      ],
      interest_tags: ["AI기술", "도구활용"],
    },
  ];

  // 매칭 파트너 영향 질문 추가
  if (input.matchHistory && input.matchHistory.length > 0) {
    const partnerInterests = input.matchHistory[0].partnerInterests;
    if (partnerInterests.length > 0) {
      seasonalQuestions.push({
        text: `매칭 상대방이 좋아하는 '${partnerInterests[0]}'에 대해 어떻게 생각하시나요?`,
        category: "매칭연계",
        options: [
          { text: "매우 좋아함", value: "매우좋아함", weight: 3 },
          { text: "좋아함", value: "좋아함", weight: 2 },
          { text: "보통", value: "보통", weight: 1 },
          { text: "관심 없음", value: "관심없음", weight: 0 },
        ],
        interest_tags: [partnerInterests[0], "매칭탐색"],
      });
    }
  }

  return {
    questions: seasonalQuestions.slice(0, input.surveyCount >= 2 ? 5 : 4),
  };
}

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

// 클라이언트 사이드 폴백 설문
function generateKoreanFallbackSurvey(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
}): any {
  console.log("🔄 클라이언트 폴백 설문 사용");

  return {
    title: `${userInfo.name || "당신"}을 위한 기본 설문`,
    description: "기본 한국어 설문조사",
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
        text: "주말에 가장 하고 싶은 활동은?",
        category: "라이프스타일",
        weight: 2,
        options: [
          { text: "매우 좋아함", value: "weekend_love", icon: "🌟" },
          { text: "좋아함", value: "weekend_like", icon: "👍" },
          { text: "보통", value: "weekend_neutral", icon: "😐" },
          { text: "관심 없음", value: "weekend_dislike", icon: "👎" },
        ],
      },
    ],
  };
}
