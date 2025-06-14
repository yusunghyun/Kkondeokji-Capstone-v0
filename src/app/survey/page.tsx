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

function SurveyContent() {
  const router = useRouter();
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
  } = useSurveyStore();
  const { generateSurvey } = useSurveyStore();

  const searchParams = useSearchParams();
  const firstTemplateId = searchParams.get("templateId");

  useEffect(() => {
    console.log("surveyTemplate", surveyTemplate);
    console.log("responses", responses);
    console.log("currentQuestionIndex", currentQuestionIndex);
  }, [surveyTemplate, responses, currentQuestionIndex]);

  // TODO 템플릿에 질문이 여러개 있지 않아서 임의로 템플릿ID 가지고 옴. 일단 5번까지는 이렇게 하자.
  const handleLoadSurvey = useCallback(async () => {
    const templateId = await generateSurvey({
      name: undefined,
      age: undefined,
      occupation: undefined,
    });
    loadSurvey(templateId);
  }, [generateSurvey, loadSurvey]);

  // 초기 설문지 로딩
  useEffect(() => {
    if (firstTemplateId && currentQuestionIndex === 0) {
      loadSurvey(firstTemplateId);
      return;
    }
    if (currentQuestionIndex > 0 && currentQuestionIndex < 6) {
      handleLoadSurvey();
      return;
    }
    console.log("??????????????", currentQuestionIndex);
    router.push("/onboarding");
  }, [
    firstTemplateId,
    loadSurvey,
    router,
    handleLoadSurvey,
    currentQuestionIndex,
  ]);

  if (isLoading || !surveyTemplate) {
    return <LoadingScreen />;
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
  // TODO 템플릿에 질문이 여러개 있지 않아서 임의로 5번까지는 이렇게 하자.
  // const currentQuestion = questions[currentQuestionIndex];
  const currentQuestion = questions[0];
  const currentOptions = currentQuestion?.options || [];

  // Find if user has already answered this question
  const currentResponse = responses.find(
    (r) => r.questionId === currentQuestion?.id
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
    // if (isLastQuestion) {
    if (currentQuestionIndex === 5) {
      handleSubmit();
    } else {
      nextQuestion();
    }
  };

  const handleSubmit = async () => {
    try {
      await submitSurvey();
      router.push("/profile");
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

      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          options={currentOptions}
          selectedOptionId={selectedOptionId}
          onSelect={handleOptionSelect}
        />
      )}

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
    <Suspense fallback={<LoadingScreen />}>
      <SurveyContent />
    </Suspense>
  );
}
