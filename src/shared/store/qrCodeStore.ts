import { create } from "zustand";
import { getQRCodeRepo } from "@/core/infra/RepositoryFactory";
import type { QRCode } from "@/shared/types/domain";

interface QRCodeState {
  userQRCode: QRCode | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  generateQRCode: (userId: string) => Promise<QRCode>;
  fetchQRCode: (userId: string) => Promise<QRCode | null>;
  clearError: () => void;
  reset: () => void;
}

export const useQRCodeStore = create<QRCodeState>((set) => ({
  userQRCode: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  reset: () => {
    console.log("qrCodeStore reset 실행");
    set({
      userQRCode: null,
      isLoading: false,
      error: null,
    });
  },

  generateQRCode: async (userId: string, forceNew: boolean = false) => {
    set({ isLoading: true, error: null });
    try {
      console.log("QR 코드 생성 시작 - userId:", userId, "forceNew:", forceNew);

      // 기존 QR 코드 확인
      const existingQRCode = await getQRCodeRepo().getByUserId(userId);

      if (existingQRCode && !forceNew) {
        // 기존 QR 코드가 있지만, 코드 형식이 새 형식인지 확인
        const isOldFormat =
          !existingQRCode.code.includes("-") ||
          existingQRCode.code.length < 10 ||
          existingQRCode.code === "test-qr-user2" ||
          !existingQRCode.code.startsWith(userId.slice(0, 8));

        if (isOldFormat) {
          console.log(
            "기존 QR 코드가 오래된 형식임, 새로 생성:",
            existingQRCode.code
          );
          // 기존 QR 코드 삭제 후 새로 생성
          await getQRCodeRepo().deleteByUserId(userId);
        } else {
          console.log("기존 QR 코드 발견 (새 형식):", existingQRCode.code);
          set({ userQRCode: existingQRCode, isLoading: false });
          return existingQRCode;
        }
      } else if (existingQRCode && forceNew) {
        console.log(
          "기존 QR 코드 삭제 후 새로 생성 (강제 새로고침):",
          existingQRCode.code
        );
        await getQRCodeRepo().deleteByUserId(userId);
      }

      // 새 QR 코드 생성
      console.log("새 QR 코드 생성 중...");
      const qrCode = await getQRCodeRepo().create(userId);
      console.log("✅ QR 코드 생성 완료! 상세 정보:", {
        id: qrCode.id,
        code: qrCode.code,
        userId: qrCode.userId,
        생성시간: qrCode.createdAt,
        만료시간: qrCode.expiresAt,
        URL: `${window.location.origin}/match/${qrCode.code}`,
      });

      set({ userQRCode: qrCode, isLoading: false });
      return qrCode;
    } catch (error) {
      console.error("QR 코드 생성 실패:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "QR 코드 생성에 실패했습니다",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchQRCode: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("QR 코드 조회 시작 - userId:", userId);
      const qrCode = await getQRCodeRepo().getByUserId(userId);

      if (qrCode) {
        console.log("QR 코드 조회 성공:", qrCode.code);
        set({ userQRCode: qrCode, isLoading: false });
        return qrCode;
      } else {
        console.log("QR 코드가 존재하지 않음");
        set({ userQRCode: null, isLoading: false });
        return null;
      }
    } catch (error) {
      console.error("QR 코드 조회 실패:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "QR 코드 조회에 실패했습니다",
        isLoading: false,
      });
      return null;
    }
  },
}));
