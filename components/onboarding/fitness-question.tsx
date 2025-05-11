"use client"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import { useState } from "react"
import { QuestionLayout } from "@/components/onboarding/question-layout"
import { mockFitnessOptions } from "@/constants/mock-data"

interface FitnessQuestionProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function OnboardingFitnessQuestion({ value, onChange }: FitnessQuestionProps) {
  const [inputValue, setInputValue] = useState("")

  const handleToggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <QuestionLayout title="What's your fitness routine?" description="Tell us about your workout preferences">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Your gym or fitness center..."
          className="pl-10 py-6 rounded-full"
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputValue.trim() !== "") {
              e.preventDefault()
              handleToggleOption(inputValue)
              setInputValue("")
            }
          }}
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-500">Activities you enjoy</p>
        <div className="grid grid-cols-4 gap-2">
          {mockFitnessOptions.map((option) => (
            <Badge
              key={option.name}
              variant={value.includes(option.name) ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-20 rounded-xl cursor-pointer ${
                value.includes(option.name) ? "badge-secondary" : "hover:bg-gray-100"
              }`}
              onClick={() => handleToggleOption(option.name)}
            >
              <span className="text-2xl mb-1">{option.emoji}</span>
              <span className="text-xs">{option.name}</span>
            </Badge>
          ))}
        </div>
      </div>
    </QuestionLayout>
  )
}
