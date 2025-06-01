"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/shared/ui/button";
import { QrCode, LogIn, LogOut } from "lucide-react";
import { useUserStore } from "@/shared/store/userStore";
import { useRouter } from "next/navigation";
import { useSurveyStore } from "@/shared/store/surveyStore";
import { useCallback } from "react";

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, fetchProfile } = useUserStore();
  const { generateSurvey, startSurvey } = useSurveyStore();

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
  }, [profile, generateSurvey, startSurvey, user, router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <nav className="py-4 px-6 flex justify-between items-center">
        <div className="text-xl font-bold text-primary-500">껀덕지</div>
        {user ? (
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-primary-500"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
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
            <p className="text-lg text-gray-600">
              공통 관심사를 찾고 대화를 시작하세요
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-white rounded-xl p-6 shadow-sm">
              <p className="text-gray-700 mb-6">
                30초 설문으로 새로운 친구와의 공통점을 발견하고, 의미있는 대화를
                시작해보세요.
              </p>

              <Button
                className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-full py-6"
                onClick={handleStartSurvey}
              >
                30초 설문 시작하기
              </Button>

              <div className="mt-4">
                <Link
                  href="/scan"
                  className="text-secondary-500 hover:text-secondary-600 flex items-center justify-center"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR 스캔으로 바로 매칭하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500">
        © 2025 껀덕지. All rights reserved.
      </footer>
    </div>
  );
}
