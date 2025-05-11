"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase-types";

// 안전한 서버 측 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials");
}

const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Grok AI API 키
const grokApiKey = process.env.XAI_API_KEY;

if (!grokApiKey) {
  console.warn("Missing Grok API key. AI features will not work correctly.");
}

/**
 * Grok AI API를 호출하여 응답을 받아옵니다.
 */
export async function callGrokAPI(prompt: string, userId?: string) {
  if (!grokApiKey) {
    throw new Error("Grok API key not configured");
  }

  try {
    const response = await fetch("https://api.grok.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-1",
        messages: [
          {
            role: "system",
            content:
              "당신은 껀덕지 앱의 AI 조수입니다. 사용자의 설문조사와 매칭 결과를 분석하고 통찰력 있는 제안을 제공합니다.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();

    // 결과 로깅
    if (userId) {
      await logAIInteraction(userId, prompt, data.choices[0]?.message.content);
    }

    return data.choices[0]?.message.content || "응답을 받지 못했습니다.";
  } catch (error) {
    console.error("Grok API error:", error);
    throw new Error("AI 응답을 받는 데 실패했습니다.");
  }
}

/**
 * AI 상호작용 로그를 저장합니다.
 */
async function logAIInteraction(
  userId: string,
  prompt: string,
  response: string
) {
  try {
    await supabaseServer.from("ai_interactions").insert({
      user_id: userId,
      prompt,
      response,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log AI interaction:", error);
  }
}

/**
 * 사용자 설문 분석 및 추천
 */
export async function analyzeSurveys() {
  try {
    // 최근 완료된 설문 조사 가져오기
    const { data: surveys, error } = await supabaseServer
      .from("user_surveys")
      .select(
        `
        id,
        user_id,
        survey_template_id,
        completed,
        completed_at,
        users (
          id,
          name,
          age,
          occupation
        ),
        user_responses (
          id,
          question_id,
          option_id
        )
      `
      )
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    if (!surveys || surveys.length === 0) {
      console.log("No completed surveys found");
      return;
    }

    // Grok AI에 분석 요청
    const prompt = `
      다음은 최근 완료된 20개의 설문조사 데이터입니다:
      ${JSON.stringify(surveys, null, 2)}
      
      이 데이터를 분석하여 다음 질문에 답해주세요:
      1. 어떤 패턴이나 트렌드가 보이나요?
      2. 새로운 설문 조사를 어떻게 개선할 수 있을까요?
      3. 사용자 매칭을 위한 제안 사항은 무엇인가요?
    `;

    const analysis = await callGrokAPI(prompt);

    // 분석 결과 저장
    await supabaseServer.from("ai_analyses").insert({
      type: "survey_trend",
      content: analysis,
      created_at: new Date().toISOString(),
    });

    return analysis;
  } catch (error) {
    console.error("Survey analysis error:", error);
    throw error;
  }
}

/**
 * 매칭 결과 분석
 */
export async function analyzeMatch(user1Id: string, user2Id: string) {
  try {
    // 두 사용자의 응답 가져오기
    const { data: user1Responses, error: error1 } = await supabaseServer
      .from("user_responses")
      .select(
        `
        question_id,
        option_id,
        questions (text),
        options (text, value)
      `
      )
      .eq("user_id", user1Id);

    const { data: user2Responses, error: error2 } = await supabaseServer
      .from("user_responses")
      .select(
        `
        question_id,
        option_id,
        questions (text),
        options (text, value)
      `
      )
      .eq("user_id", user2Id);

    if (error1 || error2 || !user1Responses || !user2Responses) {
      throw new Error("사용자 응답을 가져오는 데 실패했습니다.");
    }

    // Grok AI에 분석 요청
    const prompt = `
      다음은 두 사용자의 설문 응답 데이터입니다:
      
      사용자 1: ${JSON.stringify(user1Responses, null, 2)}
      
      사용자 2: ${JSON.stringify(user2Responses, null, 2)}
      
      이 두 사용자의 공통점과 차이점을 분석하고, 두 사람이 어떤 주제로 대화를 시작하면 좋을지 추천해주세요. 또한 두 사람이 함께 할 수 있는 활동도 제안해주세요.
    `;

    const analysis = await callGrokAPI(prompt);

    // 분석 결과 저장
    await supabaseServer.from("matches").upsert({
      user1_id: user1Id,
      user2_id: user2Id,
      ai_insights: analysis,
      updated_at: new Date().toISOString(),
    });

    return analysis;
  } catch (error) {
    console.error("Match analysis error:", error);
    throw error;
  }
}
