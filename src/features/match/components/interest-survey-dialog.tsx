"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { Loader2, Heart, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SurveyQuestion {
  id: number;
  question: string;
  category: string;
  options: Array<{
    text: string;
    value: string;
  }>;
}

interface InterestSurveyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  partnerInterests: string[];
  currentUserName?: string;
  onSurveyComplete?: (responses: any[]) => void;
}

export function InterestSurveyDialog({
  isOpen,
  onClose,
  partnerName,
  partnerInterests: initialPartnerInterests,
  currentUserName = "당신",
  onSurveyComplete,
}: InterestSurveyDialogProps) {
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<
    Array<{
      questionId: number;
      question: string;
      answer: string;
      category: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // 설문 생성
  const generateSurvey = async () => {
    let partnerInterests = [...(initialPartnerInterests || [])]; // 복사본 생성

    console.log("🔍 관심사 설문 생성 요청 상세:", {
      partnerName,
      partnerInterests,
      partnerInterestsLength: partnerInterests?.length,
      partnerInterestsType: typeof partnerInterests,
      isArray: Array.isArray(partnerInterests),
    });

    // 관심사가 없어도 진행할 수 있도록 변경
    if (!partnerInterests || !Array.isArray(partnerInterests)) {
      console.warn("⚠️ 관심사 배열이 올바르지 않음, 빈 배열로 설정");
      partnerInterests = [];
    }

    // 관심사가 비어있어도 폴백 설문으로 진행
    if (partnerInterests.length === 0) {
      console.log("📝 관심사가 없지만 일반 설문으로 진행");
    }

    setIsGenerating(true);
    try {
      console.log("🎯 관심사 설문 생성 요청:", {
        partnerInterests,
        partnerName,
      });

      const response = await fetch("/api/generate-interest-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerInterests,
          partnerName,
          currentUserName,
        }),
      });

      if (!response.ok) {
        throw new Error("설문 생성 실패");
      }

      const result = await response.json();
      console.log("✅ 관심사 설문 생성 완료:", result);

      setSurveyQuestions(result.surveyQuestions || []);
      setCurrentQuestionIndex(0);
      setResponses([]);
      setIsCompleted(false);
    } catch (error) {
      console.error("❌ 설문 생성 에러:", error);
      toast.error("설문 생성 중 오류가 발생했습니다.");
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  // 다이얼로그 열릴 때 설문 생성
  useEffect(() => {
    if (isOpen && surveyQuestions.length === 0) {
      generateSurvey();
    }
  }, [isOpen]);

  // 답변 선택
  const handleAnswer = (option: { text: string; value: string }) => {
    const currentQuestion = surveyQuestions[currentQuestionIndex];

    const newResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: option.text,
      category: currentQuestion.category,
    };

    setIsLoading(true);

    // 응답 저장
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    setTimeout(() => {
      if (currentQuestionIndex < surveyQuestions.length - 1) {
        // 다음 질문으로
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // 설문 완료
        setIsCompleted(true);
        onSurveyComplete?.(updatedResponses);

        toast.success("설문이 완료되었습니다! 매칭 정보가 업데이트됩니다.");
      }
      setIsLoading(false);
    }, 500);
  };

  // 설문 진행률
  const progress =
    surveyQuestions.length > 0
      ? ((currentQuestionIndex + 1) / surveyQuestions.length) * 100
      : 0;

  if (isGenerating) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Sparkles className="inline mr-2" size={20} />
              {partnerName}님 맞춤 설문 생성 중
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <Heart
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-pink-500"
                size={20}
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {initialPartnerInterests && initialPartnerInterests.length > 0
                  ? `${partnerName}님의 관심사를 분석하여\n맞춤 질문을 만들고 있어요...`
                  : `${partnerName}님과 대화할 수 있는\n재미있는 질문을 만들고 있어요...`}
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {initialPartnerInterests &&
                initialPartnerInterests.length > 0 ? (
                  initialPartnerInterests
                    .slice(0, 3)
                    .map((interest: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))
                ) : (
                  <Badge variant="outline" className="text-xs">
                    대화 주제 생성 중
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <CheckCircle className="inline mr-2" size={20} />
              설문 완료!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-6">
            <p className="text-gray-600">
              {partnerName}님과의 매칭 정보가 업데이트되었습니다!
              <br />
              새로운 공통점을 찾을 수 있을 거예요. 😊
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">답변한 카테고리:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {Array.from(new Set(responses.map((r) => r.category))).map(
                  (category, index) => (
                    <Badge key={index} variant="default" className="text-xs">
                      {category}
                    </Badge>
                  )
                )}
              </div>
            </div>
            <Button onClick={onClose} className="w-full">
              매칭 결과 확인하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (surveyQuestions.length === 0) {
    return null;
  }

  const currentQuestion = surveyQuestions[currentQuestionIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">
            <Heart className="inline mr-2 text-pink-500" size={18} />
            {partnerName}님 관심사 설문
          </DialogTitle>
        </DialogHeader>

        {/* 진행 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              질문 {currentQuestionIndex + 1} / {surveyQuestions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* 질문 카드 */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* 카테고리 */}
              <Badge variant="secondary" className="mb-2">
                {currentQuestion.category}
              </Badge>

              {/* 질문 */}
              <h3 className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </h3>

              {/* 선택지 */}
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left p-4 h-auto hover:bg-blue-50 hover:border-blue-200"
                    onClick={() => handleAnswer(option)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {option.text}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 하단 정보 */}
        <div className="text-center text-sm text-gray-500">
          이 설문을 통해 {partnerName}님과의 새로운 공통점을 찾아보세요! 🎯
        </div>
      </DialogContent>
    </Dialog>
  );
}
