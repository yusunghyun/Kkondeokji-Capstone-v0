"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { QrCode, User, Moon, Sun } from "lucide-react";
import { useUserStore } from "@/shared/store/userStore";
import { useQRCodeStore } from "@/shared/store/qrCodeStore";
import { TagChip } from "@/features/profile/components/tag-chip";
import { QRCodeDisplay } from "@/features/profile/components/qr-code-display";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function ProfilePage() {
  const router = useRouter();
  const profile = {
    id: "1",
    name: "홍길동",
    age: 20,
    occupation: "개발자",
    interests: ["영화", "음악", "책"],
  };
  const {
    currentUser,
    // profile,
    fetchProfile,
  } = useUserStore();
  const { userQRCode, generateQRCode } = useQRCodeStore();
  const [isLoading, setIsLoading] = useState(false); //TODO 임시 false

  // useEffect(() => {
  //   const initProfile = async () => {
  //     if (!currentUser) {
  //       router.push("/onboarding");
  //       return;
  //     }

  //     try {
  //       // Fetch user profile
  //       await fetchProfile(currentUser.id);

  //       // Generate QR code if not already generated
  //       if (!userQRCode) {
  //         await generateQRCode(currentUser.id);
  //       }
  //     } catch (error) {
  //       console.error("Error initializing profile:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   initProfile();
  // }, [currentUser, fetchProfile, generateQRCode, router, userQRCode]);

  if (isLoading || !profile) {
    return <LoadingScreen />;
  }

  const profileUrl = userQRCode
    ? `${window.location.origin}/match/${userQRCode.code}`
    : `${window.location.origin}/match/${profile.id}`;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          내 프로필
        </h1>
        <ThemeToggle />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-gray-800 dark:text-gray-100">
            <User className="mr-2 h-5 w-5 text-primary-500" />
            {profile.name || "사용자"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            {profile.age && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  나이:
                </span>{" "}
                {profile.age}세
              </div>
            )}

            {profile.occupation && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  직업:
                </span>{" "}
                {profile.occupation}
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                관심사:
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <TagChip key={index} label={interest} />
                  ))
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">
                    아직 관심사가 없습니다
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="qrcode" className="flex-1">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="qrcode">QR 코드</TabsTrigger>
          <TabsTrigger value="matches">매칭 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="qrcode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-gray-800 dark:text-gray-100">
                내 QR 코드
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {userQRCode ? (
                <QRCodeDisplay userId={profile.id} profileUrl={profileUrl} />
              ) : (
                <Button onClick={() => generateQRCode(profile.id)}>
                  QR 코드 생성하기
                </Button>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                이 QR 코드를 스캔하면 상대방과 바로 매칭할 수 있습니다
              </p>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-secondary-500 hover:bg-secondary-600"
            onClick={() => router.push("/scan")}
          >
            <QrCode className="mr-2 h-4 w-4" />
            다른 사람 QR 스캔하기
          </Button>
        </TabsContent>

        <TabsContent value="matches">
          <Card className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              아직 매칭 기록이 없습니다
            </p>
            <Button
              className="bg-secondary-500 hover:bg-secondary-600"
              onClick={() => router.push("/scan")}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR 코드 스캔하기
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
