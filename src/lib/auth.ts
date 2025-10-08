"use client";

import { supabase } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string;
};

export async function signUp(email: string, password: string) {
  console.log("회원가입 시도:", email);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("회원가입 실패:", error.message);
      throw new Error(error.message);
    }

    console.log("회원가입 성공:", data.user?.id);
    return data.user;
  } catch (error) {
    console.error("회원가입 중 예외 발생:", error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  console.log("로그인 시도:", email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("로그인 실패:", error.message);
      throw new Error(error.message);
    }

    console.log("로그인 성공:", data.user?.id);
    return data.user;
  } catch (error) {
    console.error("로그인 중 예외 발생:", error);
    throw error;
  }
}

export async function signOut() {
  console.log("🔄 로그아웃 시도 - 강화된 버전");

  try {
    // 1. 모든 스토리지 정리 (먼저 실행)
    clearAllStorages();

    // 2. Supabase 로그아웃 실행 (타임아웃 적용)
    try {
      const logoutPromise = supabase.auth.signOut({
        scope: "global", // 모든 세션에서 로그아웃
      });

      // 3초 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Logout timeout")), 3000)
      );

      const { error } = (await Promise.race([
        logoutPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("⚠️ Supabase 로그아웃 API 에러:", error.message);
        // 에러가 있어도 계속 진행
      } else {
        console.log("✅ Supabase 로그아웃 API 성공");
      }
    } catch (logoutError) {
      console.error(
        "⚠️ Supabase 로그아웃 실패 (타임아웃 또는 에러):",
        logoutError
      );
      // 실패해도 계속 진행
    }

    // 3. 추가 정리 작업
    try {
      // Supabase 인스턴스 재설정 시도
      if (typeof window !== "undefined") {
        // @ts-ignore - 내부 캐시 초기화 시도
        supabase.auth.session = null;
      }
    } catch (resetError) {
      console.error("⚠️ Supabase 인스턴스 재설정 실패:", resetError);
    }

    console.log("✅ 로그아웃 성공");

    // 4. 페이지 리로드 준비 - 로그인 페이지로 리디렉션
    if (typeof window !== "undefined") {
      // 약간의 지연 후 리디렉션 (스토리지 정리 완료 보장)
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 100);
    }
  } catch (error) {
    console.error("❌ 로그아웃 중 예외 발생:", error);

    // 에러가 발생해도 전체 스토리지 정리 시도
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();

      // 강제 리디렉션
      window.location.href = "/auth/login?error=logout_failed";
    }

    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log("🔍 현재 사용자 조회 시도");

    // 1. 브라우저 환경에서 localStorage에서 직접 확인 (타임아웃 방지)
    if (typeof window !== "undefined") {
      // 이미 로그인된 사용자 정보가 있는지 확인
      const cachedUser = localStorage.getItem("auth_user");
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          if (parsedUser && parsedUser.id && parsedUser.email) {
            console.log("✅ 캐시된 사용자 정보 사용:", parsedUser.id);

            // 캐시된 사용자 정보 사용 시 세션 유효성 체크 (백그라운드)
            setTimeout(() => {
              supabase.auth.getSession().then(({ data }) => {
                if (!data.session) {
                  console.log(
                    "⚠️ 캐시된 사용자 정보가 있지만 세션이 만료됨 - 로그아웃 필요"
                  );
                  if (typeof window !== "undefined") {
                    // 캐시 삭제
                    localStorage.removeItem("auth_user");
                    // 다른 스토리지 정리
                    clearAllStorages();
                    // 페이지 새로고침
                    window.location.href = "/auth/login";
                  }
                }
              });
            }, 0);

            return parsedUser as AuthUser;
          }
        } catch (e) {
          console.warn("캐시된 사용자 정보 파싱 실패:", e);
          // 캐시 삭제
          localStorage.removeItem("auth_user");
        }
      }
    }

    // 2. Supabase 세션 체크 (타임아웃 적용)
    try {
      // 타임아웃 감소 (5초로)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await supabase.auth.getSession();

      clearTimeout(timeoutId);

      if (error) {
        console.error("❌ 세션 조회 실패:", error.message);
        return null;
      }

      console.log(
        "✅ 세션 조회 결과:",
        data.session ? "세션 있음" : "세션 없음"
      );

      if (!data.session) {
        console.log("ℹ️ 로그인되지 않은 사용자");
        return null;
      }

      const authUser = {
        id: data.session.user.id,
        email: data.session.user.email || "",
      };

      // 사용자 정보를 로컬 스토리지에 캐싱 (타임아웃 방지)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("auth_user", JSON.stringify(authUser));
          console.log("✅ 사용자 정보 캐싱 완료");
        } catch (e) {
          console.warn("사용자 정보 캐싱 실패:", e);
        }
      }

      console.log("✅ 현재 사용자:", authUser.id, authUser.email);
      return authUser;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.error(
          "⚠️ 세션 조회 타임아웃 - 캐시된 정보 삭제 및 로그아웃 처리"
        );
        // 모든 스토리지 정리
        if (typeof window !== "undefined") {
          clearAllStorages();
          // 로그인 페이지로 리디렉션
          window.location.href = "/auth/login";
        }
        return null;
      }

      console.error("❌ 세션 조회 중 예외 발생:", error);
      return null;
    }
  } catch (error) {
    console.error("❌ 사용자 조회 중 예외 발생:", error);
    return null;
  }
}

// 모든 스토리지 정리 함수
function clearAllStorages() {
  if (typeof window === "undefined") return;

  console.log("🧹 모든 스토리지 정리 시작");

  try {
    // 로컬 스토리지 정리
    localStorage.removeItem("auth_user");
    localStorage.removeItem("user-store");
    localStorage.removeItem("kkondeokji-auth-token");

    // Supabase 관련 스토리지 정리
    const supabaseKey =
      "sb-" +
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "").replace(
        ".supabase.co",
        ""
      );

    localStorage.removeItem(supabaseKey + "-auth-token");

    // 쿠키 정리
    document.cookie =
      "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // 세션 스토리지 정리
    sessionStorage.clear();

    console.log("✅ 모든 스토리지 정리 완료");
  } catch (error) {
    console.error("❌ 스토리지 정리 중 오류:", error);
  }
}
