import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  getTrendingInterests,
  getKoreanInterestKeywords,
} from "@/shared/utils/interestTranslation";

// OpenAI 클라이언트 초기화 - 명시적으로 API 키 설정
const getOpenAIClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  console.log(
    "🔑 OpenAI API Key 상태:",
    apiKey ? `설정됨 (${apiKey.slice(0, 7)}...)` : "❌ 없음"
  );

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  return openai(apiKey);
};

export async function generateSurveyWithOpenAI(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
  otherUserId?: string;
}): Promise<any> {
  console.log("🤖 AI 기반 한국어 설문 생성 시작:", userInfo);

  try {
    // API 키 확인
    const client = getOpenAIClient();

    // 한국어 기반 트렌드 관심사 가져오기
    const trendingInterests = getTrendingInterests();
    const currentSeason = getCurrentSeason();
    const ageGroup = getAgeGroup(userInfo.age);

    const prompt = `당신은 한국의 젊은 세대를 위한 매칭 설문 전문가입니다. 다음 사용자를 위한 **완전 한국어 기반** 개인 맞춤 설문조사를 생성해주세요.

**사용자 정보:**
- 이름: ${userInfo.name || "사용자"}
- 나이: ${userInfo.age || "미상"}세 (${ageGroup})
- 직업: ${userInfo.occupation || "미상"}

**현재 트렌드:** ${trendingInterests.slice(0, 10).join(", ")}
**계절/시기:** ${currentSeason}

**설문 생성 원칙:**
1. ✅ **100% 한국어**: 모든 텍스트를 자연스러운 한국어로
2. ✅ **MZ세대 친화적**: 요즘 트렌드와 문화 반영
3. ✅ **실용적 매칭**: 실제 만남에서 대화 소재가 될 주제
4. ✅ **감정 기반 선택지**: 매우좋아함/좋아함/보통/관심없음
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
      "text": "요즘 가장 재미있게 보고 있는 드라마나 예능은?",
      "category": "엔터테인먼트",
      "weight": 3,
      "options": [
        {"text": "매우 좋아함", "value": "drama_love", "icon": "😍"},
        {"text": "좋아함", "value": "drama_like", "icon": "😊"},
        {"text": "보통", "value": "drama_neutral", "icon": "😐"},
        {"text": "관심 없음", "value": "drama_dislike", "icon": "😑"}
      ]
    }
  ]
}

**예시 질문들:**
- "요즘 인기인 '웹툰 원작 드라마'에 대한 관심도는?"
- "주말 오후, 가장 하고 싶은 활동은?"
- "카페에서 주로 시키는 메뉴 스타일은?"
- "여행지를 고를 때 가장 중요한 요소는?"
- "MBTI가 실제 성격을 잘 나타낸다고 생각하나요?"
- "데이트 장소로 선호하는 곳은?"
- "${currentSeason}에 가장 하고 싶은 활동은?"
- "처음 만나는 사람과 대화할 때 편한 주제는?"

지금 당장 한국 ${ageGroup}들 사이에서 핫한 주제들로 **자연스럽고 재미있는 8개 질문**을 만들어주세요!`;

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

    return result;
  } catch (error) {
    console.error("❌ AI 설문 생성 실패:", error);

    // 한국어 폴백 설문 제공
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
  matchData: MatchInsightsInput
): Promise<string> {
  try {
    const prompt = `당신은 연애 매칭 전문가입니다. 다음 매칭 정보를 바탕으로 두 사람의 궁합에 대한 자세한 분석을 한국어로 제공해주세요.

매칭 점수: ${matchData.score}점 (100점 만점)
공통 관심사: ${matchData.commonTags.join(", ")}
공통 응답: 
${matchData.commonResponses
  .map((r) => `- 질문: ${r.question}\n  답변: ${r.answer}`)
  .join("\n")}

다음 형식으로 분석 결과를 작성해주세요:

📊 **전체적인 매칭 평가**
- 매칭 점수에 대한 종합적인 평가와 의미

💕 **공통점 분석**
- 공통 관심사가 관계에 미치는 긍정적 영향
- 함께 할 수 있는 활동 제안

🌟 **성장 가능성**
- 서로를 통해 배울 수 있는 점
- 관계 발전 방향성

💬 **대화 주제 추천**
- 공통 관심사를 바탕으로 한 구체적인 대화 주제 3-4개
- 첫 만남에서 활용할 수 있는 아이스브레이커

🎯 **데이트 아이디어**
- 공통 관심사를 활용한 데이트 장소/활동 추천 2-3개

💡 **관계 조언**
- 이 매칭에서 주의할 점이나 발전시킬 수 있는 방법

따뜻하고 긍정적인 톤으로 작성하되, 현실적인 조언도 포함해주세요. 길이는 300-500자 정도로 작성해주세요.`;

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt: `당신은 친근하고 전문적인 연애 상담가입니다. 매칭 분석을 통해 사람들이 더 나은 관계를 만들 수 있도록 도와주세요.\n\n${prompt}`,
      maxTokens: 800,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    console.error("Error generating match insights with OpenAI:", error);

    // 폴백: 기본 매칭 분석 제공
    return generateBasicMatchInsights(matchData);
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
