import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function generateSurveyWithOpenAI(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
  otherUserId?: string;
}) {
  const prompt = createSurveyPrompt(userInfo);

  try {
    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt,
      temperature: 0.7,
      maxTokens: 1500, // 토큰 수 줄여서 비용 절약
    });

    return parseSurveyResponse(text);
  } catch (error) {
    console.error("Error generating survey with OpenAI:", error);
    throw new Error("Failed to generate survey");
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
