import { getSurveyRepo } from "@/core/infra/RepositoryFactory";
import { generateSurveyWithOpenAI } from "@/shared/utils/openaiClient";
import type { SurveyTemplate } from "@/shared/types/domain";

export async function generatePersonalizedSurvey(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
  otherUserId?: string;
}): Promise<string> {
  try {
    // Generate survey using Grok AI
    const surveyData = await generateSurveyWithOpenAI(userInfo);

    // Create survey template in database
    const templateId = await getSurveyRepo().createTemplate({
      title: surveyData.title,
      description: surveyData.description,
      aiGenerated: true,
      questions: surveyData.questions,
    });

    return templateId;
  } catch (error) {
    console.error("Error generating personalized survey:", error);
    throw new Error("Failed to generate personalized survey");
  }
}

export async function getSurveyTemplateIdList(): Promise<string[]> {
  return getSurveyRepo().getTemplateIdList();
}

export async function getSurveyWithQuestions(
  templateId: string
): Promise<SurveyTemplate | null> {
  return getSurveyRepo().getTemplateWithQuestions(templateId);
}

export async function startUserSurvey(
  userId: string,
  templateId: string
): Promise<string> {
  return getSurveyRepo().createUserSurvey(userId, templateId);
}

export async function saveUserResponses(
  userSurveyId: string,
  responses: Array<{ questionId: string; optionId: string }>
): Promise<void> {
  await getSurveyRepo().saveUserResponses(userSurveyId, responses);
}

export async function completeSurvey(userSurveyId: string): Promise<void> {
  await getSurveyRepo().completeUserSurvey(userSurveyId);
}
