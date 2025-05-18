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

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { createUser } = useUserStore();
  const { generateSurvey, startSurvey } = useSurveyStore();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"register" | "profile">("register");

  // 인증된 사용자인 경우 프로필 입력 단계로 이동
  useEffect(() => {
    console.log("user", user);
    if (!loading && user) {
      setStep("profile");
    }
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 사용자가 이미 로그인되어 있는지 확인
      if (!user) {
        throw new Error("로그인이 필요합니다");
      }

      // Create user with authenticated user ID
      const userId = await createUser({
        id: user.id,
        name: name || undefined,
        age: age ? Number.parseInt(age) : undefined,
        occupation: occupation || undefined,
        email: user.email,
      });

      // Generate personalized survey
      const templateId = await generateSurvey({
        name: name || undefined,
        age: age ? Number.parseInt(age) : undefined,
        occupation: occupation || undefined,
      });

      // Start survey
      await startSurvey(userId, templateId);

      // Navigate to survey
      router.push("/survey");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">프로필 정보</CardTitle>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">직업</Label>
                  <Input
                    id="occupation"
                    placeholder="직업을 입력하세요"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <Button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600"
                  disabled={isLoading}
                >
                  {isLoading ? "처리 중..." : "설문 시작하기"}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  입력하신 정보는 맞춤형 설문 생성에 사용됩니다.
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
