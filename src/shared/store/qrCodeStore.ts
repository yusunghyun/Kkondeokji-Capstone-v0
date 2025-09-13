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

  generateQRCode: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("QR 코드 생성 시작 - userId:", userId);

      // 기존 QR 코드 확인
      const existingQRCode = await getQRCodeRepo().getByUserId(userId);

      if (existingQRCode) {
        console.log("기존 QR 코드 발견:", existingQRCode.code);
        set({ userQRCode: existingQRCode, isLoading: false });
        return existingQRCode;
      }

      // 새 QR 코드 생성
      console.log("새 QR 코드 생성 중...");
      const qrCode = await getQRCodeRepo().create(userId);
      console.log("QR 코드 생성 완료:", qrCode.code);

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
