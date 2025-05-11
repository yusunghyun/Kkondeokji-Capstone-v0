import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/supabase";

// 브라우저 환경에서만 실행되도록 확인
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// 싱글톤 패턴으로 구현하여 하나의 인스턴스만 생성되도록 함
const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL과 Anon Key가 설정되지 않았습니다.");
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true },
  });

  return supabaseInstance;
};

export const supabase = getSupabaseClient();
