import type { User, UserProfile } from "@/shared/types/domain";
import type { UserRepo } from "@/core/repositories/UserRepo";
import { supabase } from "@/shared/utils/supabaseClient";

export const supabaseUserRepo: UserRepo = {
  async create(userData): Promise<string> {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name: userData.name || null,
          age: userData.age || null,
          occupation: userData.occupation || null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }

    return data.id;
  },

  async getById(userId): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      age: data.age,
      occupation: data.occupation,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  async getProfile(userId): Promise<UserProfile | null> {
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);
      return null;
    }

    // Get user's completed surveys
    const { data: userSurveys, error: surveysError } = await supabase
      .from("user_surveys")
      .select("id")
      .eq("user_id", userId)
      .eq("completed", true);

    if (surveysError) {
      console.error("Error fetching user surveys:", surveysError);
      return null;
    }

    // If user has no completed surveys, return profile without interests
    if (userSurveys.length === 0) {
      return {
        id: userData.id,
        name: userData.name,
        age: userData.age,
        occupation: userData.occupation,
        interests: [],
        createdAt: new Date(userData.created_at),
      };
    }

    // Get user's responses to extract interests
    const surveyIds = userSurveys.map((s) => s.id);
    const { data: responses, error: responsesError } = await supabase
      .from("user_responses")
      .select(
        `
        id,
        option_id,
        options:option_id (
          value
        )
      `
      )
      .in("user_survey_id", surveyIds);

    if (responsesError) {
      console.error("Error fetching user responses:", responsesError);
      return null;
    }

    // Extract unique interest tags
    const interests = Array.from(
      new Set(
        responses.map((r) => r.options?.value).filter(Boolean) as string[]
      )
    );

    return {
      id: userData.id,
      name: userData.name,
      age: userData.age,
      occupation: userData.occupation,
      interests,
      createdAt: new Date(userData.created_at),
    };
  },

  async update(userId, userData): Promise<void> {
    const { data, error } = await supabase
      .from("users")
      .update({
        name: userData.name,
        age: userData.age,
        occupation: userData.occupation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
    console.log("supabase update", data, error);
    if (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  },
};
