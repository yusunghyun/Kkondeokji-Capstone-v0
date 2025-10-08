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

/**
 * 설문 응답에서 실제 사용자의 관심사만 추출
 * - 사용자가 선택한 답변(option.text)에서 관심사 추출
 * - 질문의 category는 제외 (상대방 관심사일 수 있음)
 */
function extractUserInterests(
  responses: Array<{ questionId: string; optionId: string }>,
  surveyTemplate: SurveyTemplate | null
): string[] {
  if (!surveyTemplate || !surveyTemplate.questions) return [];

  const interests: string[] = [];

  // 감정/빈도 표현은 제외
  const excludedWords = [
    "매우 좋아함",
    "좋아함",
    "보통",
    "관심 없음",
    "싫어함",
    "예",
    "아니오",
    "항상",
    "자주",
    "가끔",
    "거의 안함",
    "전혀",
    "없음",
    "많이",
    "조금",
    "매우",
    "아주",
    "열려있어요",
    "관심이 많아요",
    "궁금해요",
  ];

  // 일반적인 카테고리명은 제외 (너무 포괄적)
  const excludedCategories = [
    "엔터테인먼트",
    "운동",
    "라이프스타일",
    "취미",
    "관심사",
    "활동",
    "여가",
    "학습",
    "문화",
    "예술",
    "스포츠",
    "음악",
    "영화",
    "책",
    "게임",
  ];

  for (const response of responses) {
    const question = surveyTemplate.questions.find(
      (q) => q.id === response.questionId
    );

    if (!question) continue;

    const option = question.options?.find((o) => o.id === response.optionId);

    if (!option) continue;

    // ✅ 사용자가 선택한 답변(option.text)에서 관심사 추출
    const optionText = option.text?.trim();

    if (optionText) {
      // 제외 단어 목록에 없고, 길이가 적절한 경우만 추가
      const isExcluded =
        excludedWords.some((word) =>
          optionText.toLowerCase().includes(word.toLowerCase())
        ) ||
        excludedCategories.some((cat) =>
          optionText.toLowerCase().includes(cat.toLowerCase())
        );

      if (!isExcluded && optionText.length >= 2 && optionText.length <= 30) {
        interests.push(optionText);
      }
    }
  }

  console.log("📝 추출된 관심사 (필터링 후):", interests);

  // 중복 제거 및 정리
  return Array.from(new Set(interests.filter((i) => i && i.length >= 2)));
}

/**
 * 사용자 프로필에 관심사 직접 저장 (API 우회)
 * - 기존 API는 category를 그대로 추가하는 문제가 있음
 * - 여기서는 추출된 interests만 직접 저장
 */
async function saveUserInterests(
  userId: string,
  interests: string[]
): Promise<void> {
  const response = await fetch("/api/save-user-interests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      interests, // 필터링된 관심사만 전달
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save user interests");
  }
}

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
          // AI 기반 개인화 설문 생성
          const templateId = await generatePersonalizedSurvey(userInfo);
          console.log("🎯 AI 설문 생성 성공, templateId:", templateId);
          console.log(
            "🎯 AI 설문 생성 성공, templateId 타입:",
            typeof templateId
          );
          console.log(
            "🎯 AI 설문 생성 성공, templateId 길이:",
            templateId?.length
          );

          if (!templateId || templateId.trim() === "") {
            console.error(
              "❌ AI 설문 생성 실패: templateId가 비어있습니다",
              templateId
            );
            throw new Error("AI 설문 생성 후 templateId가 비어있습니다");
          }

          set({ isLoading: false });
          return templateId;
        } catch (error) {
          console.error("AI 설문 생성 실패, 기존 템플릿 사용:", error);

          // AI 생성 실패 시 기존 템플릿 중 랜덤 선택
          try {
            const templateIdList = await getSurveyTemplateIdList();
            console.log("기존 템플릿 목록:", templateIdList);

            if (templateIdList.length === 0) {
              throw new Error("사용 가능한 설문 템플릿이 없습니다");
            }

            const randomIndex = Math.floor(
              Math.random() * templateIdList.length
            );
            const templateId = templateIdList[randomIndex];
            console.log(
              "기존 템플릿 선택:",
              templateId,
              "인덱스:",
              randomIndex
            );

            if (!templateId || templateId.trim() === "") {
              throw new Error(
                `선택된 기존 템플릿 ID가 비어있습니다: "${templateId}"`
              );
            }

            set({ isLoading: false });
            return templateId;
          } catch (fallbackError) {
            console.error("기존 템플릿 선택도 실패:", fallbackError);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to generate survey",
              isLoading: false,
            });
            throw error;
          }
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
        console.log("🏁 startSurvey 호출:", { userId, templateId });
        set({ isLoading: true, error: null, userId });

        if (!templateId || templateId.trim() === "") {
          throw new Error("templateId가 비어있습니다");
        }

        try {
          const userSurveyId = await startUserSurvey(userId, templateId);
          console.log("✅ 사용자 설문 생성 완료:", userSurveyId);
          set({ userSurveyId, isLoading: false });
          return userSurveyId;
        } catch (error) {
          console.error("❌ 사용자 설문 생성 실패:", error);
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

        // 실제 질문 개수 사용
        const questionCount = surveyTemplate?.questions?.length || 0;

        if (currentQuestionIndex < questionCount - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
          console.log(
            `다음 질문으로 이동: ${currentQuestionIndex + 1}/${questionCount}`
          );
        } else {
          console.log("마지막 질문입니다");
        }
      },

      prevQuestion: () => {
        const { currentQuestionIndex } = get();

        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      submitSurvey: async () => {
        const { userSurveyId, responses, surveyTemplate, userId } = get();
        console.log("📤 submitSurvey 호출:", {
          userSurveyId,
          responsesCount: responses.length,
          userId,
          hasTemplate: !!surveyTemplate,
        });
        set({ isLoading: true, error: null });

        try {
          if (!userSurveyId) {
            throw new Error("No active survey");
          }

          if (!userId) {
            console.error("❌ userId가 없습니다! surveyStore 상태:", get());
            throw new Error("userId가 설정되지 않았습니다");
          }

          console.log("💾 설문 응답 저장 시작 (userId:", userId, ")");

          // Save responses
          await saveUserResponses(userSurveyId, responses);

          // Mark survey as completed
          await completeSurvey(userSurveyId);

          // ✨ 설문 응답에서 실제 사용자의 관심사만 추출하여 저장
          console.log("📝 사용자 관심사 추출 시작 (userId:", userId, ")");
          const userInterests = extractUserInterests(responses, surveyTemplate);
          console.log("✅ 추출된 관심사:", userInterests);

          // ✨ 사용자 프로필에 관심사 저장
          if (userInterests.length > 0) {
            try {
              console.log(
                "💾 관심사 저장 시작 (userId:",
                userId,
                ", interests:",
                userInterests,
                ")"
              );
              await saveUserInterests(userId, userInterests);
              console.log("✅ 관심사 저장 완료 (userId:", userId, ")");
            } catch (error) {
              console.error(
                "❌ 관심사 저장 실패 (userId:",
                userId,
                "):",
                error
              );
              // 관심사 저장 실패는 치명적이지 않으므로 계속 진행
            }
          } else {
            console.warn("⚠️ 추출된 관심사가 없습니다 (userId:", userId, ")");
          }

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
        console.log("surveyStore reset 실행");

        // 1. 모든 상태 초기화
        set({
          userId: null,
          surveyTemplate: null,
          userSurveyId: null,
          currentQuestionIndex: 0,
          responses: [],
          isLoading: false,
          error: null,
        });

        // 2. persist된 데이터 정리
        if (typeof window !== "undefined") {
          localStorage.removeItem("survey-store");
          console.log("persist된 설문 데이터 정리 완료");
        }
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
