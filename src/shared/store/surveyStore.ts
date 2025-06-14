import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SurveyTemplate } from "@/shared/types/domain";
import {
  generatePersonalizedSurvey,
  getSurveyWithQuestions,
  startUserSurvey,
  saveUserResponses,
  completeSurvey,
  getSurveyTemplateIdList,
} from "@/core/services/SurveyService";

interface SurveyState {
  userId: string | null;
  surveyTemplate: SurveyTemplate | null;
  userSurveyId: string | null;
  currentQuestionIndex: number;
  responses: Array<{ questionId: string; optionId: string }>;
  isLoading: boolean;
  error: string | null;

  // Actions
  generateSurvey: (userInfo: {
    name?: string;
    age?: number;
    occupation?: string;
    otherUserId?: string;
  }) => Promise<string>;

  loadSurvey: (templateId: string) => Promise<void>;

  startSurvey: (userId: string, templateId: string) => Promise<string>;

  answerQuestion: (questionId: string, optionId: string) => void;

  nextQuestion: () => void;

  prevQuestion: () => void;

  submitSurvey: () => Promise<void>;

  reset: () => void;
}

const isMock = process.env.NEXT_PUBLIC_USE_MOCK_SURVEY == "true";

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      userId: null,
      surveyTemplate: null,
      userSurveyId: null,
      currentQuestionIndex: 0,
      responses: [],
      isLoading: false,
      error: null,

      generateSurvey: async (userInfo) => {
        set({ isLoading: true, error: null });
        try {
          const templateIdList = await getSurveyTemplateIdList();
          console.log("templateIdList", templateIdList);
          // const templateId = await generatePersonalizedSurvey(userInfo);
          // await get().loadSurvey(templateId);

          // TODO: 랜덤으로 고르기
          const templateId =
            templateIdList[Math.floor(Math.random() * templateIdList.length)];

          return templateId;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate survey",
            isLoading: false,
          });
          throw error;
        }
      },

      loadSurvey: async (templateId) => {
        set({ isLoading: true, error: null });
        try {
          const template = await getSurveyWithQuestions(templateId);

          if (!template) {
            throw new Error("Survey template not found");
          }

          console.log("loadSurvey", template);

          set({ surveyTemplate: template, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load survey",
            isLoading: false,
          });
          throw error;
        }
      },

      startSurvey: async (userId, templateId) => {
        set({ isLoading: true, error: null, userId });
        try {
          const userSurveyId = await startUserSurvey(userId, templateId);
          set({ userSurveyId, isLoading: false });
          return userSurveyId;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to start survey",
            isLoading: false,
          });
          throw error;
        }
      },

      answerQuestion: (questionId, optionId) => {
        console.log("answerQuestion", questionId, optionId);
        const { responses } = get();
        console.log("get responses", responses);

        // Check if we already have a response for this question
        const existingIndex = responses.findIndex(
          (r) => r.questionId === questionId
        );

        if (existingIndex >= 0) {
          // Update existing response
          const newResponses = [...responses];
          newResponses[existingIndex] = { questionId, optionId };
          set({ responses: newResponses });
        } else {
          // Add new response
          set({ responses: [...responses, { questionId, optionId }] });
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, surveyTemplate } = get();

        // TODO 템플릿에 질문이 여러개 있지 않아서 임의로 5번까지는 이렇게 하자.
        // const questionCount = surveyTemplate?.questions?.length || 0;
        const questionCount = 5;

        if (currentQuestionIndex < questionCount) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      prevQuestion: () => {
        const { currentQuestionIndex } = get();

        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      submitSurvey: async () => {
        const { userSurveyId, responses } = get();
        console.log("submitSurvey", userSurveyId, responses);
        set({ isLoading: true, error: null });

        try {
          if (!userSurveyId) {
            throw new Error("No active survey");
          }

          // Save responses
          await saveUserResponses(userSurveyId, responses);

          // Mark survey as completed
          await completeSurvey(userSurveyId);
          get().reset();

          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to submit survey",
            isLoading: false,
          });
          throw error;
        }
      },

      reset: () => {
        set({
          surveyTemplate: null,
          userSurveyId: null,
          currentQuestionIndex: 0,
          responses: [],
          error: null,
        });
      },
    }),
    {
      name: "survey-store",
      partialize: (state) => ({
        userId: state.userId,
        userSurveyId: state.userSurveyId,
        responses: state.responses,
      }),
    }
  )
);
