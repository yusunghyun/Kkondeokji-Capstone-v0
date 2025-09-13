"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/shared/ui/button";
import { QrCode, LogIn, LogOut, User } from "lucide-react";
import { useUserStore } from "@/shared/store/userStore";
import { useRouter } from "next/navigation";
import { useSurveyStore } from "@/shared/store/surveyStore";
import { useCallback, useEffect } from "react";
import { AILoadingScreen } from "@/features/survey/components/ai-loading-screen";

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, fetchProfile, currentUser } = useUserStore();
  const { generateSurvey, startSurvey, isLoading } = useSurveyStore();
  const { responses, reset } = useSurveyStore();

  // //TODO 리셋용
  // useEffect(() => {
  //   reset();
  // }, [reset]);

  useEffect(() => {
    console.log("currentUser", currentUser);
  }, [currentUser]);

  const handleStartSurvey = useCallback(async () => {
    console.log("handleStartSurvey profile", profile);
    if (!user) {
      router.push("/onboarding");
      return;
    }

    if (!profile?.name || !profile?.age || !profile?.occupation) {
      const fetchedProfile = await fetchProfile(user.id);

      if (
        !fetchedProfile?.name ||
        !fetchedProfile?.age ||
        !fetchedProfile?.occupation
      ) {
        router.push("/onboarding");
        return;
      }

      const templateId = await generateSurvey({
        name: fetchedProfile.name,
        age: fetchedProfile.age,
        occupation: fetchedProfile.occupation,
      });

      await startSurvey(user.id, templateId);
      router.push(`/survey?templateId=${templateId}`);
      return;
    }

    const templateId = await generateSurvey({
      name: profile.name,
      age: profile.age,
      occupation: profile.occupation,
    });

    await startSurvey(user.id, templateId);
    router.push(`/survey?templateId=${templateId}`);
  }, [profile, generateSurvey, startSurvey, user, router, fetchProfile]);

  // 🚨 조건부 렌더링을 hooks 이후로 이동
  if (isLoading) {
    return <AILoadingScreen userName={profile?.name || undefined} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <nav className="py-4 px-6 flex justify-between items-center">
        <div className="text-xl font-bold text-primary-500">껀덕지</div>
        {user ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-primary-500"
              onClick={() => router.push("/profile")}
              disabled={!user} // 사용자가 로그인되어 있으면 항상 프로필 버튼 활성화
            >
              <User className="mr-2 h-4 w-4" />
              프로필
            </Button>
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-primary-500"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        ) : (
          <></>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary-500">
              껀덕지
            </h1>
            <p className="text-lg text-muted-foreground">
              공통점으로 만나는 새로운 인연
            </p>
          </div>

          <div className="space-y-4">
            {user ? (
              <>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  onClick={handleStartSurvey}
                  disabled={isLoading}
                >
                  {isLoading ? "AI 설문 생성 중..." : "30초 설문 시작하기 ✨"}
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/scan")}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    QR 스캔
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />내 프로필
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  로그인해서 나만의 매칭을 시작해보세요
                </p>
                <div className="space-y-3">
                  <Link href="/onboarding" className="block">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      시작하기
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" size="lg" className="w-full">
                      <LogIn className="mr-2 h-4 w-4" />
                      로그인
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              "어? 너도?" 하는 순간을 만들어보세요
            </p>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        © 2025 껀덕지. All rights reserved.
      </footer>
    </div>
  );
}
