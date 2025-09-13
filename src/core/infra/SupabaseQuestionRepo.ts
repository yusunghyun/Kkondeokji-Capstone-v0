import type { QuestionRepo } from "@/core/repositories/QuestionRepo";
import type { Question, Option } from "@/shared/types/domain";
import { supabase } from "@/lib/supabase";

export const supabaseQuestionRepo: QuestionRepo = {
  async fetchQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from("questions")
      .select("id, text, weight")
      .order("id");

    if (error) {
      console.error("Error fetching questions:", error);
      throw new Error("Failed to fetch questions");
    }

    return data.map((item) => ({
      id: item.id,
      text: item.text,
      weight: item.weight,
    }));
  },

  async fetchOptions(questionId: number): Promise<Option[]> {
    const { data, error } = await supabase
      .from("options")
      .select("id, question_id, text, value, icon")
      .eq("question_id", questionId)
      .order("id");

    if (error) {
      console.error("Error fetching options:", error);
      throw new Error("Failed to fetch options");
    }

    return data.map((item) => ({
      id: item.id,
      questionId: item.question_id,
      text: item.text,
      value: item.value,
      icon: item.icon,
    }));
  },

  async fetchAllOptions(): Promise<Option[]> {
    const { data, error } = await supabase
      .from("options")
      .select("id, question_id, text, value, icon")
      .order("id");

    if (error) {
      console.error("Error fetching all options:", error);
      throw new Error("Failed to fetch all options");
    }

    return data.map((item) => ({
      id: item.id,
      questionId: item.question_id,
      text: item.text,
      value: item.value,
      icon: item.icon,
    }));
  },
};
