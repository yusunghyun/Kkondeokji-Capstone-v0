"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/shared/store/userStore";
import { getMatchRepo, getUserRepo } from "@/core/infra/RepositoryFactory";
import { generateEnhancedMatchReport } from "@/core/services/MatchService";
import { MatchReport } from "@/features/match/components/match-report";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { toast } from "@/hooks/use-toast";
import type { Match, User } from "@/shared/types/domain";

export default function MatchReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserStore();

  const [match, setMatch] = useState<Match | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
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

      // Get the other user's info
      const otherUserId =
        matchData.user1Id === user.id ? matchData.user2Id : matchData.user1Id;
      const otherUserData = await getUserRepo().getById(otherUserId);
      setOtherUser(otherUserData);
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
      await generateEnhancedMatchReport(match.id);

      // 리포트 재로드
      await loadMatchReport();

      toast({
        title: "향상된 AI 리포트 생성 완료!",
        description: "더 자세한 매칭 분석이 추가되었습니다.",
      });
    } catch (error) {
      console.error("향상된 리포트 생성 실패:", error);
      toast({
        title: "리포트 생성 실패",
        description: "향상된 리포트를 생성하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
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

        {/* 향상된 리포트 생성 버튼 */}
        {hasBasicInsights && !hasEnhancedInsights && (
          <Button
            onClick={handleGenerateEnhancedReport}
            disabled={isGeneratingReport}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGeneratingReport ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                상세 분석 생성
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full">
        <MatchReport
          matchResult={matchResult}
          user1Name={myName}
          user2Name={otherUser?.name || "상대방"}
        />
      </div>

      <div className="mt-6 space-y-3">
        {/* 새로고침 버튼 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={loadMatchReport}
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          리포트 새로고침
        </Button>

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
