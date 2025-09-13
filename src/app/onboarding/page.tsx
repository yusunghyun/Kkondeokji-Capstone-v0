"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useUserStore } from "@/shared/store/userStore";
import { useSurveyStore } from "@/shared/store/surveyStore";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AILoadingScreen } from "@/features/survey/components/ai-loading-screen";

export default function OnboardingPage() {
  const router = useRouter();
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

  // 인증된 사용자인 경우 프로필 입력 단계로 이동
  useEffect(() => {
    console.log("user", user);
    if (!loading && user) {
      setStep("profile");
    } else {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

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

      // Create user with authenticated user ID
      const updatedUser = await updateUser(
        {
          name: name || undefined,
          age: age ? Number.parseInt(age) : undefined,
          occupation: occupation || undefined,
        },
        user?.id || ""
      );

      console.log("✅ 온보딩: 프로필 업데이트 완료, AI 설문 생성 시작");

      // Generate personalized survey - 여기서 AI 로딩이 시작됩니다
      const templateId = await generateSurvey({
        name: name || undefined,
        age: age ? Number.parseInt(age) : undefined,
        occupation: occupation || undefined,
      });

      console.log("✅ 온보딩: AI 설문 생성 완료, 사용자 설문 시작");

      // Start survey
      const userSurveyId = await startSurvey(currentUser?.id || "", templateId);

      console.log("🎯 온보딩: 설문 페이지로 이동");
      router.push(`/survey?templateId=${templateId}`);
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
                AI가 당신만의 맞춤 설문을 만들어드려요! ✨
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
