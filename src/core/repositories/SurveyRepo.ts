import type {
  SurveyTemplate,
  Question,
  Option,
  UserSurvey,
  UserResponse,
} from "@/shared/types/domain";

export interface SurveyRepo {
  getTemplateIdList(): Promise<string[]>;

  createTemplate(template: {
    title: string;
    description?: string;
    aiGenerated: boolean;
    questions: Array<{
      text: string;
      weight: number;
      options: Array<{
        text: string;
        value: string;
        icon?: string;
      }>;
    }>;
  }): Promise<string>;

  getTemplateById(templateId: string): Promise<SurveyTemplate | null>;

  getTemplateWithQuestions(templateId: string): Promise<SurveyTemplate | null>;

  getQuestionsByTemplateId(templateId: string): Promise<Question[]>;

  getOptionsByQuestionId(questionId: string): Promise<Option[]>;

  createUserSurvey(userId: string, templateId: string): Promise<string>;

  getUserSurveyById(surveyId: string): Promise<UserSurvey | null>;

  saveUserResponses(
    userSurveyId: string,
    responses: Array<{ questionId: string; optionId: string }>
  ): Promise<void>;

  completeUserSurvey(userSurveyId: string): Promise<void>;

  getUserResponses(userSurveyId: string): Promise<UserResponse[]>;
}
