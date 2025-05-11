import type { Option, Question } from "@/shared/types/domain"
import type { QuestionRepo } from "@/core/repositories/QuestionRepo"
import { mockOptions, mockQuestions } from "@/shared/utils/mockData"

export const mockQuestionRepo: QuestionRepo = {
  async fetchQuestions(): Promise<Question[]> {
    return mockQuestions
  },

  async fetchOptions(questionId: number): Promise<Option[]> {
    return mockOptions.filter((option) => option.questionId === questionId)
  },

  async fetchAllOptions(): Promise<Option[]> {
    return mockOptions
  },
}
