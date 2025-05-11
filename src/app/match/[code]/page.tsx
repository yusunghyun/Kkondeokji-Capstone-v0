"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ArrowLeft, MessageCircle, Share2 } from "lucide-react"
import { useUserStore } from "@/shared/store/userStore"
import { useQRCodeStore } from "@/shared/store/qrCodeStore"
import { useMatchStore } from "@/shared/store/matchStore"
import { useSurveyStore } from "@/shared/store/surveyStore"
import { MatchGauge } from "@/features/match/components/match-gauge"
import { CommonList } from "@/features/match/components/common-list"
import { SmallTalkCard } from "@/features/match/components/small-talk-card"
import { LoadingScreen } from "@/features/survey/components/loading-screen"
import { AskBox } from "@/features/askbox/components/ask-box"

export default function MatchPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const { currentUser } = useUserStore()
  const { scannedQRCode, scanQRCode } = useQRCodeStore()
  const { currentMatch, calculateMatch } = useMatchStore()
  const { userSurveyId } = useSurveyStore()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAskBox, setShowAskBox] = useState(false)

  useEffect(() => {
    const initMatch = async () => {
      if (!currentUser) {
        router.push("/onboarding")
        return
      }

      if (!userSurveyId) {
        router.push("/survey")
        return
      }

      try {
        // Scan QR code if not already scanned
        const code = params.code
        let qrCode = scannedQRCode

        if (!qrCode) {
          qrCode = await scanQRCode(code)

          if (!qrCode) {
            setError("유효하지 않은 QR 코드입니다")
            setIsLoading(false)
            return
          }
        }

        // Calculate match
        await calculateMatch(
          currentUser.id,
          qrCode.userId,
          userSurveyId,
          // In a real app, we would fetch the other user's survey ID
          // For now, we'll use a mock value
          "mock-survey-id",
        )

        setIsLoading(false)
      } catch (error) {
        setError(error instanceof Error ? error.message : "매칭 중 오류가 발생했습니다")
        setIsLoading(false)
      }
    }

    initMatch()
  }, [calculateMatch, currentUser, params.code, router, scanQRCode, scannedQRCode, userSurveyId])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error || !currentMatch) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-500 mb-4">오류가 발생했습니다</h2>
          <p className="mb-4">{error || "매칭 정보를 불러올 수 없습니다"}</p>
          <Button onClick={() => router.push("/profile")}>프로필로 돌아가기</Button>
        </Card>
      </div>
    )
  }

  // Generate conversation starters if AI insights are not available
  const conversationStarters = currentMatch.aiInsights
    ? []
    : currentMatch.commonResponses.map((r) => `${r.question}에 대해 둘 다 "${r.answer}"라고 답했네요!`)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800">매칭 결과</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">매칭 점수</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <MatchGauge score={currentMatch.score} />

          <div className="mt-4 text-center">
            <h3 className="font-medium text-lg">공통 관심사</h3>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {currentMatch.commonTags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {currentMatch.aiInsights ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="prose prose-sm">
              <p>{currentMatch.aiInsights}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <CommonList
            items={currentMatch.commonResponses.map((r) => ({
              text: `${r.question} - ${r.answer}`,
            }))}
            title="공통 응답"
          />

          {conversationStarters.length > 0 && (
            <div className="mt-4">
              <SmallTalkCard suggestions={conversationStarters} />
            </div>
          )}
        </>
      )}

      <div className="mt-auto pt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.push("/profile")}>
          <Share2 className="mr-2 h-4 w-4" />내 QR 공유하기
        </Button>

        <Button className="flex-1 bg-primary-500 hover:bg-primary-600" onClick={() => setShowAskBox(true)}>
          <MessageCircle className="mr-2 h-4 w-4" />
          질문하기
        </Button>
      </div>

      {showAskBox && <AskBox userId={scannedQRCode?.userId || ""} onClose={() => setShowAskBox(false)} />}
    </div>
  )
}
