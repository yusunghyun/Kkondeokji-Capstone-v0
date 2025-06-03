"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ArrowLeft, Share2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMatchStore } from "@/shared/store/matchStore";
import { getUserByQRCode } from "@/core/services/QRCodeService";
import { MatchReport } from "@/features/match/components/match-report";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { getUserRepo } from "@/core/infra/RepositoryFactory";

export default function MatchPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { currentMatch, calculateMatch, isLoading, error } = useMatchStore();

  const [scannedUser, setScannedUser] = useState<{
    userId: string;
    userName: string | null;
  } | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    const initMatch = async () => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        let qrUser: { userId: string; userName: string | null } | null = null;

        // 먼저 QR 코드로 사용자를 찾아봅니다
        qrUser = await getUserByQRCode(params.code);

        // QR 코드로 사용자를 찾지 못한 경우, 직접 아이디로 사용자를 찾아봅니다
        if (!qrUser) {
          const userData = await getUserRepo().getById(params.code);
          if (userData) {
            qrUser = {
              userId: userData.id,
              userName: userData.name,
            };
          }
        }

        if (!qrUser) {
          setMatchError("유효하지 않은 코드입니다");
          return;
        }

        if (qrUser.userId === user.id) {
          setMatchError("자신의 코드는 사용할 수 없습니다");
          return;
        }

        setScannedUser(qrUser);

        // Calculate match
        await calculateMatch(user.id, qrUser.userId);
      } catch (error) {
        console.error("Error in match process:", error);
        setMatchError(
          error instanceof Error ? error.message : "매칭 중 오류가 발생했습니다"
        );
      }
    };

    initMatch();
  }, [calculateMatch, params.code, router, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (matchError || error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            오류가 발생했습니다
          </h2>
          <p className="mb-4">{matchError || error}</p>
          <Button onClick={() => router.push("/profile")}>
            프로필로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentMatch || !scannedUser) {
    return <LoadingScreen />;
  }

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
          user1Name={user?.user_metadata?.name || "당신"}
          user2Name={scannedUser.userName || "상대방"}
        />
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/profile")}
        >
          <Share2 className="mr-2 h-4 w-4" />내 링크 공유하기
        </Button>

        <Button
          className="flex-1 bg-primary-500 hover:bg-primary-600"
          onClick={() => {
            // TODO: 채팅 기능 구현 시 연결
            alert("채팅 기능은 곧 출시됩니다!");
          }}
        >
          💬 대화하기
        </Button>
      </div>
    </div>
  );
}
