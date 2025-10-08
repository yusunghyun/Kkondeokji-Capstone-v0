"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useUserStore } from "@/shared/store/userStore";
import { useSurveyStore } from "@/shared/store/surveyStore";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AILoadingScreen } from "@/features/survey/components/ai-loading-screen";
import { getUserByQRCode } from "@/core/services/QRCodeService";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { updateUser, currentUser } = useUserStore();
  const {
    generateSurvey,
    startSurvey,
    isLoading: isSurveyLoading,
  } = useSurveyStore();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 로컬 제출 상태
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"register" | "profile">("register");

  // QR 코드에서 상대방 정보 가져오기
  const [partnerInfo, setPartnerInfo] = useState<{
    userId: string;
    userName: string | null;
  } | null>(null);

  const qrCode = searchParams.get("qr_code");

  // QR 코드에서 상대방 정보 가져오기
  useEffect(() => {
    const fetchPartnerInfo = async () => {
      if (qrCode) {
        try {
          const partner = await getUserByQRCode(qrCode);
          if (partner) {
            setPartnerInfo(partner);
            console.log("✅ 상대방 정보 로드 완료:", partner);
          }
        } catch (error) {
          console.error("❌ 상대방 정보 로드 실패:", error);
        }
      }
    };

    fetchPartnerInfo();
  }, [qrCode]);

  // 인증된 사용자인 경우 프로필 입력 단계로 이동
  useEffect(() => {
    console.log("🔄 온보딩 상태 확인:", {
      loading,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      currentStep: step,
    });

    if (!loading && user) {
      console.log("✅ 로그인된 사용자 → profile 단계로 이동");
      setStep("profile");
    } else if (!loading && !user) {
      console.log("ℹ️ 비로그인 사용자 → register 단계로 이동");
      setStep("register");
    } else if (loading) {
      console.log("⏳ 인증 상태 확인 중...");
    }
  }, [user, loading, step]);

  // 회원가입 완료 후 프로필 단계로 자동 이동
  useEffect(() => {
    if (user && !loading && step === "register") {
      console.log("회원가입 완료 - 프로필 단계로 자동 이동");
      setStep("profile");
    }
  }, [user, loading, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 사용자가 이미 로그인되어 있는지 확인
      if (!user) {
        throw new Error("로그인이 필요합니다");
      }

      console.log("🚀 온보딩: 사용자 프로필 업데이트 시작");
      console.log("🚀 온보딩: user 정보:", {
        userId: user?.id,
        userEmail: user?.email,
        hasUser: !!user,
      });

      // user.id 검증
      if (!user?.id) {
        console.error("❌ 온보딩: user.id가 없습니다!", user);
        setError("사용자 인증 정보가 없습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        return;
      }

      // Create user with authenticated user ID
      const updatedUser = await updateUser(
        {
          name: name || undefined,
          age: age ? Number.parseInt(age) : undefined,
          occupation: occupation || undefined,
        },
        user.id
      );

      console.log("✅ 온보딩: 프로필 업데이트 완료, AI 설문 생성 시작");

      // Generate personalized survey - 상대방 정보 포함
      const templateId = await generateSurvey({
        name: name || undefined,
        age: age ? Number.parseInt(age) : undefined,
        occupation: occupation || undefined,
        otherUserId: partnerInfo?.userId || undefined,
      });

      console.log("✅ 온보딩: AI 설문 생성 완료, templateId:", templateId);
      console.log("✅ 온보딩: templateId 타입:", typeof templateId);
      console.log("✅ 온보딩: templateId 길이:", templateId?.length);
      console.log("사용자 ID:", currentUser?.id);
      console.log("사용자 설문 시작 시도...");

      // templateId 검증
      if (!templateId || templateId.trim() === "") {
        console.error("❌ 온보딩: templateId가 비어있습니다!", templateId);
        setError("설문 생성에 실패했습니다. 다시 시도해주세요.");
        setIsSubmitting(false);
        return;
      }

      // Start survey - user.id 사용 (currentUser가 아직 업데이트되지 않았을 수 있음)
      console.log("사용자 설문 시작 호출:", {
        userId: user?.id,
        userIdType: typeof user?.id,
        currentUserId: currentUser?.id,
        templateId,
        templateIdType: typeof templateId,
      });

      if (!user?.id) {
        console.error("❌ 온보딩: user.id가 없습니다!", user);
        setError("사용자 인증 정보가 없습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        return;
      }

      const userSurveyId = await startSurvey(user.id, templateId);
      console.log("✅ 사용자 설문 생성 완료:", userSurveyId);

      console.log("🎯 온보딩: 설문 페이지로 이동", {
        templateId,
        partnerId: partnerInfo?.userId,
      });

      // ✨ partnerInfo가 있으면 partner_id를 URL에 포함
      const surveyUrl = partnerInfo
        ? `/survey?templateId=${templateId}&partner_id=${partnerInfo.userId}`
        : `/survey?templateId=${templateId}`;

      router.push(surveyUrl);
    } catch (err) {
      console.error("❌ 온보딩 에러:", err);
      setError(
        err instanceof Error
          ? err.message
          : "오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎨 AI 설문 생성 중에는 로딩 화면 표시
  if (isSurveyLoading) {
    return <AILoadingScreen userName={name || undefined} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 justify-center items-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <main className="flex-1 flex flex-col items-center justify-center">
        {step === "register" ? (
          <RegisterForm />
        ) : (
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-primary-500">
                프로필 정보
              </CardTitle>
              <p className="text-center text-gray-600 text-sm">
                {partnerInfo ? (
                  <>
                    <span className="text-purple-600 font-medium">
                      {partnerInfo.userName}
                    </span>
                    님과 더 정확한 매칭을 위해
                    <br />
                    AI가 맞춤 설문을 만들어드려요! ✨
                  </>
                ) : (
                  "AI가 당신만의 맞춤 설문을 만들어드려요! ✨"
                )}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">나이</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="나이를 입력하세요"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min="1"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">직업</Label>
                  <Input
                    id="occupation"
                    placeholder="직업을 입력하세요"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-600 text-sm font-medium">
                      {error}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 font-medium py-3"
                  disabled={
                    isSubmitting ||
                    isSurveyLoading ||
                    !name ||
                    !age ||
                    !occupation
                  }
                >
                  {isSubmitting
                    ? "프로필 저장 중..."
                    : isSurveyLoading
                    ? "AI 설문 생성 중..."
                    : "설문 시작하기 🚀"}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-center text-blue-700 font-medium">
                    💡 입력하신 정보는 AI가 당신에게 딱 맞는 설문을 생성하는데
                    사용됩니다.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
