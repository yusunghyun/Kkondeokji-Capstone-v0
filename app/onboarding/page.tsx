"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"
import OnboardingStreamingQuestion from "@/components/onboarding/streaming-question"
import OnboardingFitnessQuestion from "@/components/onboarding/fitness-question"
import OnboardingBooksQuestion from "@/components/onboarding/books-question"
import OnboardingHometownQuestion from "@/components/onboarding/hometown-question"
import { PageContainer } from "@/components/ui/page-container"
import { GradientButton } from "@/components/ui/gradient-button"
import { useUser } from "@/contexts/user-context"

export default function OnboardingPage() {
  const router = useRouter()
  const { userInterests, updateInterests } = useUser()
  const [step, setStep] = useState(1)
  const totalSteps = 4

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      router.push("/profile")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} disabled={step === 1} className="rounded-full">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div className="text-sm text-gray-600">
          Step {step} of {totalSteps}
        </div>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </div>

      <Progress value={(step / totalSteps) * 100} className="h-2 mb-8" />

      <Card className="flex-1 p-6 rounded-2xl shadow-sm">
        {step === 1 && (
          <OnboardingStreamingQuestion
            value={userInterests.streaming}
            onChange={(value) => updateInterests("streaming", value)}
          />
        )}

        {step === 2 && (
          <OnboardingFitnessQuestion
            value={userInterests.fitness}
            onChange={(value) => updateInterests("fitness", value)}
          />
        )}

        {step === 3 && (
          <OnboardingBooksQuestion value={userInterests.books} onChange={(value) => updateInterests("books", value)} />
        )}

        {step === 4 && (
          <OnboardingHometownQuestion
            value={userInterests.hometown}
            onChange={(value) => updateInterests("hometown", value)}
          />
        )}
      </Card>

      <GradientButton onClick={handleNext} className="mt-6 py-6">
        {step === totalSteps ? "Complete" : "Continue"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </GradientButton>
    </PageContainer>
  )
}
