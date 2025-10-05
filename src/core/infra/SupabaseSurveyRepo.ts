import type {
  SurveyTemplate,
  Question,
  Option,
  UserSurvey,
  UserResponse,
} from "@/shared/types/domain";
import type { SurveyRepo } from "@/core/repositories/SurveyRepo";
import { supabase } from "@/lib/supabase";

export const supabaseSurveyRepo: SurveyRepo = {
  async getTemplateIdList(): Promise<string[]> {
    const { data, error } = await supabase
      .from("survey_templates")
      .select("id");
    if (error) {
      console.error("Error fetching survey template list:", error);
      return [];
    }
    return data.map((item) => item.id);
  },

  async createTemplate(template): Promise<string> {
    // Start a transaction
    const { data: templateData, error: templateError } = await supabase
      .from("survey_templates")
      .insert([
        {
          title: template.title,
          description: template.description || null,
          ai_generated: template.aiGenerated,
        },
      ])
      .select("id")
      .single();

    if (templateError) {
      console.error("Error creating survey template:", templateError);
      throw new Error("Failed to create survey template");
    }

    const templateId = templateData.id;

    // Insert questions
    for (let i = 0; i < template.questions.length; i++) {
      const question = template.questions[i];

      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert([
          {
            survey_template_id: templateId,
            text: question.text,
            weight: question.weight,
            order_index: i,
          },
        ])
        .select("id")
        .single();

      if (questionError) {
        console.error("Error creating question:", questionError);
        throw new Error("Failed to create question");
      }

      const questionId = questionData.id;

      // Insert options for this question
      const optionsToInsert = question.options.map((option, j) => ({
        question_id: questionId,
        text: option.text,
        value: option.value,
        icon: option.icon || null,
        order_index: j,
      }));

      const { error: optionsError } = await supabase
        .from("options")
        .insert(optionsToInsert);

      if (optionsError) {
        console.error("Error creating options:", optionsError);
        throw new Error("Failed to create options");
      }
    }

    return templateId;
  },

  async getTemplateById(templateId): Promise<SurveyTemplate | null> {
    const { data, error } = await supabase
      .from("survey_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) {
      console.error("Error fetching survey template:", error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      aiGenerated: data.ai_generated,
      createdAt: new Date(data.created_at),
    };
  },

  async getTemplateWithQuestions(templateId): Promise<SurveyTemplate | null> {
    // Get the template
    const template = await this.getTemplateById(templateId);
    if (!template) return null;

    // Get the questions
    const questions = await this.getQuestionsByTemplateId(templateId);

    // Get options for each question
    for (const question of questions) {
      question.options = await this.getOptionsByQuestionId(question.id);
    }

    return {
      ...template,
      questions,
    };
  },

  async getQuestionsByTemplateId(templateId): Promise<Question[]> {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("survey_template_id", templateId)
      .order("order_index");

    if (error) {
      console.error("Error fetching questions:", error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      surveyTemplateId: item.survey_template_id,
      text: item.text,
      weight: item.weight,
      orderIndex: item.order_index,
      createdAt: new Date(item.created_at),
    }));
  },

  async getOptionsByQuestionId(questionId): Promise<Option[]> {
    const { data, error } = await supabase
      .from("options")
      .select("*")
      .eq("question_id", questionId)
      .order("order_index");

    if (error) {
      console.error("Error fetching options:", error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      questionId: item.question_id,
      text: item.text,
      value: item.value,
      icon: item.icon,
      orderIndex: item.order_index,
      createdAt: new Date(item.created_at),
    }));
  },

  async createUserSurvey(userId, templateId): Promise<string> {
    const { data, error } = await supabase
      .from("user_surveys")
      .insert([
        {
          user_id: userId,
          survey_template_id: templateId,
          completed: false,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating user survey:", error);
      throw new Error("Failed to create user survey");
    }

    return data.id;
  },

  async getUserSurveyById(surveyId): Promise<UserSurvey | null> {
    const { data, error } = await supabase
      .from("user_surveys")
      .select("*")
      .eq("id", surveyId)
      .single();

    if (error) {
      console.error("Error fetching user survey:", error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      surveyTemplateId: data.survey_template_id,
      completed: data.completed,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
    };
  },

  async saveUserResponses(userSurveyId, responses): Promise<void> {
    const responsesToInsert = responses.map((response) => ({
      user_survey_id: userSurveyId,
      question_id: response.questionId,
      option_id: response.optionId,
    }));

    const { error } = await supabase
      .from("user_responses")
      .insert(responsesToInsert);

    if (error) {
      console.error("Error saving user responses:", error);
      throw new Error("Failed to save user responses");
    }
  },

  async completeUserSurvey(userSurveyId): Promise<void> {
    const { error } = await supabase
      .from("user_surveys")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", userSurveyId);

    if (error) {
      console.error("Error completing user survey:", error);
      throw new Error("Failed to complete user survey");
    }
  },

  async getUserResponses(userSurveyId): Promise<UserResponse[]> {
    const { data, error } = await supabase
      .from("user_responses")
      .select("*")
      .eq("user_survey_id", userSurveyId);

    if (error) {
      console.error("Error fetching user responses:", error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      userSurveyId: item.user_survey_id,
      questionId: item.question_id,
      optionId: item.option_id,
      createdAt: new Date(item.created_at),
    }));
  },

  // 🔍 사용자의 모든 설문 기록 조회 메서드 구현
  async getUserSurveys(userId: string): Promise<UserSurvey[]> {
    console.log("🔍 SupabaseSurveyRepo getUserSurveys 시작 - userId:", userId);

    const { data, error } = await supabase
      .from("user_surveys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 사용자 설문 기록 조회 에러:", error);
      return [];
    }

    console.log("✅ 사용자 설문 기록 조회 완료:", data?.length || 0, "개");

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      surveyTemplateId: item.survey_template_id,
      completed: item.completed,
      createdAt: new Date(item.created_at),
      completedAt: item.completed_at ? new Date(item.completed_at) : null,
    }));
  },
};
