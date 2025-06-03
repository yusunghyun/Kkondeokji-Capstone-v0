"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getMatchRepo, getUserRepo } from "@/core/infra/RepositoryFactory"
import { MatchReport } from "@/features/match/components/match-report"
import { LoadingScreen } from "@/features/survey/components/loading-screen"
import type { Match, User } from "@/shared/types/domain"

export default function MatchReportPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMatchReport = async () => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      try {
        const matchData = await getMatchRepo().getById(params.id)

        if (!matchData) {
          setError("매칭 정보를 찾을 수 없습니다")
          return
        }

        // Check if current user is part of this match
        if (matchData.user1Id !== user.id && matchData.user2Id !== user.id) {
          setError("이 매칭 결과를 볼 권한이 없습니다")
          return
        }

        setMatch(matchData)

        // Get the other user's info
        const otherUserId = matchData.user1Id === user.id ? matchData.user2Id : matchData.user1Id
        const otherUserData = await getUserRepo().getById(otherUserId)
        setOtherUser(otherUserData)
      } catch (error) {
        console.error("Error loading match report:", error)
        setError("매칭 리포트를 불러오는 중 오류가 발생했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    loadMatchReport()
  }, [params.id, router, user])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error || !match) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <div className="w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">오류가 발생했습니다</h2>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.push("/profile")}>프로필로 돌아가기</Button>
        </div>
      </div>
    )
  }

  const matchResult = {
    score: match.matchScore,
    commonTags: match.commonInterests?.tags || [],
    commonResponses: match.commonInterests?.responses || [],
    aiInsights: match.aiInsights,
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800">매칭 리포트</h1>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full">
        <MatchReport
          matchResult={matchResult}
          user1Name={user.user_metadata?.name || "당신"}
          user2Name={otherUser?.name || "상대방"}
        />
      </div>

      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={() => router.push("/profile")}>
          프로필로 돌아가기
        </Button>
      </div>
    </div>
  )
}
