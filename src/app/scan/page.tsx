"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ArrowLeft, QrCode } from "lucide-react"
import { useQRCodeStore } from "@/shared/store/qrCodeStore"
import { useUserStore } from "@/shared/store/userStore"
import { QrScanner } from "@/features/profile/components/qr-scanner"

export default function ScanPage() {
  const router = useRouter()
  const { currentUser } = useUserStore()
  const { scanQRCode } = useQRCodeStore()
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    // Redirect to onboarding if no user
    if (!currentUser) {
      router.push("/onboarding")
    }
  }, [currentUser, router])

  const handleScan = async (code: string) => {
    setIsScanning(false)

    try {
      const qrCode = await scanQRCode(code)

      if (!qrCode) {
        setError("유효하지 않은 QR 코드입니다")
        return
      }

      // Navigate to match page with the scanned code
      router.push(`/match/${code}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "QR 코드 스캔 중 오류가 발생했습니다")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800">QR 코드 스캔</h1>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center">
            <QrCode className="mr-2 h-5 w-5" />
            QR 코드 스캔하기
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {isScanning ? (
            <div className="w-full max-w-sm">
              <QrScanner onScan={handleScan} onError={(err) => setError(err)} />
              <Button variant="outline" className="mt-4 w-full" onClick={() => setIsScanning(false)}>
                취소
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-6 text-gray-600">상대방의 QR 코드를 스캔하여 매칭을 시작하세요</p>

              <Button className="bg-primary-500 hover:bg-primary-600" onClick={() => setIsScanning(true)}>
                <QrCode className="mr-2 h-4 w-4" />
                스캔 시작하기
              </Button>

              {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
