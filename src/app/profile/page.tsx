"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  QrCode,
  User,
  LogOut,
  Heart,
  Calendar,
  Share2,
  TrendingUp,
  Users,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useUserStore } from "@/shared/store/userStore";
import { useQRCodeStore } from "@/shared/store/qrCodeStore";
import { TagChip } from "@/features/profile/components/tag-chip";
import { QRCodeDisplay } from "@/features/profile/components/qr-code-display";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { useAuth } from "@/contexts/AuthContext";
import { getMatchRepo } from "@/core/infra/RepositoryFactory";
import type { Match } from "@/shared/types/domain";
import Link from "next/link";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";

// 관심사별 대화 주제 매핑
const conversationStarters: Record<string, string[]> = {
  reality_show: [
    "가장 인상 깊었던 출연자는 누구였나요?",
    "리얼리티쇼에서 배운 인생 교훈이 있다면?",
    "다음에 보고 싶은 시즌은?",
  ],
  running: [
    "좋아하는 러닝 코스가 있나요?",
    "마라톤 도전해보셨나요?",
    "러닝할 때 듣는 음악 추천해주세요!",
  ],
  songpa: [
    "송파구의 숨은 맛집을 알고 계신가요?",
    "잠실 주변에서 좋아하는 장소가 있나요?",
    "롯데타워 전망대 가보셨어요?",
  ],
  self_development: [
    "최근에 읽은 자기계발서 중 추천하고 싶은 책은?",
    "개인적인 성장을 위해 실천하고 있는 습관이 있나요?",
    "인생을 바꾼 한 권의 책이 있다면?",
  ],
};

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, profile, fetchProfile } = useUserStore();
  const { user, signOut } = useAuth();
  const { userQRCode, generateQRCode } = useQRCodeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userId, setUserId] = useState("");
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  // 관심사 통계 계산 (메모화)
  const interestStats = useMemo(() => {
    if (!profile?.interests || profile.interests.length === 0) return null;

    const totalInterests = profile.interests.length;
    const categories = {
      media: 0,
      sports: 0,
      culture: 0,
      tech: 0,
      lifestyle: 0,
    };

    profile.interests.forEach((interest) => {
      const lower = interest.toLowerCase();
      if (
        lower.includes("show") ||
        lower.includes("drama") ||
        lower.includes("netflix")
      ) {
        categories.media++;
      } else if (
        lower.includes("running") ||
        lower.includes("gym") ||
        lower.includes("sport")
      ) {
        categories.sports++;
      } else if (
        lower.includes("book") ||
        lower.includes("culture") ||
        lower.includes("art")
      ) {
        categories.culture++;
      } else if (
        lower.includes("figma") ||
        lower.includes("notion") ||
        lower.includes("tech")
      ) {
        categories.tech++;
      } else {
        categories.lifestyle++;
      }
    });

    return { totalInterests, categories };
  }, [profile?.interests]);

  // 대화 주제 제안 생성
  const conversationTopics = useMemo(() => {
    if (!profile?.interests) return [];

    const topics: string[] = [];
    profile.interests.forEach((interest) => {
      const starters = conversationStarters[interest];
      if (starters) {
        topics.push(...starters.slice(0, 1)); // 각 관심사에서 1개씩
      }
    });

    return topics.slice(0, 5); // 최대 5개
  }, [profile?.interests]);

  // 프로필 초기화 최적화
  const initProfile = useCallback(async () => {
    if (!user) return;

    const loadingTimeout = setTimeout(() => {
      console.log("프로필 로딩 타임아웃 - 강제 완료");
      setIsLoading(false);
    }, 3000); // 5초에서 3초로 단축

    try {
      console.log("프로필 페이지 초기화 시작:", user.id);

      // 병렬로 데이터 로드
      const [profileData, qrCode, userMatches] = await Promise.all([
        fetchProfile(user.id),
        useQRCodeStore
          .getState()
          .fetchQRCode(user.id)
          .catch(() => null),
        getMatchRepo()
          .getUserMatches(user.id)
          .catch(() => []),
      ]);

      console.log("프로필 데이터 로드 완료:", profileData);

      // QR 코드가 없으면 생성
      if (!qrCode) {
        console.log("QR 코드 생성 시작");
        await generateQRCode(user.id);
      }

      setMatches(userMatches);
    } catch (error) {
      console.error("Error initializing profile:", error);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      console.log("프로필 페이지 초기화 완료");
    }
  }, [fetchProfile, generateQRCode, user]);

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  const handleConnect = useCallback(() => {
    if (!userId.trim()) return;
    router.push(`/match/${userId.trim()}`);
  }, [userId, router]);

  const handleShare = useCallback(() => {
    if (!userQRCode) return;
    const shareUrl = `${window.location.origin}/match/${userQRCode.code}`;
    navigator.clipboard.writeText(shareUrl);
    alert("링크가 클립보드에 복사되었습니다!");
  }, [userQRCode]);

  if (isLoading) {
    return <LoadingScreen message="프로필 정보를 불러오는 중입니다..." />;
  }

  if (!user || !profile) {
    return <LoadingScreen message="사용자 정보를 확인 중입니다..." />;
  }

  const profileUrl = userQRCode
    ? `${window.location.origin}/match/${userQRCode.code}`
    : `${window.location.origin}/match/${profile.id}`;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <nav className="py-4 px-6 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary-500">
          껀덕지
        </Link>
        <Button
          variant="ghost"
          className="text-gray-600 hover:text-primary-500"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </nav>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">내 프로필</h1>
          <Button
            onClick={() => router.push("/")}
            className="bg-primary-500 hover:bg-primary-600"
          >
            새로운 설문하기
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="mr-2 h-5 w-5 text-primary-500" />
                {profile.name || "사용자"}
              </div>
              {profile.interests && profile.interests.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {profile.interests.length}개 관심사
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.age && (
                <div>
                  <span className="text-sm text-gray-500">나이:</span>{" "}
                  {profile.age}세
                </div>
              )}

              {profile.occupation && (
                <div>
                  <span className="text-sm text-gray-500">직업:</span>{" "}
                  {profile.occupation}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">관심사:</span>
                  {profile.interests.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowAdvancedFeatures(!showAdvancedFeatures)
                      }
                      className="text-xs"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      {showAdvancedFeatures ? "간단히 보기" : "모두 보기"}
                    </Button>
                  )}
                </div>
                {profile.interests.length > 0 ? (
                  <div
                    className={`flex flex-wrap gap-2 transition-all duration-300 ${
                      showAdvancedFeatures ? "max-h-none" : "max-h-24"
                    } overflow-hidden`}
                  >
                    {(() => {
                      const maxTags = showAdvancedFeatures
                        ? profile.interests.length
                        : 6;
                      const tags = profile.interests;
                      const displayTags = tags.slice(0, maxTags);
                      const remaining = tags.length - maxTags;
                      return (
                        <>
                          {displayTags.map((tag, idx) => (
                            <TagChip
                              key={idx}
                              label={tag.replace(/_/g, " ")} // 언더스코어를 공백으로 변환
                              className="text-xs"
                            />
                          ))}
                          {!showAdvancedFeatures && remaining > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAdvancedFeatures(true)}
                              className="h-7 px-3 text-xs border border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700 rounded-full"
                            >
                              +{remaining}개 더보기
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="mb-2">아직 관심사가 없습니다</p>
                    <p className="text-sm">
                      설문을 진행하면 당신의 관심사를 찾아드려요!
                    </p>
                    <Button
                      onClick={() => router.push("/")}
                      size="sm"
                      className="mt-3"
                    >
                      첫 설문 시작하기
                    </Button>
                  </div>
                )}
              </div>

              {/* 관심사 통계 */}
              {showAdvancedFeatures && interestStats && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      관심사 분석
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>미디어: {interestStats.categories.media}개</div>
                    <div>스포츠: {interestStats.categories.sports}개</div>
                    <div>문화: {interestStats.categories.culture}개</div>
                    <div>기술: {interestStats.categories.tech}개</div>
                  </div>
                </div>
              )}

              {/* 대화 주제 제안 */}
              {showAdvancedFeatures && conversationTopics.length > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      추천 대화 주제
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-green-700">
                    {conversationTopics.slice(0, 3).map((topic, idx) => (
                      <div key={idx} className="text-xs">
                        • {topic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="connect" className="flex-1">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="connect">
              <Users className="mr-1 h-4 w-4" />
              연결하기
            </TabsTrigger>
            <TabsTrigger value="qrcode">
              <QrCode className="mr-1 h-4 w-4" />
              QR 코드
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              매칭 기록 ({matches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>아이디로 연결하기</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="상대방의 아이디를 입력하세요"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <Button onClick={handleConnect}>연결</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qrcode" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">내 QR 코드</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {userQRCode ? (
                  <QRCodeDisplay userId={profile.id} profileUrl={profileUrl} />
                ) : (
                  <Button onClick={() => generateQRCode(profile.id)}>
                    QR 코드 생성하기
                  </Button>
                )}

                <p className="text-sm text-gray-500 mt-4 text-center">
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

            <Button className="w-full" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />내 링크 공유하기
            </Button>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {matches.length > 0 ? (
              matches.map((match) => (
                <Card
                  key={match.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/match/report/${match.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            match.matchScore >= 80
                              ? "bg-pink-500"
                              : match.matchScore >= 60
                              ? "bg-purple-500"
                              : match.matchScore >= 40
                              ? "bg-blue-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {match.matchScore}
                        </div>
                        <div>
                          <p className="font-medium">
                            매칭 점수: {match.matchScore}점
                          </p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(match.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          공통 관심사 {match.commonInterests?.tags?.length || 0}
                          개
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-600 mb-4">아직 매칭 기록이 없습니다</p>
                <Button
                  className="bg-secondary-500 hover:bg-secondary-600"
                  onClick={() => router.push("/scan")}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR 코드 스캔하기
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
