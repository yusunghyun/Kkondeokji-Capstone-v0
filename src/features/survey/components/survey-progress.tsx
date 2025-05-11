import { Progress } from "@/shared/ui/progress"

interface SurveyProgressProps {
  currentStep: number
  totalSteps: number
}

export function SurveyProgress({ currentStep, totalSteps }: SurveyProgressProps) {
  const progress = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex justify-between mb-2 text-sm">
        <span>
          질문 {currentStep} / {totalSteps}
        </span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  )
}
