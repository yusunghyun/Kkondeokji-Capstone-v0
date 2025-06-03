import { getSurveyRepo, getUserRepo, getMatchRepo } from "@/core/infra/RepositoryFactory"
import type { MatchResult, UserResponse, Question, Option } from "@/shared/types/domain"

export async function calculateRealMatch(user1Id: string, user2Id: string): Promise<MatchResult> {
  try {
    // Check if match already exists
    const existingMatch = await getMatchRepo().getByUserIds(user1Id, user2Id)
    if (existingMatch) {
      return {
        score: existingMatch.matchScore,
        commonTags: existingMatch.commonInterests?.tags || [],
        commonResponses: existingMatch.commonInterests?.responses || [],
        aiInsights: existingMatch.aiInsights,
      }
    }

    // Get users' completed surveys
    const user1Survey = await getUserCompletedSurvey(user1Id)
    const user2Survey = await getUserCompletedSurvey(user2Id)

    if (!user1Survey || !user2Survey) {
      throw new Error("One or both users haven't completed the survey")
    }

    // Get user responses
    const user1Responses = await getSurveyRepo().getUserResponses(user1Survey.id)
    const user2Responses = await getSurveyRepo().getUserResponses(user2Survey.id)

    // Get all questions and options for context
    const questions = await getSurveyRepo().getQuestionsByTemplateId(user1Survey.surveyTemplateId)

    // Create maps for quick lookups
    const questionMap = new Map<string, Question>()
    const optionMap = new Map<string, Option>()

    for (const question of questions) {
      questionMap.set(question.id, question)

      const options = await getSurveyRepo().getOptionsByQuestionId(question.id)
      for (const option of options) {
        optionMap.set(option.id, option)
      }
    }

    // Calculate match score
    const result = calculateMatchScore(user1Responses, user2Responses, questionMap, optionMap)

    // Get user profiles for context
    const user1 = await getUserRepo().getById(user1Id)
    const user2 = await getUserRepo().getById(user2Id)

    // Generate simple insights based on common interests
    const aiInsights = generateSimpleInsights(result, user1?.name, user2?.name)

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
    })

    return {
      ...result,
      aiInsights,
    }
  } catch (error) {
    console.error("Error calculating match:", error)
    throw new Error("Failed to calculate match")
  }
}

async function getUserCompletedSurvey(userId: string) {
  const surveys = await getSurveyRepo().getUserSurveys(userId)
  return surveys.find((survey) => survey.completed) || null
}

function calculateMatchScore(
  user1Responses: UserResponse[],
  user2Responses: UserResponse[],
  questionMap: Map<string, Question>,
  optionMap: Map<string, Option>,
): {
  score: number
  commonTags: string[]
  commonResponses: Array<{ question: string; answer: string }>
} {
  let totalWeight = 0
  let matchWeight = 0
  const commonTags: string[] = []
  const commonResponses: Array<{ question: string; answer: string }> = []

  // Create a map of user2's responses for quick lookup
  const user2ResponseMap = new Map<string, string>()
  for (const response of user2Responses) {
    user2ResponseMap.set(response.questionId, response.optionId)
  }

  // Compare responses
  for (const user1Response of user1Responses) {
    const questionId = user1Response.questionId
    const question = questionMap.get(questionId)

    if (!question) continue

    const weight = question.weight
    totalWeight += weight

    const user2OptionId = user2ResponseMap.get(questionId)

    if (user2OptionId && user2OptionId === user1Response.optionId) {
      // Match found
      matchWeight += weight

      const option = optionMap.get(user1Response.optionId)
      if (option) {
        // Add to common tags if high weight
        if (weight >= 2) {
          commonTags.push(option.value)
        }

        commonResponses.push({
          question: question.text,
          answer: option.text,
        })
      }
    }
  }

  // Calculate score (0-100)
  const score = totalWeight > 0 ? Math.round((matchWeight / totalWeight) * 100) : 0

  return {
    score,
    commonTags: [...new Set(commonTags)], // Remove duplicates
    commonResponses,
  }
}

function generateSimpleInsights(
  result: { score: number; commonTags: string[]; commonResponses: Array<{ question: string; answer: string }> },
  user1Name?: string | null,
  user2Name?: string | null,
): string {
  const name1 = user1Name || "첫 번째 분"
  const name2 = user2Name || "두 번째 분"

  if (result.score >= 80) {
    return `${name1}과 ${name2}는 정말 잘 맞는 것 같아요! 공통 관심사가 많아서 대화가 끊이지 않을 것 같네요. 특히 ${result.commonResponses[0]?.answer}에 대한 이야기로 시작해보세요!`
  } else if (result.score >= 60) {
    return `${name1}과 ${name2}는 꽤 괜찮은 매칭이에요! 몇 가지 공통점이 있어서 친해질 수 있을 것 같아요. ${result.commonResponses.length > 0 ? `"${result.commonResponses[0].answer}"에 대해 이야기해보세요!` : ""}`
  } else if (result.score >= 40) {
    return `${name1}과 ${name2}는 서로 다른 점이 많지만, 그래서 더 흥미로울 수 있어요! ${result.commonResponses.length > 0 ? `공통점인 "${result.commonResponses[0].answer}"부터 대화를 시작해보세요.` : "서로의 다른 취향에 대해 궁금해해보세요!"}`
  } else {
    return `${name1}과 ${name2}는 정말 다른 스타일이네요! 하지만 그래서 더 새로운 것을 배울 수 있을 거예요. 서로의 취향을 존중하며 대화해보세요.`
  }
}
