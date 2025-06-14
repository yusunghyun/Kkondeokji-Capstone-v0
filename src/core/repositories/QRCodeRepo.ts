import type { QRCode } from "@/shared/types/domain"

export interface QRCodeRepo {
  create(userId: string): Promise<QRCode>

  getByCode(code: string): Promise<QRCode | null>

  getByUserId(userId: string): Promise<QRCode | null>

  incrementScans(codeId: string): Promise<void>
}
