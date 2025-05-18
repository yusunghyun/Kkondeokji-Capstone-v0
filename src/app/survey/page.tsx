"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSurveyStore } from "@/shared/store/surveyStore";
import { QuestionCard } from "@/features/survey/components/question-card";
import { LoadingScreen } from "@/features/survey/components/loading-screen";

export default function SurveyPage() {
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

  useEffect(() => {
    // If no survey template is loaded, redirect to onboarding
    if (!surveyTemplate && !isLoading) {
      router.push("/onboarding");
    }
  }, [surveyTemplate, isLoading, router]);

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
          <Button onClick={() => router.push("/onboarding")}>
            다시 시작하기
          </Button>
        </Card>
      </div>
    );
  }

  const questions = surveyTemplate.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
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
    if (isLastQuestion) {
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
