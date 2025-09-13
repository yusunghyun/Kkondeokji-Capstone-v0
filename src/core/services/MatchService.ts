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
  matchId: string
): Promise<void> {
  try {
    const matchRepo = getMatchRepo();
    const match = await matchRepo.getById(matchId);

    if (!match) {
      throw new Error("매칭을 찾을 수 없습니다");
    }

    // 이미 향상된 AI 인사이트가 있으면 스킵
    if (match.aiInsights && match.aiInsights.length > 200) {
      console.log("이미 향상된 AI 리포트가 존재합니다");
      return;
    }

    const commonInterests = match.commonInterests;
    if (!commonInterests) {
      console.log("공통 관심사가 없어 리포트를 생성할 수 없습니다");
      return;
    }

    // AI를 사용해 향상된 매칭 분석 생성
    const enhancedInsights = await generatePersonalizedMatchInsights({
      score: match.matchScore,
      commonTags: commonInterests.tags,
      commonResponses: commonInterests.responses,
    });

    // DB에 향상된 인사이트 저장
    await matchRepo.updateAiInsights(matchId, enhancedInsights);

    console.log("향상된 매칭 리포트가 성공적으로 생성되었습니다");
  } catch (error) {
    console.error("향상된 매칭 리포트 생성 실패:", error);
    // 에러가 나도 기존 기능은 유지되도록 조용히 실패
  }
}
