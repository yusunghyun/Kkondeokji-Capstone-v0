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
    // 세션 갱신 시도
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn("세션 갱신 실패, 로그아웃 계속 진행:", refreshError.message);
    }

    // 로그아웃 실행
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 실패:", error.message);
      throw new Error(error.message);
    }

    console.log("로그아웃 성공");
  } catch (error) {
    console.error("로그아웃 중 예외 발생:", error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log("현재 사용자 조회 시도");
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("세션 조회 실패:", error.message);
      return null;
    }

    console.log("세션 조회 결과:", data.session ? "세션 있음" : "세션 없음");

    if (!data.session) {
      return null;
    }

    const authUser = {
      id: data.session.user.id,
      email: data.session.user.email || "",
    };

    console.log("현재 사용자:", authUser.id);
    return authUser;
  } catch (error) {
    console.error("사용자 조회 중 예외 발생:", error);
    return null;
  }
}
