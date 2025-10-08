"use client";

import { useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSurveyStore } from "@/shared/store/surveyStore";
import { QuestionCard } from "@/features/survey/components/question-card";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { useAuth } from "@/contexts/AuthContext";

function SurveyContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    surveyTemplate,
    currentQuestionIndex,
    responses,
    isLoading,
    error,
    loadSurvey,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitSurvey,
    reset,
  } = useSurveyStore();
  const { generateSurvey, startSurvey } = useSurveyStore();

  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const partnerId = searchParams.get("partner_id");
  const redirectUrl = searchParams.get("redirect");

  useEffect(() => {
    console.log("설문 페이지 초기화:", {
      surveyTemplate,
      currentQuestionIndex,
      templateId,
      responsesCount: responses.length,
    });
  }, [surveyTemplate, responses, currentQuestionIndex, templateId]);

  // 설문 로딩 함수
  const handleInitSurvey = useCallback(async () => {
    try {
      if (!user) {
        console.error("사용자 인증 정보 없음");
        router.push("/auth/login");
        return;
      }

      // 템플릿 ID가 URL에 있는 경우
      if (templateId) {
        console.log(`📋 템플릿 ID로 설문 로딩: ${templateId}`);
        console.log(`👤 현재 사용자 ID: ${user.id} (${user.email})`);
        await loadSurvey(templateId);

        // 설문 시작 (userSurveyId 생성)
        console.log(`🏁 startSurvey 호출 (userId: ${user.id})`);
        await startSurvey(user.id, templateId);
        return;
      }

      // 템플릿 ID가 없는 경우 새 설문 생성
      console.log("🆕 새 설문 템플릿 생성");
      console.log(`👤 현재 사용자 ID: ${user.id} (${user.email})`);
      console.log(`🤝 파트너 ID: ${partnerId || "없음"}`);
      reset(); // 기존 설문 상태 초기화

      const newTemplateId = await generateSurvey({
        name: undefined,
        age: undefined,
        occupation: undefined,
        otherUserId: partnerId || undefined,
      });

      console.log(`✅ 생성된 템플릿 ID: ${newTemplateId}`);
      await loadSurvey(newTemplateId);

      // 설문 시작 (userSurveyId 생성)
      console.log(`🏁 startSurvey 호출 (userId: ${user.id})`);
      await startSurvey(user.id, newTemplateId);

      // URL 업데이트 (새로고침 시 동일 설문 유지)
      router.push(`/survey?templateId=${newTemplateId}`);
    } catch (error) {
      console.error("설문 초기화 실패:", error);
    }
  }, [
    templateId,
    user,
    loadSurvey,
    generateSurvey,
    startSurvey,
    router,
    reset,
  ]);

  // 초기 설문지 로딩
  useEffect(() => {
    if (!surveyTemplate) {
      handleInitSurvey();
    }
  }, [surveyTemplate, handleInitSurvey]);

  if (isLoading || !surveyTemplate) {
    return <LoadingScreen message="설문을 준비하고 있습니다..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            오류가 발생했습니다
          </h2>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>다시 시작하기</Button>
        </Card>
      </div>
    );
  }

  const questions = surveyTemplate.questions || [];
  if (questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            설문 질문이 없습니다
          </h2>
          <p className="mb-4">
            설문 템플릿에 질문이 없습니다. 다시 시도해주세요.
          </p>
          <Button onClick={() => router.push("/")}>다시 시작하기</Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            질문을 찾을 수 없습니다
          </h2>
          <p className="mb-4">
            현재 질문 인덱스: {currentQuestionIndex}, 총 질문 수:{" "}
            {questions.length}
          </p>
          <Button onClick={() => router.push("/")}>다시 시작하기</Button>
        </Card>
      </div>
    );
  }

  const currentOptions = currentQuestion.options || [];
  if (currentOptions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            선택지가 없습니다
          </h2>
          <p className="mb-4">질문에 선택지가 없습니다. 다시 시도해주세요.</p>
          <Button onClick={() => router.push("/")}>다시 시작하기</Button>
        </Card>
      </div>
    );
  }

  // Find if user has already answered this question
  const currentResponse = responses.find(
    (r) => r.questionId === currentQuestion.id
  );
  const selectedOptionId = currentResponse?.optionId;

  const progress = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100
  );
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = !!selectedOptionId;

  const handleOptionSelect = (optionId: string) => {
    if (currentQuestion) {
      answerQuestion(currentQuestion.id, optionId);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      nextQuestion();
    }
  };

  const handleSubmit = async () => {
    try {
      // partnerId를 미리 저장 (submitSurvey 후에 reset되므로)
      const savedPartnerId = partnerId;
      const savedRedirectUrl = redirectUrl;

      console.log("🎯 설문 제출 시작:", {
        userId: user?.id,
        partnerId: savedPartnerId,
        redirectUrl: savedRedirectUrl,
      });

      await submitSurvey();

      // ✨ QR 스캔 후 설문 완료 시 자동 매칭 생성
      if (savedPartnerId && user?.id) {
        console.log("🎯 자동 매칭 생성 시작:", {
          currentUser: user.id,
          currentUserEmail: user.email,
          partnerId: savedPartnerId,
        });

        try {
          // RealMatchService를 통한 매칭 계산
          console.log("📡 매칭 API 호출 중...");
          const response = await fetch("/api/calculate-match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user1Id: user.id,
              user2Id: savedPartnerId,
            }),
          });

          console.log("📡 매칭 API 응답 상태:", response.status);

          if (response.ok) {
            const matchResult = await response.json();
            console.log("✅ 자동 매칭 생성 완료:", matchResult);

            // 매칭 결과 페이지로 이동
            if (matchResult.matchId) {
              console.log("🎉 매칭 리포트로 이동:", matchResult.matchId);
              router.push(`/match/report/${matchResult.matchId}`);
              return;
            } else {
              console.warn("⚠️ matchId가 없습니다:", matchResult);
            }
          } else {
            const errorText = await response.text();
            console.error("❌ 자동 매칭 생성 실패:", {
              status: response.status,
              error: errorText,
            });
          }
        } catch (error) {
          console.error("❌ 자동 매칭 생성 에러:", error);
          // 매칭 생성 실패 시에도 계속 진행
        }
      } else {
        console.log("ℹ️ partnerId 또는 user.id가 없어 자동 매칭 건너뜀:", {
          hasPartnerId: !!savedPartnerId,
          hasUserId: !!user?.id,
        });
      }

      // 리다이렉션 URL이 있으면 해당 URL로, 없으면 프로필로 이동
      router.push(savedRedirectUrl || "/profile");
    } catch (error) {
      console.error("Failed to submit survey:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div className="text-sm text-gray-600">
          질문 {currentQuestionIndex + 1} / {questions.length}
        </div>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </div>

      <Progress value={progress} className="h-2 mb-8" />

      <QuestionCard
        question={currentQuestion}
        options={currentOptions}
        selectedOptionId={selectedOptionId}
        onSelect={handleOptionSelect}
      />

      <Button
        onClick={handleNext}
        disabled={!canProceed}
        className="mt-6 bg-primary-500 hover:bg-primary-600 text-white rounded-full py-6 mx-auto"
      >
        {isLastQuestion ? "완료" : "다음"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={<LoadingScreen message="설문을 불러오는 중입니다..." />}
    >
      <SurveyContent />
    </Suspense>
  );
}
