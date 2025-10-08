import {
  getSurveyRepo,
  getUserRepo,
  getMatchRepo,
} from "@/core/infra/RepositoryFactory";
import type {
  MatchResult,
  UserResponse,
  Question,
  Option,
} from "@/shared/types/domain";

export async function calculateRealMatch(
  user1Id: string,
  user2Id: string
): Promise<MatchResult> {
  try {
    console.log("🎯 실제 매칭 계산 시작:", { user1Id, user2Id });

    // ✨ 0️⃣ 먼저 사용자 프로필 정보 가져오기 (interests 배열 포함)
    const userRepo = getUserRepo();
    const user1Profile = await userRepo.getProfile(user1Id);
    const user2Profile = await userRepo.getProfile(user2Id);

    const user1Interests = user1Profile?.interests || [];
    const user2Interests = user2Profile?.interests || [];

    console.log("🏷️ 사용자 관심사:", {
      user1: user1Interests.length,
      user2: user2Interests.length,
    });

    // Get user surveys
    const user1Survey = await getUserCompletedSurvey(user1Id);
    const user2Survey = await getUserCompletedSurvey(user2Id);

    if (!user1Survey || !user2Survey) {
      throw new Error("완료된 설문을 찾을 수 없습니다");
    }

    // Get user responses
    const user1Responses = await getSurveyRepo().getUserResponses(
      user1Survey.id
    );
    const user2Responses = await getSurveyRepo().getUserResponses(
      user2Survey.id
    );

    // Get all questions and options for context
    const questions = await getSurveyRepo().getQuestionsByTemplateId(
      user1Survey.surveyTemplateId
    );

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

    // 1️⃣ 기존 정확한 매칭 계산
    const baseResult = calculateMatchScore(
      user1Responses,
      user2Responses,
      questionMap,
      optionMap
    );

    // ✨ 1.5️⃣ interests 배열 비교하여 공통 관심사 추가
    const commonInterests = user1Interests.filter((interest) =>
      user2Interests.some(
        (i2) =>
          i2.toLowerCase().trim() === interest.toLowerCase().trim() ||
          i2.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(i2.toLowerCase())
      )
    );

    console.log("🎯 공통 관심사 발견:", {
      count: commonInterests.length,
      interests: commonInterests,
    });

    // 공통 관심사를 commonTags에 추가 (중복 제거)
    const allCommonTags = Array.from(
      new Set([...baseResult.commonTags, ...commonInterests])
    );

    // 공통 관심사당 5점 추가
    const interestBonus = commonInterests.length * 5;

    console.log("📊 기본 매칭 결과:", {
      baseScore: baseResult.score,
      interestBonus,
      commonTagsFromResponses: baseResult.commonTags.length,
      commonInterests: commonInterests.length,
      totalCommonTags: allCommonTags.length,
    });

    // 2️⃣ AI 기반 의미적 유사성 분석 (기본 점수가 낮을 때만)
    let finalScore = baseResult.score + interestBonus;
    let semanticMatches: any[] = [];

    if (finalScore < 50) {
      console.log("🧠 기본 점수가 낮아 AI 의미적 분석 시작");

      try {
        // 응답을 AI 분석용 형태로 변환
        const user1FormattedResponses = user1Responses.map((response) => ({
          question: questionMap.get(response.questionId)?.text || "알 수 없음",
          answer: optionMap.get(response.optionId)?.text || "알 수 없음",
        }));

        const user2FormattedResponses = user2Responses.map((response) => ({
          question: questionMap.get(response.questionId)?.text || "알 수 없음",
          answer: optionMap.get(response.optionId)?.text || "알 수 없음",
        }));

        // AI 의미적 유사성 분석 호출 (서버 환경에서는 절대 URL 필요)
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const semanticResponse = await fetch(
          `${baseUrl}/api/analyze-semantic-similarity`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user1Responses: user1FormattedResponses,
              user2Responses: user2FormattedResponses,
            }),
          }
        );

        if (semanticResponse.ok) {
          const semanticResult = await semanticResponse.json();
          semanticMatches = semanticResult.semanticMatches || [];
          const boostScore = semanticResult.boostScore || 0;

          finalScore = Math.min(100, baseResult.score + boostScore);

          console.log("✅ AI 의미적 분석 완료:", {
            originalScore: baseResult.score,
            boostScore,
            finalScore,
            semanticMatchCount: semanticMatches.length,
          });

          // 의미적 매칭을 commonTags에 추가
          semanticMatches.forEach((match) => {
            if (
              match.commonCategories &&
              Array.isArray(match.commonCategories)
            ) {
              baseResult.commonTags.push(...match.commonCategories);
            }
          });
        }
      } catch (aiError) {
        console.warn("⚠️ AI 의미적 분석 실패 (기본 점수 유지):", aiError);
      }
    }

    // Get user profiles for context
    const user1 = await getUserRepo().getById(user1Id);
    const user2 = await getUserRepo().getById(user2Id);

    // ✨ Generate enhanced insights - 간결하고 핵심만
    let aiInsights = "";

    if (allCommonTags.length > 0) {
      // 공통 관심사가 있을 때 - 간결하게 3문장 이내
      const topTags = allCommonTags.slice(0, 3);
      const scoreDescription =
        finalScore >= 80
          ? "정말 잘 맞는"
          : finalScore >= 60
          ? "잘 맞는"
          : finalScore >= 40
          ? "어느 정도 맞는"
          : "새로운";

      aiInsights = `${user1?.name || "당신"}님과 ${
        user2?.name || "상대방"
      }님은 ${scoreDescription} 궁합이에요! "${topTags.join(
        ", "
      )}"에 공통 관심사가 있네요.`;

      if (baseResult.commonResponses.length > 0) {
        aiInsights += ` ${baseResult.commonResponses.length}개의 질문에 같은 답변을 하셨어요.`;
      }

      aiInsights += ` 이 주제로 먼저 대화를 시작해보세요!`;
    } else {
      // 공통점이 없을 때 - 매우 간결하게
      aiInsights = `${user1?.name || "당신"}님과 ${
        user2?.name || "상대방"
      }님은 서로 다른 관심사를 가지고 있어요. 새로운 경험을 나누며 대화해보세요!`;
    }

    // 의미적 매칭 - 1개만 간단히
    if (semanticMatches.length > 0) {
      const bestMatch = semanticMatches[0];
      aiInsights += ` "${bestMatch.commonCategories[0]}"로 연결될 수 있어요.`;
    }

    console.log("🤖 생성된 AI 인사이트:", aiInsights);

    // Save match to database with final score
    await getMatchRepo().create({
      user1Id,
      user2Id,
      matchScore: finalScore, // 보정된 최종 점수 사용
      commonInterests: {
        tags: allCommonTags, // ✨ 모든 공통 태그 사용
        responses: baseResult.commonResponses,
      },
      aiInsights,
    });

    return {
      score: finalScore, // 보정된 최종 점수
      commonTags: allCommonTags, // ✨ 모든 공통 태그 반환
      commonResponses: baseResult.commonResponses,
      aiInsights,
    };
  } catch (error) {
    console.error("Error calculating match:", error);
    throw new Error("Failed to calculate match");
  }
}

async function getUserCompletedSurvey(userId: string) {
  const surveys = await getSurveyRepo().getUserSurveys(userId);
  return surveys.find((survey) => survey.completed) || null;
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
        // Add to common tags if high weight
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

function generateSimpleInsights(
  result: {
    score: number;
    commonTags: string[];
    commonResponses: Array<{ question: string; answer: string }>;
  },
  user1Name?: string | null,
  user2Name?: string | null
): string {
  const name1 = user1Name || "첫 번째 분";
  const name2 = user2Name || "두 번째 분";

  if (result.score >= 80) {
    return `${name1}과 ${name2}는 정말 잘 맞는 것 같아요! 공통 관심사가 많아서 대화가 끊이지 않을 것 같네요. 특히 ${result.commonResponses[0]?.answer}에 대한 이야기로 시작해보세요!`;
  } else if (result.score >= 60) {
    return `${name1}과 ${name2}는 꽤 괜찮은 매칭이에요! 몇 가지 공통점이 있어서 친해질 수 있을 것 같아요. ${
      result.commonResponses.length > 0
        ? `"${result.commonResponses[0].answer}"에 대해 이야기해보세요!`
        : ""
    }`;
  } else if (result.score >= 40) {
    return `${name1}과 ${name2}는 서로 다른 점이 많지만, 그래서 더 흥미로울 수 있어요! ${
      result.commonResponses.length > 0
        ? `공통점인 "${result.commonResponses[0].answer}"부터 대화를 시작해보세요.`
        : "서로의 다른 취향에 대해 궁금해해보세요!"
    }`;
  } else {
    return `${name1}과 ${name2}는 정말 다른 스타일이네요! 하지만 그래서 더 새로운 것을 배울 수 있을 거예요. 서로의 취향을 존중하며 대화해보세요.`;
  }
}
