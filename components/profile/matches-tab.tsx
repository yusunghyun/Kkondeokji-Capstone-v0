"use client"

import { Card } from "@/components/ui/card"
import { QrCode } from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"

interface MatchesTabProps {
  onShowQR: () => void
}

export function MatchesTab({ onShowQR }: MatchesTabProps) {
  return (
    <Card className="p-6 text-center">
      <p className="text-gray-600 mb-4">Share your profile to find matches!</p>
      <GradientButton onClick={onShowQR} className="rounded-full">
        <QrCode className="h-4 w-4 mr-2" />
        Generate QR Code
      </GradientButton>
    </Card>
  )
}
