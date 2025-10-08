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
  console.log("로그아웃 시도");
  try {
    // 1. Supabase 로그아웃 실행
    const { error } = await supabase.auth.signOut({
      scope: "global", // 모든 세션에서 로그아웃
    });

    if (error) {
      console.error("Supabase 로그아웃 실패:", error.message);
      // 에러가 있어도 계속 진행 (로컬 정리는 해야 함)
    }

    // 2. 로컬 스토리지 정리
    if (typeof window !== "undefined") {
      // Supabase 관련 스토리지 정리
      localStorage.removeItem(
        "sb-" +
          process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "").replace(
            ".supabase.co",
            ""
          ) +
          "-auth-token"
      );
      localStorage.removeItem("kkondeokji-auth-token");

      // 세션 스토리지도 정리
      sessionStorage.clear();

      console.log("로컬 스토리지 정리 완료");
    }

    console.log("로그아웃 성공");
  } catch (error) {
    console.error("로그아웃 중 예외 발생:", error);

    // 에러가 발생해도 로컬 정리는 시도
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      console.log("에러 발생으로 전체 스토리지 정리");
    }

    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log("🔍 현재 사용자 조회 시도");

    // 브라우저 환경에서 localStorage에서 직접 확인 (타임아웃 방지)
    if (typeof window !== "undefined") {
      // 이미 로그인된 사용자 정보가 있는지 확인
      const cachedUser = localStorage.getItem("auth_user");
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          if (parsedUser && parsedUser.id && parsedUser.email) {
            console.log("✅ 캐시된 사용자 정보 사용:", parsedUser.id);
            return parsedUser as AuthUser;
          }
        } catch (e) {
          console.warn("캐시된 사용자 정보 파싱 실패:", e);
          // 캐시 삭제
          localStorage.removeItem("auth_user");
        }
      }
    }

    // 타임아웃 추가 (10초로 증가)
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Session check timeout")), 10000)
    );

    const { data, error } = (await Promise.race([
      sessionPromise,
      timeoutPromise,
    ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

    if (error) {
      console.error("❌ 세션 조회 실패:", error.message);
      return null;
    }

    console.log("✅ 세션 조회 결과:", data.session ? "세션 있음" : "세션 없음");

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
  } catch (error) {
    console.error("❌ 사용자 조회 중 예외 발생:", error);
    return null;
  }
}
