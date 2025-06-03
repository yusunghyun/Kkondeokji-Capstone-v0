import { getQRCodeRepo, getUserRepo } from "@/core/infra/RepositoryFactory"
import type { QRCode } from "@/shared/types/domain"

export async function generateQRCode(userId: string): Promise<QRCode> {
  // Check if user already has a valid QR code
  const existingCode = await getQRCodeRepo().getByUserId(userId)

  // If exists and not expired, return it
  if (existingCode && (!existingCode.expiresAt || existingCode.expiresAt > new Date())) {
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

export async function getUserByQRCode(code: string): Promise<{ userId: string; userName: string | null } | null> {
  const qrCode = await getQRCodeByCode(code)
  if (!qrCode) return null

  const user = await getUserRepo().getById(qrCode.userId)
  if (!user) return null

  return {
    userId: user.id,
    userName: user.name,
  }
}
