"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Maximize2, Share2 } from "lucide-react"
import QRCode from "react-qr-code"
import { cn } from "@/shared/utils/cn"

interface QRCodeDisplayProps {
  userId: string
  profileUrl: string
}

export function QRCodeDisplay({ userId, profileUrl }: QRCodeDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "껀덕지 프로필",
          text: "내 껀덕지 프로필을 확인해보세요!",
          url: profileUrl,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(profileUrl)
      alert("프로필 링크가 클립보드에 복사되었습니다!")
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Card className={cn("p-4 bg-white", isExpanded ? "w-full max-w-xs" : "w-64 h-64")}>
        <CardContent className="flex items-center justify-center p-0">
          <QRCode value={profileUrl} size={isExpanded ? 256 : 200} className="mx-auto" />
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)} className="flex items-center">
          <Maximize2 className="mr-2 h-4 w-4" />
          {isExpanded ? "축소" : "확대"}
        </Button>

        <Button onClick={handleShare} className="flex items-center">
          <Share2 className="mr-2 h-4 w-4" />
          공유하기
        </Button>
      </div>
    </div>
  )
}
