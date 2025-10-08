"use client";

import { supabase, resetSupabaseClient } from "@/lib/supabase";

/**
 * 세션 관리자
 * 멀티 디바이스/브라우저 환경에서 세션 충돌을 방지하고 관리합니다.
 */

/**
 * 세션 상태 검증
 * @returns 세션 유효성 여부
 */
export async function validateSession(): Promise<boolean> {
  try {
    console.log("🔍 세션 검증 시작");

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ 세션 조회 에러:", error.message);
      return false;
    }

    if (!session) {
      console.log("ℹ️ 활성 세션 없음");
      return false;
    }

    // 세션 만료 확인
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      console.warn("⚠️ 세션 만료됨");
      return false;
    }

    console.log("✅ 세션 유효함");
    return true;
  } catch (error) {
    console.error("❌ 세션 검증 중 예외:", error);
    return false;
  }
}

/**
 * 세션 강제 새로고침
 * 토큰을 새로 받아옵니다.
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log("🔄 세션 새로고침 시작");

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error("❌ 세션 새로고침 실패:", error.message);
      return false;
    }

    if (!session) {
      console.warn("⚠️ 새로고침 후에도 세션 없음");
      return false;
    }

    console.log("✅ 세션 새로고침 성공");
    return true;
  } catch (error) {
    console.error("❌ 세션 새로고침 중 예외:", error);
    return false;
  }
}

/**
 * 세션 완전 초기화 및 재설정
 * Supabase 클라이언트를 완전히 재설정합니다.
 */
export async function resetSession(): Promise<void> {
  console.log("🔄 세션 완전 초기화 시작");

  try {
    // 1. 로그아웃
    await supabase.auth.signOut({ scope: "global" });

    // 2. 클라이언트 재설정
    resetSupabaseClient();

    // 3. 스토리지 정리
    if (typeof window !== "undefined") {
      // 모든 auth 관련 키 제거
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (
          key.includes("supabase") ||
          key.includes("sb-") ||
          key.includes("auth")
        ) {
          localStorage.removeItem(key);
        }
      });

      sessionStorage.clear();
    }

    console.log("✅ 세션 완전 초기화 완료");
  } catch (error) {
    console.error("❌ 세션 초기화 중 오류:", error);
  }
}

/**
 * 세션 건강 체크
 * 세션 상태를 종합적으로 확인하고 필요시 복구를 시도합니다.
 */
export async function healthCheckSession(): Promise<{
  healthy: boolean;
  message: string;
}> {
  console.log("🏥 세션 건강 체크 시작");

  try {
    // 1. 세션 존재 여부 확인
    const isValid = await validateSession();
    if (!isValid) {
      console.log("⚠️ 세션 유효하지 않음 - 새로고침 시도");

      // 2. 세션 새로고침 시도
      const refreshed = await refreshSession();
      if (refreshed) {
        return {
          healthy: true,
          message: "세션이 새로고침되었습니다",
        };
      } else {
        return {
          healthy: false,
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
        };
      }
    }

    return {
      healthy: true,
      message: "세션이 정상입니다",
    };
  } catch (error) {
    console.error("❌ 세션 건강 체크 실패:", error);
    return {
      healthy: false,
      message: "세션 확인 중 오류가 발생했습니다",
    };
  }
}

/**
 * 브라우저 간 세션 동기화 체크
 * 다른 브라우저나 탭에서 로그아웃이 발생했는지 확인합니다.
 */
export function setupSessionSyncListener(
  onSessionInvalidated: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorageChange = (e: StorageEvent) => {
    // Supabase 토큰이 제거되면 세션이 무효화된 것
    if (e.key === "kkondeokji-auth-token" && !e.newValue) {
      console.warn("⚠️ 다른 탭/브라우저에서 로그아웃 감지");
      onSessionInvalidated();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // cleanup 함수 반환
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}

/**
 * 세션 디버그 정보 출력
 * 개발 시 세션 상태를 확인하는 용도
 */
export async function debugSession(): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.group("🔍 세션 디버그 정보");

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("세션: 없음");
    } else {
      console.log("사용자 ID:", session.user.id);
      console.log("이메일:", session.user.email);
      console.log(
        "만료 시간:",
        session.expires_at
          ? new Date(session.expires_at * 1000).toLocaleString("ko-KR")
          : "알 수 없음"
      );
      console.log(
        "액세스 토큰:",
        session.access_token?.substring(0, 20) + "..."
      );
      console.log(
        "리프레시 토큰:",
        session.refresh_token?.substring(0, 20) + "..."
      );
    }

    // 로컬 스토리지 상태
    if (typeof window !== "undefined") {
      console.log("\n📦 로컬 스토리지:");
      const authUser = localStorage.getItem("auth_user");
      console.log("캐시된 사용자:", authUser ? JSON.parse(authUser) : "없음");

      const allKeys = Object.keys(localStorage).filter(
        (key) =>
          key.includes("supabase") ||
          key.includes("sb-") ||
          key.includes("auth")
      );
      console.log("인증 관련 키:", allKeys);
    }
  } catch (error) {
    console.error("디버그 정보 출력 실패:", error);
  }

  console.groupEnd();
}
