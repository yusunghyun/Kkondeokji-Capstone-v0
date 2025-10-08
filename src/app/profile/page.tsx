"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  QrCode,
  User,
  LogOut,
  Heart,
  Users,
  Search,
  Mail,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useUserStore } from "@/shared/store/userStore";
import { useQRCodeStore } from "@/shared/store/qrCodeStore";
import { TagChip } from "@/features/profile/components/tag-chip";
import { QRCodeDisplay } from "@/features/profile/components/qr-code-display";
import { MatchNoteDialog } from "@/features/match/components/match-note-dialog";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { useAuth } from "@/contexts/AuthContext";
import { getMatchRepo, getUserRepo } from "@/core/infra/RepositoryFactory";
import { translateInterest } from "@/shared/utils/interestTranslation";
import type { Match } from "@/shared/types/domain";
import Link from "next/link";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";

// 사용자 검색 결과 타입
interface SearchResult {
  id: string;
  name: string;
  email: string;
  age: number | null;
  occupation: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, fetchProfile, isLoading } = useUserStore();
  const { generateQRCode, userQRCode, fetchQRCode } = useQRCodeStore();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // 🔍 사용자 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 🔍 실시간 사용자 검색
  const searchUsers = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        console.log("🔍 사용자 검색 시작:", query);
        const userRepo = getUserRepo();
        const results = await userRepo.searchUsers(query.trim());

        // 자기 자신은 제외
        const filteredResults = results.filter(
          (result) => result.id !== user?.id
        );

        setSearchResults(filteredResults);
        console.log("✅ 검색 완료:", filteredResults.length, "명 발견");
      } catch (error) {
        console.error("❌ 사용자 검색 실패:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [user?.id]
  );

  // 🎯 검색어 변경 핸들러 (디바운스 적용)
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // 300ms 디바운스

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, searchUsers]);

  // 🚀 사용자 연결
  const handleConnectUser = useCallback(
    (selectedUser: SearchResult) => {
      console.log("🔗 사용자 연결:", selectedUser);
      router.push(`/match/${selectedUser.id}`);
    },
    [router]
  );

  // 🎯 매칭 기록 로드
  const loadMatches = useCallback(async () => {
    if (!user) return;

    setIsLoadingMatches(true);
    try {
      const userMatches = await getMatchRepo().getUserMatches(user.id);
      setMatches(userMatches);
    } catch (error) {
      console.error("매칭 기록 로드 실패:", error);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [user]);

  // 초기화 - 의존성 배열에서 함수들 제거하여 무한 루프 방지
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
      fetchQRCode(user.id);
      loadMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // user.id만 의존성으로 사용

  const handleShare = useCallback(() => {
    if (!userQRCode) return;
    const shareUrl = `${window.location.origin}/match/${userQRCode.code}`;
    navigator.clipboard.writeText(shareUrl);
    alert(
      `링크가 클립보드에 복사되었습니다!\n\nQR 코드: ${userQRCode.code}\nURL: ${shareUrl}`
    );
  }, [userQRCode]);

  // QR 코드 생성 완료 핸들러
  const handleQRCodeGenerated = useCallback((qrCode: any) => {
    console.log("🎉 QR 코드 생성 완료!", {
      code: qrCode.code,
      userId: qrCode.userId,
      url: `${window.location.origin}/match/${qrCode.code}`,
    });

    // 사용자에게 새 QR 코드 정보를 알림
    const shareUrl = `${window.location.origin}/match/${qrCode.code}`;
    alert(
      `새 QR 코드가 생성되었습니다!\n\n코드: ${qrCode.code}\n공유 URL: ${shareUrl}`
    );
  }, []);

  if (isLoading) {
    return <LoadingScreen message="프로필 정보를 불러오는 중입니다..." />;
  }

  if (!user || !profile) {
    return <LoadingScreen message="사용자 정보를 확인 중입니다..." />;
  }

  const profileUrl = userQRCode
    ? `${window.location.origin}/match/${userQRCode.code}`
    : `${window.location.origin}/match/${profile.id}`;

  console.log("프로필 URL 생성:", {
    userQRCode: userQRCode?.code,
    profileUrl,
    profileId: profile.id,
  });

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

      <main className="flex-1 container mx-auto p-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6" />
              {profile.name || "사용자"}님의 프로필
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.age}세
                </div>
                <div className="text-sm text-gray-600">나이</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {profile.occupation}
                </div>
                <div className="text-sm text-gray-600">직업</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {profile.interests?.length || 0}
                </div>
                <div className="text-sm text-gray-600">관심사</div>
              </div>
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">내 관심사</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <TagChip
                      key={index}
                      label={translateInterest(interest)}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="connect" className="flex-1">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="connect">
              <Search className="mr-1 h-4 w-4" />
              친구 찾기
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
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  친구 찾기
                </CardTitle>
                <p className="text-sm text-gray-600">
                  이름 또는 이메일 아이디로 친구를 찾아서 바로 매칭해보세요!
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="친구의 이름이나 이메일 아이디를 입력하세요 (예: 김철수, john123)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-3 text-base"
                    />
                  </div>

                  {isSearching && (
                    <div className="flex items-center justify-center py-4 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      검색 중...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                          onClick={() => handleConnectUser(result)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {result.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {result.name || "익명"}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {result.email?.split("@")[0] || "Unknown"}
                                {result.age && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span>{result.age}세</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            연결
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length > 0 &&
                    !isSearching &&
                    searchResults.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">
                          "{searchQuery}"로 검색된 사용자가 없습니다
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          이름이나 이메일 아이디를 정확히 입력해주세요
                        </p>
                      </div>
                    )}

                  {searchQuery.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="font-medium text-gray-700 mb-2">
                        친구를 찾아보세요!
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        이름이나 이메일 아이디로 검색하면
                        <br />
                        바로 매칭을 시작할 수 있어요
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <strong>이름 검색</strong>
                          <br />
                          김철수, 이영희
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg">
                          <strong>이메일 검색</strong>
                          <br />
                          john123, alice
                        </div>
                      </div>
                    </div>
                  )}
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
                  <div className="space-y-4">
                    <QRCodeDisplay
                      userId={profile.id}
                      profileUrl={profileUrl}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        console.log("QR 코드 새로고침 버튼 클릭:", profile.id);
                        try {
                          const newQRCode = await generateQRCode(
                            profile.id,
                            true
                          ); // 강제 새로 생성
                          handleQRCodeGenerated(newQRCode);
                        } catch (error) {
                          console.error("QR 코드 새로고침 실패:", error);
                        }
                      }}
                      className="w-full"
                    >
                      QR 코드 새로 생성하기
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={async () => {
                      console.log("QR 코드 생성 버튼 클릭:", profile.id);
                      try {
                        const newQRCode = await generateQRCode(
                          profile.id,
                          true
                        ); // 강제 새로 생성
                        handleQRCodeGenerated(newQRCode);
                      } catch (error) {
                        console.error("QR 코드 생성 실패:", error);
                      }
                    }}
                  >
                    QR 코드 생성하기
                  </Button>
                )}

                <p className="text-sm text-gray-500 mt-4 text-center">
                  이 QR 코드를 스캔하면 상대방과 바로 매칭할 수 있습니다
                </p>
              </CardContent>
            </Card>

            <Button
              onClick={handleShare}
              disabled={!userQRCode}
              className="w-full"
              variant="outline"
            >
              링크 공유하기
            </Button>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {isLoadingMatches ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                매칭 기록을 불러오는 중...
              </div>
            ) : matches.length > 0 ? (
              matches.map((match) => (
                <Card key={match.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-bold text-pink-500">
                          {match.matchScore}%
                        </div>
                        <div>
                          <div className="font-medium">
                            {match.user1?.id === user.id
                              ? match.user2?.name || "알수없음"
                              : match.user1?.name || "알수없음"}
                            님과의 매칭
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/match/report/${match.id}`)
                          }
                        >
                          자세히 보기
                        </Button>
                        <MatchNoteDialog
                          matchId={match.id}
                          partnerName={
                            match.user1?.id === user.id
                              ? match.user2?.name || "상대방"
                              : match.user1?.name || "상대방"
                          }
                          onNoteUpdate={() => {}}
                        />
                      </div>
                    </div>

                    {match.commonInterests?.tags &&
                      match.commonInterests.tags.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-2">
                            공통 관심사
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {match.commonInterests.tags
                              .slice(0, 5)
                              .map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {translateInterest(tag)}
                                </Badge>
                              ))}
                            {match.commonInterests.tags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{match.commonInterests.tags.length - 5}개 더
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="font-medium text-gray-700 mb-2">
                  아직 매칭 기록이 없어요
                </h3>
                <p className="text-sm text-gray-500">
                  QR 코드를 공유하거나 친구를 찾아서 첫 매칭을 시작해보세요!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
