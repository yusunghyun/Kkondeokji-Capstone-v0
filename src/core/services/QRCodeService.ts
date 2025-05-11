import { getQRCodeRepo } from "@/core/infra/RepositoryFactory"
import type { QRCode } from "@/shared/types/domain"

export async function generateQRCode(userId: string): Promise<QRCode> {
  // Check if user already has a QR code
  const existingCode = await getQRCodeRepo().getByUserId(userId)

  // If exists and not expired, return it
  if (existingCode && existingCode.expiresAt && existingCode.expiresAt > new Date()) {
    return existingCode
  }

  // Otherwise, create a new one
  return getQRCodeRepo().create(userId)
}

export async function getQRCodeByCode(code: string): Promise<QRCode | null> {
  const qrCode = await getQRCodeRepo().getByCode(code)

  // Check if code exists and is not expired
  if (!qrCode || (qrCode.expiresAt && qrCode.expiresAt < new Date())) {
    return null
  }

  // Increment scan count
  await getQRCodeRepo().incrementScans(qrCode.id)

  return qrCode
}
