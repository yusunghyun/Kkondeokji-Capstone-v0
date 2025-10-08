"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { ArrowLeft, Share2, Users, UserPlus, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/shared/store/userStore";
import { useMatchStore } from "@/shared/store/matchStore";
import { getUserByQRCode } from "@/core/services/QRCodeService";
import { MatchReport } from "@/features/match/components/match-report";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { getUserRepo } from "@/core/infra/RepositoryFactory";

type MatchPageState =
  | "loading"
  | "new_user_onboarding"
  | "survey_needed"
  | "matching"
  | "match_result"
  | "error";

export default function MatchPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { currentMatch, calculateMatch, isLoading, error } = useMatchStore();

  const [pageState, setPageState] = useState<MatchPageState>("loading");
  const [scannedUser, setScannedUser] = useState<{
    userId: string;
    userName: string | null;
  } | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // 매칭 초기화 상태 추적
  const [initStarted, setInitStarted] = useState(false);

  useEffect(() => {
    const initMatch = async () => {
      try {
        // 이미 초기화가 시작된 경우 중복 실행 방지
        if (initStarted) {
          console.log("🔄 매칭 초기화가 이미 진행 중입니다");
          return;
        }

        setInitStarted(true);
        setPageState("loading");

        // 1. 로그인 확인
        if (!user) {
          // 로그인되지 않은 경우 회원가입 페이지로 이동 (상대방 정보 포함)
          router.push(
            `/onboarding?redirect=/match/${params.code}&qr_code=${params.code}`
          );
          return;
        }

        console.log("✅ 로그인 확인 완료:", {
          userId: user.id,
          email: user.email,
        });

        // 2. QR 코드로 상대방 찾기
        let qrUser: { userId: string; userName: string | null } | null = null;

        qrUser = await getUserByQRCode(params.code);

        // QR 코드로 찾지 못하면 직접 ID로 검색
        if (!qrUser) {
          const userProfile = await getUserRepo().getProfile(params.code);
          if (userProfile) {
            qrUser = {
              userId: userProfile.id,
              userName: userProfile.name,
            };
          }
        }

        if (!qrUser) {
          setMatchError("유효하지 않은 QR 코드입니다");
          setPageState("error");
          return;
        }

        if (qrUser.userId === user.id) {
          setMatchError("자신의 QR 코드는 사용할 수 없습니다");
          setPageState("error");
          return;
        }

        setScannedUser(qrUser);

        // 3. 사용자 프로필 상태 확인 (직접 API 호출로 최신 정보 확인)
        console.log("🔍 프로필 상태 확인 시작");

        // 캐시된 프로필 정보 대신 직접 API 호출로 최신 정보 확인
        const userRepo = getUserRepo();
        const freshProfile = await userRepo.getProfile(user.id);

        console.log("🔍 최신 프로필 정보:", freshProfile);

        if (!freshProfile || !freshProfile.name) {
          console.log("⚠️ 프로필 정보 없음, 온보딩 필요");
          setPageState("new_user_onboarding");
          return;
        }

        console.log("✅ 프로필 확인 완료:", {
          name: freshProfile.name,
          age: freshProfile.age,
        });

        // 4. 설문 완료 상태 확인 - 실제 완료된 설문 확인
        try {
          const { getSurveyRepo } = await import(
            "@/core/infra/RepositoryFactory"
          );
          const surveyRepo = getSurveyRepo();
          const completedSurveys = await surveyRepo.getUserSurveys(user.id);

          console.log("🔍 완료된 설문 확인:", {
            userId: user.id,
            surveysCount: completedSurveys.length,
          });

          if (completedSurveys.length === 0) {
            console.log("⚠️ 완료된 설문 없음, 설문 필요");
            setPageState("survey_needed");
            return;
          }

          console.log("✅ 설문 완료 확인됨:", completedSurveys.length);
        } catch (error) {
          console.error("❌ 설문 완료 상태 확인 실패:", error);
          // 오류 발생 시 기본적으로 설문 필요 상태로 설정
          setPageState("survey_needed");
          return;
        }

        // 5. 매칭 시작
        setPageState("matching");
        console.log("매칭 계산 시작:", {
          userId: user.id,
          partnerId: qrUser.userId,
          partnerName: qrUser.userName,
        });

        await calculateMatch(user.id, qrUser.userId);
        setPageState("match_result");
      } catch (error) {
        console.error("Error in match process:", error);
        setMatchError(
          error instanceof Error ? error.message : "매칭 중 오류가 발생했습니다"
        );
        setPageState("error");
      }
    };

    // 사용자 정보가 로드된 경우에만 초기화 실행 (프로필은 내부에서 직접 로드)
    if (user && !initStarted) {
      console.log("👤 사용자 정보 로드 완료, 매칭 초기화 시작");
      initMatch();
    } else if (!user) {
      console.log("⏳ 사용자 인증 정보 로딩 중...");
    }
  }, [calculateMatch, params.code, router, user, initStarted]);

  // 로딩 상태
  if (pageState === "loading" || isLoading) {
    return <LoadingScreen message="매칭을 준비하고 있습니다..." />;
  }

  // 에러 상태
  if (pageState === "error" || error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-red-500 mb-4">
              오류가 발생했습니다
            </h2>
            <p className="mb-4">{matchError || error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                홈으로
              </Button>
              <Button onClick={() => window.location.reload()}>
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 신규 사용자 온보딩
  if (pageState === "new_user_onboarding") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <UserPlus className="mx-auto h-12 w-12 text-primary-500 mb-4" />
            <CardTitle className="text-2xl">
              껀덕지에 오신 것을 환영합니다!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <p className="text-gray-600 mb-6 text-center">
              {scannedUser?.userName}님과 매칭하기 전에
              <br />
              프로필을 완성해주세요!
            </p>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() =>
                  router.push(`/onboarding?redirect=/match/${params.code}`)
                }
              >
                <Sparkles className="mr-2 h-4 w-4" />
                프로필 만들기
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                나중에 하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 설문 필요 상태
  if (pageState === "survey_needed") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <Sparkles className="mx-auto h-12 w-12 text-purple-500 mb-4" />
            <CardTitle className="text-2xl">
              매칭을 위한 설문이 필요해요
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <p className="text-gray-600 mb-6 text-center">
              {scannedUser?.userName}님과 더 정확한 매칭을 위해
              <br />
              간단한 설문조사를 진행해주세요!
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={() =>
                  router.push(
                    `/survey?redirect=/match/${params.code}&partner_id=${scannedUser?.userId}`
                  )
                }
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {scannedUser?.userName}님과 맞춤 설문 시작하기
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/profile")}
              >
                프로필로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 매칭 결과 표시
  if (pageState === "match_result" && currentMatch && scannedUser) {
    const myName = user?.email?.split("@")[0] || "당신";
    const partnerName = scannedUser.userName || "매칭 상대";

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/profile")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            매칭 결과
          </h1>
        </div>

        <div className="flex-1 max-w-2xl mx-auto w-full">
          <MatchReport
            matchResult={currentMatch}
            user1Name={myName}
            user2Name={partnerName}
          />
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full bg-primary-500 hover:bg-primary-600"
            onClick={() => {
              navigator.share
                ? navigator.share({
                    title: "껀덕지 - 매칭 결과",
                    text: `${partnerName}님과 ${currentMatch.score}점으로 매칭되었습니다!`,
                    url: window.location.href,
                  })
                : navigator.clipboard.writeText(window.location.href);
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            매칭 결과 공유하기
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/profile")}
            >
              프로필로 돌아가기
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/")}
            >
              새로운 설문하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 기본 로딩 상태
  return <LoadingScreen message="처리 중입니다..." />;
}
