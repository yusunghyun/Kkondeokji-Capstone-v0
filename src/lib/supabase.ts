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
      // 멀티 탭/디바이스 세션 충돌 방지
      flowType: "pkce", // PKCE 플로우 사용 (보안 강화)
      storage: {
        getItem: (key) => {
          if (typeof window === "undefined") {
            return null;
          }
          try {
            const data = localStorage.getItem(key);
            return data;
          } catch (error) {
            console.warn("Error reading from localStorage:", error);
            return null;
          }
        },
        setItem: (key, value) => {
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(key, value);
            } catch (error) {
              console.warn("Error writing to localStorage:", error);
            }
          }
        },
        removeItem: (key) => {
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem(key);
            } catch (error) {
              console.warn("Error removing from localStorage:", error);
            }
          }
        },
      },
      debug: false, // 프로덕션에서는 false
    },
    global: {
      headers: {
        "x-application-name": "kkondeokji",
      },
    },
  });

  return supabaseInstance;
};

// Supabase 클라이언트 재설정 함수 (세션 충돌 시 사용)
export function resetSupabaseClient() {
  console.log("🔄 Supabase 클라이언트 재설정");
  supabaseInstance = null;
}

export const supabase = getSupabaseClient();
