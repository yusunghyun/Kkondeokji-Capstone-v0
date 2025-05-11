"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase-types";

// 싱글톤 인스턴스 저장 변수
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// 싱글톤 패턴으로 구현하여 하나의 인스턴스만 생성되도록 함
const getSupabaseClient = () => {
  // 이미 인스턴스가 있으면 재사용
  if (supabaseInstance) return supabaseInstance;

  // 환경 변수 체크
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL과 Anon Key가 설정되지 않았습니다.");
  }

  // 인스턴스 생성
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
};

export const supabase = getSupabaseClient();
