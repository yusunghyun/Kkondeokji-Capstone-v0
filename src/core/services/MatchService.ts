import { getSurveyRepo, getUserRepo, getMatchRepo } from "@/core/infra/RepositoryFactory"
import { generateMatchInsights } from "@/shared/utils/grokClient"
import type { MatchResult, UserResponse, Question, Option } from "@/shared/types/domain"

export async function calculateMatch(
  user1Id: string,
  user2Id: string,
  user1SurveyId: string,
  user2SurveyId: string,
): Promise<MatchResult> {
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

    // Get user responses
    const user1Responses = await getSurveyRepo().getUserResponses(user1SurveyId)
    const user2Responses = await getSurveyRepo().getUserResponses(user2SurveyId)

    // Get all questions and options for context
    const surveyId = (await getSurveyRepo().getUserSurveyById(user1SurveyId))?.surveyTemplateId
    if (!surveyId) throw new Error("Survey not found")

    const questions = await getSurveyRepo().getQuestionsByTemplateId(surveyId)

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

    // Get user profiles for AI insights
    const user1 = await getUserRepo().getById(user1Id)
    const user2 = await getUserRepo().getById(user2Id)

    // Generate AI insights
    const aiInsights = await generateMatchInsights({
      user1: {
        name: user1?.name || undefined,
        age: user1?.age || undefined,
        occupation: user1?.occupation || undefined,
      },
      user2: {
        name: user2?.name || undefined,
        age: user2?.age || undefined,
        occupation: user2?.occupation || undefined,
      },
      matchScore: result.score,
      commonInterests: {
        tags: result.commonTags,
        responses: result.commonResponses,
      },
    })

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
