import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import { Heart, Sparkles, MessageCircle, Users } from "lucide-react"
import type { MatchResult } from "@/shared/types/domain"

interface MatchReportProps {
  matchResult: MatchResult
  user1Name?: string
  user2Name?: string
}

export function MatchReport({ matchResult, user1Name = "당신", user2Name = "상대방" }: MatchReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-pink-600"
    if (score >= 60) return "text-purple-600"
    if (score >= 40) return "text-blue-600"
    return "text-gray-600"
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "💕"
    if (score >= 60) return "✨"
    if (score >= 40) return "👍"
    return "🤔"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-pink-500 to-red-500"
    if (score >= 60) return "bg-gradient-to-r from-purple-500 to-pink-500"
    if (score >= 40) return "bg-gradient-to-r from-blue-500 to-purple-500"
    return "bg-gradient-to-r from-gray-400 to-gray-500"
  }

  return (
    <div className="space-y-6">
      {/* 매칭 점수 카드 */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50" />
        <CardHeader className="relative text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-pink-500" />
            매칭 점수
          </CardTitle>
        </CardHeader>
        <CardContent className="relative text-center space-y-4">
          <div className={`text-6xl font-bold ${getScoreColor(matchResult.score)}`}>
            {matchResult.score}
            <span className="text-2xl ml-2">{getScoreEmoji(matchResult.score)}</span>
          </div>

          <div className="w-full max-w-xs mx-auto">
            <Progress value={matchResult.score} className="h-3 bg-gray-200" />
          </div>

          <p className="text-gray-600 text-lg">
            {user1Name}과 {user2Name}의 궁합도
          </p>
        </CardContent>
      </Card>

      {/* AI 인사이트 카드 */}
      {matchResult.aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <p className="text-gray-700 leading-relaxed">{matchResult.aiInsights}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공통 관심사 카드 */}
      {matchResult.commonTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              공통 관심사
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {matchResult.commonTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공통 응답 카드 */}
      {matchResult.commonResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              같은 답변들
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchResult.commonResponses.map((response, index) => (
              <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                <p className="font-medium text-green-800 mb-1">{response.question}</p>
                <p className="text-green-700">→ {response.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 대화 시작 제안 */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-center text-indigo-700">💬 대화 시작 제안</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {matchResult.commonResponses.slice(0, 3).map((response, index) => (
              <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">"{response.answer}"에 대해 어떻게 생각하세요?</p>
              </div>
            ))}
            {matchResult.commonResponses.length === 0 && (
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">서로의 다른 취향에 대해 궁금한 점을 물어보세요!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
