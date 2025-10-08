"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, signIn, signUp, signOut, AuthUser } from "@/lib/auth";
import { useUserStore } from "@/shared/store/userStore";
import { useSurveyStore } from "@/shared/store/surveyStore";
import { useQRCodeStore } from "@/shared/store/qrCodeStore";
import { useMatchStore } from "@/shared/store/matchStore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout: userStoreLogout, fetchProfile } = useUserStore();
  const { reset: surveyStoreReset } = useSurveyStore();
  const { reset: qrCodeStoreReset } = useQRCodeStore();
  const { clearMatch: matchStoreClear } = useMatchStore();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 초기 로드 및 세션 체크
  useEffect(() => {
    console.log("AuthProvider - 초기 세션 체크");

    const checkSession = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        console.log("초기 세션 체크 결과:", currentUser);

        if (currentUser) {
          setUser(currentUser);

          // 프로필 데이터 로드
          try {
            await fetchProfile(currentUser.id);
            console.log("프로필 로드 완료");
          } catch (profileError) {
            console.error("프로필 로드 실패:", profileError);
          }
        }
      } catch (error) {
        console.error("세션 체크 에러:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 페이지 포커스 시 세션 재검증 (탭 전환 후 돌아왔을 때)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        console.log("🔍 페이지 포커스됨 - 세션 재검증");
        try {
          const { data } = await supabase.auth.getSession();

          // 세션이 없는데 user 상태가 있으면 충돌 발생
          if (!data.session && user) {
            console.warn("⚠️ 세션 충돌 감지 - 로그아웃 처리");
            await handleSignOut();
          }
          // 세션은 있는데 다른 사용자면 재로그인 필요
          else if (data.session && user && data.session.user.id !== user.id) {
            console.warn("⚠️ 다른 사용자 세션 감지 - 강제 로그아웃");
            await handleSignOut();
          }
        } catch (error) {
          console.error("세션 재검증 실패:", error);
        }
      }
    };

    // Storage 이벤트 리스너 (다른 탭에서 로그아웃 시 동기화)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kkondeokji-auth-token" && !e.newValue && user) {
        console.warn("⚠️ 다른 탭에서 로그아웃됨 - 동기화");
        setUser(null);
        userStoreLogout();
        surveyStoreReset();
        qrCodeStoreReset();
        matchStoreClear();

        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("storage", handleStorageChange);
    }

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 인증 상태 변경:", event, session?.user?.id);

      if (event === "SIGNED_IN" && session) {
        const authUser = {
          id: session.user.id,
          email: session.user.email || "",
        };
        console.log("✅ 로그인 성공:", authUser);
        setUser(authUser);

        // 프로필 로드
        try {
          await fetchProfile(authUser.id);
          console.log("✅ 로그인 후 프로필 로드 완료");
        } catch (error) {
          console.error("❌ 로그인 후 프로필 로드 실패:", error);
        }

        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        console.log("🚪 로그아웃 완료");
        userStoreLogout();
        surveyStoreReset();
        qrCodeStoreReset();
        matchStoreClear();
        setUser(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log("🔄 토큰 갱신됨");
        const authUser = {
          id: session.user.id,
          email: session.user.email || "",
        };
        setUser(authUser);

        // 토큰 갱신 시에도 프로필 확인
        try {
          await fetchProfile(authUser.id);
          console.log("✅ 토큰 갱신 후 프로필 확인 완료");
        } catch (error) {
          console.error("❌ 토큰 갱신 후 프로필 확인 실패:", error);
        }
      } else if (event === "USER_UPDATED" && session) {
        console.log("👤 사용자 정보 업데이트됨");
        const authUser = {
          id: session.user.id,
          email: session.user.email || "",
        };
        setUser(authUser);
      } else if (event === "INITIAL_SESSION") {
        console.log("🎬 초기 세션 확인");
        // 초기 세션은 위의 checkSession에서 이미 처리됨
      }
    });

    return () => {
      subscription.unsubscribe();

      // 이벤트 리스너 정리
      if (typeof window !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, [
    fetchProfile,
    userStoreLogout,
    surveyStoreReset,
    qrCodeStoreReset,
    matchStoreClear,
  ]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("로그인 시도:", email);
      const userData = await signIn(email, password);
      console.log("로그인 성공:", userData);

      // onAuthStateChange에서 처리되므로 여기서는 추가 작업 불필요
      router.push("/");
    } catch (error) {
      console.error("로그인 실패:", error);
      setLoading(false);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("회원가입 시도:", email);
      await signUp(email, password);
      // onAuthStateChange에서 처리됨
    } catch (error) {
      console.error("회원가입 실패:", error);
      setLoading(false);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      console.log("로그아웃 시도");
      setLoading(true);

      // 1. Supabase 로그아웃 실행
      await signOut();

      // 2. 모든 상태 강제 초기화
      setUser(null);
      userStoreLogout(); // 사용자 스토어 데이터 초기화
      surveyStoreReset();
      qrCodeStoreReset();
      matchStoreClear();

      console.log("상태 초기화 완료");

      // 3. 홈으로 리다이렉트 (강제)
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }

      console.log("로그아웃 완료");
    } catch (error) {
      console.error("로그아웃 실패:", error);

      // 에러가 발생해도 상태는 초기화
      setUser(null);
      userStoreLogout();
      surveyStoreReset();
      qrCodeStoreReset();
      matchStoreClear();

      // 강제 리다이렉트
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
