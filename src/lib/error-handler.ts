"use client";

import { toast } from "sonner";

/**
 * API 에러를 처리하고 토스트 알림을 표시합니다.
 */
export function handleApiError(
  error: unknown,
  fallbackMessage = "오류가 발생했습니다. 다시 시도해주세요."
): void {
  console.error("API 오류:", error);

  // Supabase 에러 형식 확인
  if (error && typeof error === "object" && "message" in error) {
    toast.error(error.message as string);
    return;
  }

  // 문자열 에러 확인
  if (typeof error === "string") {
    toast.error(error);
    return;
  }

  // 일반 Error 객체 확인
  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  // 그 외 알 수 없는 에러 형식
  toast.error(fallbackMessage);
}

/**
 * 성공 메시지를 표시합니다.
 */
export function showSuccess(message: string): void {
  toast.success(message);
}

/**
 * 정보 메시지를 표시합니다.
 */
export function showInfo(message: string): void {
  toast.info(message);
}

/**
 * 경고 메시지를 표시합니다.
 */
export function showWarning(message: string): void {
  toast.warning(message);
}
