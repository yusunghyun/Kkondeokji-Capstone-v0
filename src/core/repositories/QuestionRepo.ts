import type { Option, Question } from "@/shared/types/domain"

export interface QuestionRepo {
  fetchQuestions(): Promise<Question[]>
  fetchOptions(questionId: number): Promise<Option[]>
  fetchAllOptions(): Promise<Option[]>
}
