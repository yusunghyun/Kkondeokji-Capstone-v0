"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { QuestionCard } from "@/features/survey/components/question-card";
import { LoadingScreen } from "@/features/survey/components/loading-screen";
import { SURVEY_TEMPLATES } from "@/core/infra/MockServey";
import type { SurveyTemplate } from "@/shared/types/domain";

export default function SurveyPage() {
  const router = useRouter();

  const [surveyTemplate, setSurveyTemplate] = useState<SurveyTemplate | null>(
    null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<
    Array<{ questionId: string; optionId: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const template = SURVEY_TEMPLATES[0];
      if (template) {
        setSurveyTemplate(template);
      } else {
        setError("설문지를 찾을 수 없습니다.");
      }
    } catch (err) {
      setError("설문지 로딩 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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

  const currentResponse = responses.find(
    (r) => r.questionId === currentQuestion?.id
  );
  const selectedOptionId = currentResponse?.optionId;

  const progress = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100
  );
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = !!selectedOptionId;

  const handleOptionSelect = (optionId: number) => {
    if (currentQuestion) {
      setResponses((prev) => {
        const exists = prev.some((r) => r.questionId === currentQuestion.id);
        if (exists) {
          return prev.map((r) =>
            r.questionId === currentQuestion.id ? { ...r, optionId } : r
          );
        } else {
          return [...prev, { questionId: currentQuestion.id, optionId }];
        }
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
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
      console.log("설문 제출:", {
        surveyTemplateId: surveyTemplate.id,
        responses,
      });
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
