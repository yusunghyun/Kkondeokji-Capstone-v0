import {
  getSurveyRepo,
  getUserRepo,
  getMatchRepo,
} from "@/core/infra/RepositoryFactory";
import {
  generateMatchInsightsWithOpenAI,
  generatePersonalizedMatchInsights,
} from "@/shared/utils/openaiClient";
import type {
  MatchResult,
  UserResponse,
  Question,
  Option,
  Match,
} from "@/shared/types/domain";

export async function calculateMatch(
  user1Id: string,
  user2Id: string,
  user1SurveyId: string,
  user2SurveyId: string
): Promise<MatchResult> {
  try {
    // Check if match already exists
    const existingMatch = await getMatchRepo().getByUserIds(user1Id, user2Id);
    if (existingMatch) {
      return {
        score: existingMatch.matchScore,
        commonTags: existingMatch.commonInterests?.tags || [],
        commonResponses: existingMatch.commonInterests?.responses || [],
        aiInsights: existingMatch.aiInsights,
      };
    }

    // Get user responses
    const user1Responses = await getSurveyRepo().getUserResponses(
      user1SurveyId
    );
    const user2Responses = await getSurveyRepo().getUserResponses(
      user2SurveyId
    );

    // Get all questions and options for context
    const surveyId = (await getSurveyRepo().getUserSurveyById(user1SurveyId))
      ?.surveyTemplateId;
    if (!surveyId) throw new Error("Survey not found");

    const questions = await getSurveyRepo().getQuestionsByTemplateId(surveyId);

    // Create maps for quick lookups
    const questionMap = new Map<string, Question>();
    const optionMap = new Map<string, Option>();

    for (const question of questions) {
      questionMap.set(question.id, question);

      const options = await getSurveyRepo().getOptionsByQuestionId(question.id);
      for (const option of options) {
        optionMap.set(option.id, option);
      }
    }

    // Calculate match score
    const result = calculateMatchScore(
      user1Responses,
      user2Responses,
      questionMap,
      optionMap
    );

    // Get user profiles for AI insights
    const user1 = await getUserRepo().getById(user1Id);
    const user2 = await getUserRepo().getById(user2Id);

    // Generate AI insights
    const aiInsights = await generateMatchInsightsWithOpenAI(
      user1Responses,
      user2Responses
    );

    // Save match to database
    await getMatchRepo().create({
      user1Id,
      user2Id,
      matchScore: result.score,
      commonInterests: {
        tags: result.commonTags,
        responses: result.commonResponses,
      },
      aiInsights,
    });

    return {
      ...result,
      aiInsights,
    };
  } catch (error) {
    console.error("Error calculating match:", error);
    throw new Error("Failed to calculate match");
  }
}

function calculateMatchScore(
  user1Responses: UserResponse[],
  user2Responses: UserResponse[],
  questionMap: Map<string, Question>,
  optionMap: Map<string, Option>
): {
  score: number;
  commonTags: string[];
  commonResponses: Array<{ question: string; answer: string }>;
} {
  let totalWeight = 0;
  let matchWeight = 0;
  const commonTags: string[] = [];
  const commonResponses: Array<{ question: string; answer: string }> = [];

  // Create a map of user2's responses for quick lookup
  const user2ResponseMap = new Map<string, string>();
  for (const response of user2Responses) {
    user2ResponseMap.set(response.questionId, response.optionId);
  }

  // Compare responses
  for (const user1Response of user1Responses) {
    const questionId = user1Response.questionId;
    const question = questionMap.get(questionId);

    if (!question) continue;

    const weight = question.weight;
    totalWeight += weight;

    const user2OptionId = user2ResponseMap.get(questionId);

    if (user2OptionId && user2OptionId === user1Response.optionId) {
      // Match found
      matchWeight += weight;

      const option = optionMap.get(user1Response.optionId);
      if (option) {
        if (weight >= 2) {
          commonTags.push(option.value);
        }

        commonResponses.push({
          question: question.text,
          answer: option.text,
        });
      }
    }
  }

  // Calculate score (0-100)
  const score =
    totalWeight > 0 ? Math.round((matchWeight / totalWeight) * 100) : 0;

  return {
    score,
    commonTags: Array.from(new Set(commonTags)), // Remove duplicates
    commonResponses,
  };
}

export async function generateEnhancedMatchReport(
  matchId: string,
  force: boolean = false
): Promise<string> {
  try {
    const matchRepo = getMatchRepo();
    const match = await matchRepo.getById(matchId);

    if (!match) {
      throw new Error("매칭을 찾을 수 없습니다");
    }

    console.log("🔄 AI 기반 매치 리포트 재생성 시작");

    const commonInterests = match.commonInterests;
    if (!commonInterests) {
      console.log("공통 관심사가 없어 리포트를 생성할 수 없습니다");
      return (
        match.aiInsights || "공통 관심사가 없어 리포트를 생성할 수 없습니다"
      );
    }

    // 이미 AI 인사이트가 있고, force가 false면 기존 인사이트 반환
    if (match.aiInsights && !force) {
      console.log("AI 인사이트가 이미 있어 재생성을 건너뜁니다 (force=false)");
      return match.aiInsights;
    }

    // 사용자 이름 추출 (실제 이름 사용)
    const user1Name = match.user1?.name || "사용자 1";
    const user2Name = match.user2?.name || "사용자 2";

    // 사용자 프로필 가져오기
    const userRepo = getUserRepo();
    const user1Profile = await userRepo.getProfile(match.user1Id);
    const user2Profile = await userRepo.getProfile(match.user2Id);

    // 사용자 관심사 추출
    const user1Interests = user1Profile?.interests || [];
    const user2Interests = user2Profile?.interests || [];

    console.log("👥 사용자 관심사:", {
      user1: user1Interests.length,
      user2: user2Interests.length,
    });

    // 공통 관심사 찾기
    const commonTags = commonInterests.tags || [];

    // 공통 응답을 개별 응답으로 변환
    const commonResponses = commonInterests.responses.map((response) => ({
      question: response.question,
      answer: response.answer,
    }));

    // 사용자별 응답 준비 (더 정확한 분석을 위해)
    const user1Responses = [
      ...commonResponses,
      ...user1Interests.map((interest) => ({
        question: "관심사",
        answer: interest,
      })),
    ];

    const user2Responses = [
      ...commonResponses,
      ...user2Interests.map((interest) => ({
        question: "관심사",
        answer: interest,
      })),
    ];

    // AI를 사용해 향상된 매칭 분석 생성 (매번 새로운 인사이트)
    const enhancedInsights = await generatePersonalizedMatchInsights(
      user1Responses, // user1 응답
      user2Responses, // user2 응답
      match.matchScore, // 매칭 점수
      user1Name, // 사용자 1 이름
      user2Name // 사용자 2 이름
    );

    // DB에 향상된 인사이트 저장
    await matchRepo.updateAiInsights(matchId, enhancedInsights);

    console.log("✅ 향상된 매칭 리포트가 성공적으로 재생성되었습니다");
    return enhancedInsights;
  } catch (error) {
    console.error("❌ 향상된 매칭 리포트 생성 실패:", error);
    // 에러 발생 시 에러 메시지 반환
    return "매칭 리포트 생성 중 오류가 발생했습니다. 다시 시도해주세요.";
  }
}
