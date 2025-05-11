"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useUserStore } from "@/shared/store/userStore"
import { useSurveyStore } from "@/shared/store/surveyStore"

export default function OnboardingPage() {
  const router = useRouter()
  const { createUser } = useUserStore()
  const { generateSurvey, startSurvey } = useSurveyStore()

  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [occupation, setOccupation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Create user
      const userId = await createUser({
        name: name || undefined,
        age: age ? Number.parseInt(age) : undefined,
        occupation: occupation || undefined,
      })

      // Generate personalized survey
      const templateId = await generateSurvey({
        name: name || undefined,
        age: age ? Number.parseInt(age) : undefined,
        occupation: occupation || undefined,
      })

      // Start survey
      await startSurvey(userId, templateId)

      // Navigate to survey
      router.push("/survey")
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <main className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">시작하기</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">나이</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="나이를 입력하세요"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">직업</Label>
                <Input
                  id="occupation"
                  placeholder="직업을 입력하세요"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600" disabled={isLoading}>
                {isLoading ? "처리 중..." : "설문 시작하기"}
              </Button>

              <p className="text-xs text-center text-gray-500">입력하신 정보는 맞춤형 설문 생성에 사용됩니다.</p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
