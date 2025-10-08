"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { ArrowLeft, Sparkles, RefreshCw, Zap, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/shared/store/userStore";
import { getMatchRepo, getUserRepo } from "@/core/infra/RepositoryFactory";
import { generateEnhancedMatchReport } from "@/core/services/MatchService";
import { MatchReport } from "@/features/match/components/match-report";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { toast } from "sonner";
import type { Match, User } from "@/shared/types/domain";

export default function MatchReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserStore();

  const [match, setMatch] = useState<Match | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherUserInterests, setOtherUserInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateProgress, setRecalculateProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 내 이름 가져오기 (우선순위: profile.name > user.email 앞부분 > "당신")
  const myName = profile?.name || user?.email?.split("@")[0] || "당신";

  const loadMatchReport = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const matchData = await getMatchRepo().getById(params.id);

      if (!matchData) {
        setError("매칭 정보를 찾을 수 없습니다");
        return;
      }

      // Check if current user is part of this match
      if (matchData.user1Id !== user.id && matchData.user2Id !== user.id) {
        setError("이 매칭 결과를 볼 권한이 없습니다");
        return;
      }

      setMatch(matchData);

      // Get the other user's info and interests
      const otherUserId =
        matchData.user1Id === user.id ? matchData.user2Id : matchData.user1Id;

      console.log(
        "🔍 상대방 사용자 정보 조회 시작 - otherUserId:",
        otherUserId
      );

      // 기본 사용자 정보 가져오기
      const otherUserData = await getUserRepo().getById(otherUserId);
      setOtherUser(otherUserData);

      // 상대방의 프로필 정보 가져오기 (관심사 포함)
      try {
        const otherUserProfile = await getUserRepo().getProfile(otherUserId);
        console.log("📊 상대방 프로필 정보:", otherUserProfile);

        if (otherUserProfile && otherUserProfile.interests) {
          console.log("✅ 상대방 관심사 발견:", otherUserProfile.interests);
          setOtherUserInterests(otherUserProfile.interests);
        } else {
          console.log("⚠️ 상대방 관심사 정보 없음, 공통 관심사 사용");
          // 폴백: 공통 관심사라도 사용
          const commonTags = matchData.commonInterests?.tags || [];
          setOtherUserInterests(commonTags);
        }
      } catch (profileError) {
        console.error("❌ 상대방 프로필 조회 에러:", profileError);
        // 에러 시 공통 관심사라도 사용
        const commonTags = matchData.commonInterests?.tags || [];
        setOtherUserInterests(commonTags);
      }
    } catch (error) {
      console.error("Error loading match report:", error);
      setError("매칭 리포트를 불러오는 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEnhancedReport = async () => {
    if (!match) return;

    setIsGeneratingReport(true);
    try {
      console.log("🔄 향상된 리포트 생성 시작 - matchId:", match.id);

      // 강제로 새 리포트 생성 (force=true)
      const newInsights = await generateEnhancedMatchReport(match.id, true);
      console.log(
        "✅ 새 리포트 생성 완료:",
        newInsights.substring(0, 50) + "..."
      );

      // 리포트 재로드
      await loadMatchReport();

      // 리포트 생성 성공 메시지
      toast.success("매칭 리포트 재분석 완료!", {
        description:
          "새로운 관점에서 분석한 매칭 인사이트가 업데이트되었습니다.",
        duration: 5000,
      });
    } catch (error) {
      console.error("향상된 리포트 생성 실패:", error);
      toast.error("리포트 생성 실패", {
        description: "향상된 리포트를 생성하는 중 오류가 발생했습니다.",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 🔄 완전한 매칭 재계산 함수
  const handleRecalculateMatch = async () => {
    if (!match) return;

    setIsRecalculating(true);
    setRecalculateProgress(0);

    try {
      console.log("🔄 완전 매칭 재계산 시작");

      // 진행률 애니메이션
      const progressInterval = setInterval(() => {
        setRecalculateProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 10 + 2;
        });
      }, 300);

      // 매칭 재계산 API 호출
      const response = await fetch("/api/recalculate-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("매칭 재계산 API 호출 실패");
      }

      const result = await response.json();
      console.log("✅ 매칭 재계산 결과:", result);

      // 진행률 100%로 설정
      setRecalculateProgress(100);

      // 새로운 matchId로 URL 업데이트 (기록 남기지 않고 교체)
      if (result.matchId && result.matchId !== params.id) {
        console.log("🔄 새로운 매칭 ID로 URL 업데이트:", result.matchId);
        window.history.replaceState(
          null,
          "",
          `/match/report/${result.matchId}`
        );
        params.id = result.matchId; // params 업데이트
      }

      // 잠시 후 데이터 새로고침
      setTimeout(async () => {
        await loadMatchReport();

        // 변경사항 분석 및 알림
        if (result.changes && result.changes.significantChange) {
          const changeMessages = [];

          if (result.changes.scoreChanged) {
            const diff = result.changes.scoreDifference;
            changeMessages.push(
              `매칭 점수: ${diff > 0 ? "↗️" : "↘️"} ${Math.abs(diff)}점 ${
                diff > 0 ? "상승" : "하락"
              }`
            );
          }

          if (result.changes.tagsAdded > 0) {
            changeMessages.push(
              `🔍 새로운 공통 관심사 ${result.changes.tagsAdded}개 발견`
            );
          }

          if (result.changes.tagsRemoved > 0) {
            changeMessages.push(
              `📝 이전 관심사 ${result.changes.tagsRemoved}개 업데이트됨`
            );
          }

          if (result.changes.newCommonResponses !== 0) {
            changeMessages.push(
              `💬 공통 응답 ${
                result.changes.newCommonResponses > 0 ? "추가" : "변경"
              }됨`
            );
          }

          toast.success("매칭 리포트가 업데이트되었습니다!", {
            description: changeMessages.join("\n"),
          });
        } else {
          toast.success("매칭 리포트를 새로고침했습니다!", {
            description:
              "최신 설문 데이터를 반영하여 AI 분석을 다시 실행했어요.",
          });
        }
      }, 1000);
    } catch (error) {
      console.error("❌ 매칭 재계산 실패:", error);
      toast.error("매칭 재계산 실패", {
        description:
          "매칭을 재계산하는 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setTimeout(() => {
        setIsRecalculating(false);
        setRecalculateProgress(0);
      }, 1500);
    }
  };

  useEffect(() => {
    loadMatchReport();
  }, [params.id, router, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !match) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <div className="w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            오류가 발생했습니다
          </h2>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.push("/profile")}>
            프로필로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const matchResult = {
    score: match.matchScore,
    commonTags: match.commonInterests?.tags || [],
    commonResponses: match.commonInterests?.responses || [],
    aiInsights: match.aiInsights,
  };

  const hasBasicInsights = match.aiInsights && match.aiInsights.length <= 200;
  const hasEnhancedInsights = match.aiInsights && match.aiInsights.length > 200;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">매칭 리포트</h1>
        </div>

        {/* 향상된 리포트 생성 버튼 - 항상 표시하되 텍스트는 상황에 따라 변경 */}
        <div className="flex gap-2">
          {/* 상세 분석 버튼 */}
          <Button
            onClick={handleGenerateEnhancedReport}
            disabled={isGeneratingReport || isRecalculating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGeneratingReport ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                AI 분석 중...
              </>
            ) : hasEnhancedInsights ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                리포트 재분석
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                상세 분석 생성
              </>
            )}
          </Button>

          {/* 🔄 완전 새로고침 버튼 */}
          <Button
            onClick={handleRecalculateMatch}
            disabled={isGeneratingReport || isRecalculating}
            variant="outline"
            className="border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700"
          >
            {isRecalculating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                재계산 중...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                매칭 새로고침
              </>
            )}
          </Button>

          {/* 🔍 관심사 디버깅 버튼 (임시) */}
          <Button
            onClick={() => {
              console.log("🔍 관심사 디버깅 정보:", {
                otherUserInterests,
                otherUserInterestsLength: otherUserInterests.length,
                otherUser,
                match: match?.commonInterests,
                matchTags: match?.commonInterests?.tags,
              });
              toast.success("콘솔에서 디버깅 정보를 확인하세요!", {
                description: `상대방 관심사: ${otherUserInterests.length}개 발견`,
              });
            }}
            variant="outline"
            size="sm"
            disabled={isRecalculating}
          >
            🔍 디버그
          </Button>
        </div>
      </div>

      {/* 🔄 재계산 중 로딩 오버레이 */}
      {isRecalculating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center space-y-6">
              {/* 제목 */}
              <div className="space-y-2">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse opacity-20"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Zap className="text-white" size={24} />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  매칭 완전 새로고침
                </h2>
                <p className="text-sm text-gray-600">
                  최신 설문 데이터로 매칭을 다시 계산하고
                  <br />
                  AI 분석을 새로 실행하고 있어요
                </p>
              </div>

              {/* 진행률 */}
              <div className="space-y-3">
                <Progress value={recalculateProgress} className="w-full h-3" />
                <div className="text-sm text-gray-500">
                  {recalculateProgress < 30
                    ? "🔄 설문 데이터 분석 중..."
                    : recalculateProgress < 60
                    ? "🧮 매칭 점수 재계산 중..."
                    : recalculateProgress < 90
                    ? "🤖 AI 기반 인사이트 생성 중..."
                    : "✨ 마지막 정리 중..."}
                </div>
              </div>

              {/* 단계별 정보 */}
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                <div
                  className={`flex items-center gap-2 ${
                    recalculateProgress > 0 ? "text-blue-600" : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      recalculateProgress > 0 ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  ></div>
                  설문 응답 데이터 수집
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    recalculateProgress > 30 ? "text-blue-600" : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      recalculateProgress > 30 ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  ></div>
                  매칭 점수 & 공통점 분석
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    recalculateProgress > 60 ? "text-blue-600" : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      recalculateProgress > 60 ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  ></div>
                  AI 인사이트 생성
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    recalculateProgress > 90 ? "text-blue-600" : ""
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      recalculateProgress > 90 ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  ></div>
                  리포트 업데이트 완료
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-2xl mx-auto w-full">
        <MatchReport
          matchResult={matchResult}
          user1Name={myName}
          user2Name={otherUser?.name || "상대방"}
          partnerInterests={otherUserInterests}
          userId={user?.id} // userId 전달
        />
      </div>

      <div className="mt-6 space-y-3">
        {/* 매칭 상태 안내 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <TrendingUp className="text-white" size={16} />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-medium text-gray-900">
                💡 매칭 리포트 업데이트 안내
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                설문을 새로 진행했거나 상대방이 추가 설문을 했다면,{" "}
                <strong>"매칭 새로고침"</strong>을 눌러 최신 데이터로 매칭
                점수와 AI 분석을 업데이트하세요. 새로운 공통점을 발견할 수
                있어요! ✨
              </p>
            </div>
          </div>
        </div>

        {/* 프로필로 돌아가기 버튼만 유지 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/profile")}
        >
          프로필로 돌아가기
        </Button>
      </div>
    </div>
  );
}
