import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase-types";

// 서버 사이드 전용 Supabase 클라이언트
// API Routes, Server Components, Server Actions에서 사용

let serverSupabaseInstance: ReturnType<typeof createClient<Database>> | null =
  null;

export const getServerSupabase = () => {
  // 이미 인스턴스가 있으면 재사용
  if (serverSupabaseInstance) return serverSupabaseInstance;

  // 환경 변수 체크
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }

  // Service Role Key로 서버 클라이언트 생성
  serverSupabaseInstance = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return serverSupabaseInstance;
};

// 기본 export (싱글톤)
export const supabaseServer = getServerSupabase();
