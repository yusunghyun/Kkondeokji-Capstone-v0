"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { QrCode, User, LogOut, Heart, Calendar } from "lucide-react"
import { useUserStore } from "@/shared/store/userStore"
import { useQRCodeStore } from "@/shared/store/qrCodeStore"
import { TagChip } from "@/features/profile/components/tag-chip"
import { QRCodeDisplay } from "@/features/profile/components/qr-code-display"
import { LoadingScreen } from "@/features/survey/components/loading-screen"
import { useAuth } from "@/contexts/AuthContext"
import { getMatchRepo } from "@/core/infra/RepositoryFactory"
import type { Match } from "@/shared/types/domain"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const { currentUser, profile, fetchProfile } = useUserStore()
  const { user, signOut } = useAuth()
  const { userQRCode, generateQRCode } = useQRCodeStore()
  const [isLoading, setIsLoading] = useState(true)
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    const initProfile = async () => {
      if (!user) {
        return
      }

      try {
        // Fetch user profile
        await fetchProfile(user.id)

        // Generate QR code if not already generated
        if (!userQRCode) {
          await generateQRCode(user.id)
        }

        // Fetch user matches
        const userMatches = await getMatchRepo().getUserMatches(user.id)
        setMatches(userMatches)
      } catch (error) {
        console.error("Error initializing profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initProfile()
  }, [fetchProfile, generateQRCode, router, userQRCode, user])

  if (!user || !profile) {
    return <LoadingScreen />
  }

  const profileUrl = userQRCode
    ? `${window.location.origin}/match/${userQRCode.code}`
    : `${window.location.origin}/match/${profile.id}`

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <nav className="py-4 px-6 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary-500">
          껀덕지
        </Link>
        <Button variant="ghost" className="text-gray-600 hover:text-primary-500" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </nav>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">내 프로필</h1>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-primary-500" />
              {profile.name || "사용자"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.age && (
                <div>
                  <span className="text-sm text-gray-500">나이:</span> {profile.age}세
                </div>
              )}

              {profile.occupation && (
                <div>
                  <span className="text-sm text-gray-500">직업:</span> {profile.occupation}
                </div>
              )}

              <div>
                <span className="text-sm text-gray-500 block mb-2">관심사:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.length > 0 ? (
                    profile.interests.map((interest, index) => <TagChip key={index} label={interest} />)
                  ) : (
                    <span className="text-gray-400">아직 관심사가 없습니다</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="qrcode" className="flex-1">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="qrcode">QR 코드</TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              매칭 기록 ({matches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">내 QR 코드</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {userQRCode ? (
                  <QRCodeDisplay userId={profile.id} profileUrl={profileUrl} />
                ) : (
                  <Button onClick={() => generateQRCode(profile.id)}>QR 코드 생성하기</Button>
                )}

                <p className="text-sm text-gray-500 mt-4 text-center">
                  이 QR 코드를 스캔하면 상대방과 바로 매칭할 수 있습니다
                </p>
              </CardContent>
            </Card>

            <Button className="w-full bg-secondary-500 hover:bg-secondary-600" onClick={() => router.push("/scan")}>
              <QrCode className="mr-2 h-4 w-4" />
              다른 사람 QR 스캔하기
            </Button>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {matches.length > 0 ? (
              matches.map((match) => (
                <Card
                  key={match.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    // Create a temporary QR code for this match to view the report
                    const otherUserId = match.user1Id === user.id ? match.user2Id : match.user1Id
                    router.push(`/match/report/${match.id}`)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            match.matchScore >= 80
                              ? "bg-pink-500"
                              : match.matchScore >= 60
                                ? "bg-purple-500"
                                : match.matchScore >= 40
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                          }`}
                        >
                          {match.matchScore}
                        </div>
                        <div>
                          <p className="font-medium">매칭 점수: {match.matchScore}점</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(match.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          공통 관심사 {match.commonInterests?.tags?.length || 0}개
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-600 mb-4">아직 매칭 기록이 없습니다</p>
                <Button className="bg-secondary-500 hover:bg-secondary-600" onClick={() => router.push("/scan")}>
                  <QrCode className="mr-2 h-4 w-4" />
                  QR 코드 스캔하기
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
