"use client";

import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

interface AILoadingScreenProps {
  userName?: string;
}

const loadingStages = [
  {
    stage: 1,
    title: "🤖 AI가 당신을 분석하고 있어요",
    description: "이름, 나이, 직업을 바탕으로 맞춤형 질문을 구상 중...",
    duration: 3000, // 3초로 늘림
  },
  {
    stage: 2,
    title: "🔥 최신 트렌드를 조사하고 있어요",
    description: "요즘 핫한 드라마, 웹툰, 카페 트렌드를 분석 중...",
    duration: 3000, // 3초로 늘림
  },
  {
    stage: 3,
    title: "🎯 당신만의 질문을 생성하고 있어요",
    description: "8개의 완벽한 매칭 질문을 AI가 제작 중...",
    duration: 4000, // 4초로 늘림
  },
  {
    stage: 4,
    title: "✨ 마지막 점검을 하고 있어요",
    description: "품질 검수 및 최적화 작업 진행 중...",
    duration: 2000, // 2초로 늘림
  },
];

const funnyMessages = [
  "당신의 취향을 읽는 중... 📚",
  "MBTI보다 정확한 분석 중... 🎯",
  "매칭 알고리즘 가동 중... ⚡",
  "운명의 상대방을 찾는 중... 💕",
  "AI가 열심히 일하고 있어요... 🔧",
  "완벽한 질문을 조합하는 중... 🧩",
  "트렌드 분석 완료, 개인화 진행 중... 🎨",
  "최고의 매칭을 위해 계산 중... 💎",
];

export function AILoadingScreen({ userName }: AILoadingScreenProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [funnyMessage, setFunnyMessage] = useState(funnyMessages[0]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let stageTimeout: NodeJS.Timeout;
    let messageInterval: NodeJS.Timeout;

    // 재미있는 메시지 순환
    messageInterval = setInterval(() => {
      setFunnyMessage(
        funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
      );
    }, 2000); // 2초마다 메시지 변경

    // 🎯 개선된 진행률 업데이트 (더 현실적인 타이밍)
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        // 단계별로 더 세밀한 진행률 조정
        const stageProgress = (currentStage / loadingStages.length) * 100;
        const maxProgressForCurrentStage =
          ((currentStage + 1) / loadingStages.length) * 100;

        // 각 단계에서 점진적으로 진행되도록
        if (prev >= maxProgressForCurrentStage - 10) {
          // 각 단계 말미에서는 더 천천히
          return prev + Math.random() * 0.5;
        } else if (prev >= 95) {
          // 95% 이후에는 매우 천천히 (100%에 도달하지 않도록)
          return prev + Math.random() * 0.1;
        } else if (prev >= 85) {
          // 85% 이후 조금 천천히
          return prev + Math.random() * 1.5;
        } else {
          // 일반적인 진행
          return prev + Math.random() * 3 + 0.5;
        }
      });
    }, 300); // 300ms마다 업데이트 (더 부드럽게)

    // 단계별 진행
    const processStages = async () => {
      for (let i = 0; i < loadingStages.length; i++) {
        setCurrentStage(i);
        await new Promise((resolve) => {
          stageTimeout = setTimeout(resolve, loadingStages[i].duration);
        });
      }

      // 모든 단계 완료 후 100%로 설정하고 완료 표시
      setTimeout(() => {
        setProgress(100);
        setIsComplete(true);
      }, 500);
    };

    processStages();

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(stageTimeout);
    };
  }, [currentStage]);

  const currentStageData = loadingStages[currentStage] || loadingStages[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 text-center space-y-6 shadow-lg">
        {/* 메인 로딩 애니메이션 */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            {/* 회전하는 외부 링 */}
            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full animate-spin">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-500 rounded-full transform -translate-x-1/2 -translate-y-1"></div>
            </div>
            {/* 중앙 AI 아이콘 */}
            <div className="absolute inset-2 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-2xl text-white font-bold animate-pulse">
              AI
            </div>
          </div>
        </div>

        {/* 현재 단계 */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">
            {currentStageData.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentStageData.description}
          </p>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full h-3 bg-gray-200" />
          {/* 진행률별 상태 표시 */}
          <div className="text-xs text-center text-gray-400">
            {progress < 25 && "🔍 분석 시작..."}
            {progress >= 25 && progress < 50 && "📊 데이터 수집 중..."}
            {progress >= 50 && progress < 75 && "🎨 질문 생성 중..."}
            {progress >= 75 && progress < 95 && "✅ 거의 완료..."}
            {progress >= 95 && !isComplete && "🎯 최종 마무리 중..."}
            {isComplete && "🎉 완성!"}
          </div>
        </div>

        {/* 재미있는 메시지 */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
          <p className="text-emerald-700 text-sm font-medium animate-pulse">
            {funnyMessage}
          </p>
        </div>

        {/* 사용자 맞춤 메시지 */}
        {userName && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-blue-700 text-sm">
              <span className="font-bold">{userName}</span>님을 위한 완벽한
              설문을 준비하고 있어요! 🎯
            </p>
          </div>
        )}

        {/* 단계 인디케이터 */}
        <div className="flex justify-center space-x-2 pt-4">
          {loadingStages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                index <= currentStage
                  ? "bg-emerald-500 scale-110"
                  : index === currentStage + 1
                  ? "bg-emerald-300 scale-105"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* 완료 상태 */}
        {isComplete && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 animate-bounce">
            <p className="text-green-700 font-semibold">
              🎉 완성! 곧 당신만의 설문이 시작됩니다!
            </p>
          </div>
        )}

        {/* 팁 */}
        <div className="text-xs text-gray-400 pt-4">
          💡 팁: AI가 생성한 질문들은 당신의 프로필과 최신 트렌드를 반영합니다
        </div>
      </Card>
    </div>
  );
}
