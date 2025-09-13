import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { Heart, Sparkles, MessageCircle, Users, Star } from "lucide-react";
import { TagChip } from "@/features/profile/components/tag-chip";
import type { MatchResult } from "@/shared/types/domain";

interface MatchReportProps {
  matchResult: MatchResult;
  user1Name?: string;
  user2Name?: string;
}

export function MatchReport({
  matchResult,
  user1Name = "당신",
  user2Name = "상대방",
}: MatchReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-pink-600";
    if (score >= 60) return "text-purple-600";
    if (score >= 40) return "text-blue-600";
    return "text-gray-600";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "💕";
    if (score >= 60) return "✨";
    if (score >= 40) return "👍";
    return "🤔";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-pink-500 to-red-500";
    if (score >= 60) return "bg-gradient-to-r from-purple-500 to-pink-500";
    if (score >= 40) return "bg-gradient-to-r from-blue-500 to-purple-500";
    return "bg-gradient-to-r from-gray-400 to-gray-500";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return "완벽한 매칭";
    if (score >= 80) return "환상적인 궁합";
    if (score >= 70) return "훌륭한 매칭";
    if (score >= 60) return "좋은 궁합";
    if (score >= 50) return "괜찮은 매칭";
    if (score >= 40) return "흥미로운 조합";
    return "새로운 만남";
  };

  // 관심사별 가중치 계산 (매칭 점수와 관심사 수를 기반으로)
  const getInterestWeight = (tag: string, index: number, total: number) => {
    // 첫 번째 관심사들에게 더 높은 가중치, 매칭 점수도 고려
    const baseWeight = Math.max(1, Math.ceil(((total - index) / total) * 3));
    const scoreMultiplier = matchResult.score >= 70 ? 1.5 : 1;
    return Math.min(3, Math.ceil(baseWeight * scoreMultiplier));
  };

  return (
    <div className="space-y-6">
      {/* 매칭 점수 카드 - 개선된 디자인 */}
      <Card className="relative overflow-hidden border-2 border-pink-100">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" />
        <CardHeader className="relative text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
            매칭 점수
          </CardTitle>
        </CardHeader>
        <CardContent className="relative text-center space-y-4">
          <div
            className={`text-6xl font-bold ${getScoreColor(
              matchResult.score
            )} drop-shadow-lg`}
          >
            {matchResult.score}
            <span className="text-2xl ml-2 animate-bounce">
              {getScoreEmoji(matchResult.score)}
            </span>
          </div>

          <div className="w-full max-w-xs mx-auto">
            <Progress
              value={matchResult.score}
              className="h-4 bg-gray-200 rounded-full shadow-inner"
            />
          </div>

          {/* 점수 설명 추가 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 mx-auto max-w-sm">
            <p
              className={`font-bold text-lg ${getScoreColor(
                matchResult.score
              )}`}
            >
              {getScoreDescription(matchResult.score)}
            </p>
            <p className="text-gray-600">
              {user1Name}님과 {user2Name}님의 궁합도
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI 인사이트 카드 - 시각적 개선 */}
      {matchResult.aiInsights && (
        <Card className="border-yellow-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500 animate-spin" />
              AI 분석 결과
              <Star className="h-4 w-4 text-yellow-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-l-4 border-yellow-400 shadow-sm">
              <p className="text-gray-700 leading-relaxed text-base font-medium">
                {matchResult.aiInsights}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공통 관심사 카드 - 새로운 TagChip 적용 */}
      {matchResult.commonTags.length > 0 && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              공통 관심사
              <Badge className="bg-blue-500 text-white ml-2">
                {matchResult.commonTags.length}개 발견
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {/* 관심사 중요도별 그룹 */}
            <div className="space-y-4">
              {/* 높은 중요도 관심사 */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  핵심 공통점
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchResult.commonTags
                    .slice(0, Math.ceil(matchResult.commonTags.length / 2))
                    .map((tag, index) => (
                      <TagChip
                        key={`high-${index}`}
                        label={tag}
                        size="lg"
                        weight={getInterestWeight(
                          tag,
                          index,
                          matchResult.commonTags.length
                        )}
                        className="shadow-sm"
                      />
                    ))}
                </div>
              </div>

              {/* 일반 관심사 */}
              {matchResult.commonTags.length > 3 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    추가 공통점
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.commonTags
                      .slice(Math.ceil(matchResult.commonTags.length / 2))
                      .map((tag, index) => (
                        <TagChip
                          key={`low-${index}`}
                          label={tag}
                          size="md"
                          weight={1}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 관심사 통계 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">
                  🎯 공통 관심사가 많을수록 대화가 더 풍성해요!
                </span>
                <span className="text-blue-600 font-bold">
                  {matchResult.commonTags.length}/10
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공통 응답 카드 - 시각적 개선 */}
      {matchResult.commonResponses.length > 0 && (
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              같은 답변들
              <Badge className="bg-green-500 text-white ml-2">
                {matchResult.commonResponses.length}개 일치
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {matchResult.commonResponses.map((response, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-l-4 border-green-400 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  {response.question}
                </p>
                <p className="text-green-700 font-semibold pl-8">
                  💬 "{response.answer}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 대화 시작 제안 - 개선된 UI */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-indigo-700 flex items-center justify-center gap-2">
            <MessageCircle className="h-5 w-5" />
            💬 대화 시작 제안
            <Sparkles className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matchResult.commonResponses.slice(0, 3).map((response, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition-all hover:scale-[1.02]"
              >
                <p className="text-sm text-gray-700 font-medium flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">💭</span>"
                  <span className="text-indigo-600 font-semibold">
                    {response.answer}
                  </span>
                  "에 대해 더 자세히 이야기해보는 건 어떨까요?
                </p>
              </div>
            ))}
            {matchResult.commonResponses.length === 0 && (
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-100">
                <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                  <span className="text-indigo-500">🌟</span>
                  서로의 다른 취향에 대해 궁금한 점을 물어보세요! 차이점이
                  새로운 매력이 될 수 있어요.
                </p>
              </div>
            )}
          </div>

          {/* 추가 대화 팁 */}
          <div className="mt-4 p-3 bg-white/50 rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-600 text-center font-medium">
              💡 팁: 공통 관심사로 대화를 시작하고, 서로의 경험을 나눠보세요!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
