import { create } from "zustand"
import type { QRCode } from "@/shared/types/domain"
import { generateQRCode, getQRCodeByCode } from "@/core/services/QRCodeService"

interface QRCodeState {
  userQRCode: QRCode | null
  scannedQRCode: QRCode | null
  isLoading: boolean
  error: string | null

  // Actions
  generateQRCode: (userId: string) => Promise<QRCode>
  scanQRCode: (code: string) => Promise<QRCode | null>
  reset: () => void
}

export const useQRCodeStore = create<QRCodeState>()((set, get) => ({
  userQRCode: null,
  scannedQRCode: null,
  isLoading: false,
  error: null,

  generateQRCode: async (userId) => {
    set({ isLoading: true, error: null })

    try {
      const qrCode = await generateQRCode(userId)
      set({ userQRCode: qrCode, isLoading: false })
      return qrCode
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to generate QR code",
        isLoading: false,
      })
      throw error
    }
  },

  scanQRCode: async (code) => {
    set({ isLoading: true, error: null })

    try {
      const qrCode = await getQRCodeByCode(code)
      set({ scannedQRCode: qrCode, isLoading: false })
      return qrCode
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to scan QR code",
        isLoading: false,
      })
      throw error
    }
  },

  reset: () => {
    set({
      scannedQRCode: null,
      error: null,
    })
  },
}))
