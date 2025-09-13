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
      storageKey: "kkondeokji-auth-token",
      storage: {
        getItem: (key) => {
          if (typeof window === "undefined") {
            return null;
          }
          const data = localStorage.getItem(key);
          console.log(
            `Auth storage getItem: ${key}`,
            data ? "데이터 있음" : "데이터 없음"
          );
          return data;
        },
        setItem: (key, value) => {
          if (typeof window !== "undefined") {
            console.log(`Auth storage setItem: ${key}`);
            localStorage.setItem(key, value);
          }
        },
        removeItem: (key) => {
          if (typeof window !== "undefined") {
            console.log(`Auth storage removeItem: ${key}`);
            localStorage.removeItem(key);
          }
        },
      },
      debug: process.env.NODE_ENV === "development",
    },
  });

  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// 세션 디버깅을 위한 함수 (개발 환경에서만 사용)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // 5초마다 세션 상태 확인
  const checkSession = async () => {
    const instance = getSupabaseClient();
    const { data } = await instance.auth.getSession();
    console.log(
      "Current session check:",
      data.session ? "세션 있음" : "세션 없음"
    );
  };

  // 초기 확인 후 5초마다 확인
  checkSession();
  setInterval(checkSession, 5000);
}
