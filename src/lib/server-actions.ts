"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase-types";
import { redirect } from "next/navigation";

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서버 측 Supabase 인스턴스 생성
const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * 현재 인증된 사용자의 ID를 가져옵니다.
 * 인증되지 않은 경우 로그인 페이지로 리다이렉션합니다.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  try {
    const supabaseAuthToken = cookies().get("sb-auth-token")?.value;

    if (!supabaseAuthToken) {
      redirect("/auth/login");
    }

    const { data, error } = await supabaseServer.auth.getUser(
      supabaseAuthToken
    );

    if (error || !data.user) {
      redirect("/auth/login");
    }

    return data.user.id;
  } catch (error) {
    console.error("Authentication error:", error);
    redirect("/auth/login");
  }
}

/**
 * 프로필 정보 업데이트를 위한 서버 액션
 */
export async function updateUserProfile(formData: FormData) {
  try {
    const userId = await getAuthenticatedUserId();

    const name = formData.get("name") as string;
    const age = parseInt(formData.get("age") as string) || null;
    const occupation = formData.get("occupation") as string;

    const { error } = await supabaseServer
      .from("users")
      .update({
        name,
        age,
        occupation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "프로필 업데이트에 실패했습니다." };
  }
}

/**
 * 설문조사 시작을 위한 서버 액션
 */
export async function startSurveyAction(templateId: string) {
  try {
    const userId = await getAuthenticatedUserId();

    // 사용자 설문 생성
    const { data, error } = await supabaseServer
      .from("user_surveys")
      .insert({
        user_id: userId,
        survey_template_id: templateId,
        completed: false,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create survey");
    }

    return { success: true, surveyId: data.id };
  } catch (error) {
    console.error("Survey start error:", error);
    return { success: false, error: "설문 시작에 실패했습니다." };
  }
}

/**
 * 설문조사 완료를 위한 서버 액션
 */
export async function completeSurveyAction(
  surveyId: string,
  responses: Array<{ questionId: string; optionId: string }>
) {
  try {
    const userId = await getAuthenticatedUserId();

    // 사용자 설문에 대한 응답 저장
    for (const response of responses) {
      const { error } = await supabaseServer.from("user_responses").insert({
        user_survey_id: surveyId,
        question_id: response.questionId,
        option_id: response.optionId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }
    }

    // 설문 완료로 업데이트
    const { error } = await supabaseServer
      .from("user_surveys")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", surveyId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    // 사용자의 설문 완료 상태 업데이트
    await supabaseServer
      .from("users")
      .update({
        is_survey_completed: true,
      })
      .eq("id", userId);

    return { success: true };
  } catch (error) {
    console.error("Survey completion error:", error);
    return { success: false, error: "설문 완료에 실패했습니다." };
  }
}
