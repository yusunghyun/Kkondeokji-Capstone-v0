"use client"

import { Button } from "@/shared/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface SurveyNavigationProps {
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
  isFirst: boolean
  isLast: boolean
  canProceed: boolean
}

export function SurveyNavigation({ onPrev, onNext, onSubmit, isFirst, isLast, canProceed }: SurveyNavigationProps) {
  return (
    <div className="flex justify-between w-full max-w-md mx-auto mt-6">
      <Button variant="outline" onClick={onPrev} disabled={isFirst} className="flex items-center">
        <ArrowLeft className="mr-2 h-4 w-4" />
        이전
      </Button>

      {isLast ? (
        <Button onClick={onSubmit} disabled={!canProceed} className="flex items-center">
          완료
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canProceed} className="flex items-center">
          다음
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
