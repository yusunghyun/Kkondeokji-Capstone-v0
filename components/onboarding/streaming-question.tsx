"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { InterestBadge } from "@/components/ui/interest-badge"
import { QuestionLayout } from "@/components/onboarding/question-layout"
import { mockStreamingOptions } from "@/constants/mock-data"

interface StreamingQuestionProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function OnboardingStreamingQuestion({ value, onChange }: StreamingQuestionProps) {
  const [inputValue, setInputValue] = useState("")

  const handleAddShow = (show: string) => {
    if (!value.includes(show) && show.trim() !== "") {
      onChange([...value, show])
      setInputValue("")
    }
  }

  const handleRemoveShow = (show: string) => {
    onChange(value.filter((s) => s !== show))
  }

  const handleToggleShow = (show: string) => {
    if (value.includes(show)) {
      handleRemoveShow(show)
    } else {
      handleAddShow(show)
    }
  }

  return (
    <QuestionLayout title="What have you watched recently?" description="Tell us about your favorite shows and movies">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a show or movie..."
          className="pl-10 pr-10 py-6 rounded-full"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAddShow(inputValue)
            }
          }}
        />
        {inputValue && (
          <button onClick={() => handleAddShow(inputValue)} className="absolute right-3 top-3">
            <Plus className="h-4 w-4 text-pink-500" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-500">Popular on Netflix</p>
        <div className="flex flex-wrap gap-2">
          {mockStreamingOptions.map((show) => (
            <InterestBadge
              key={show}
              label={show}
              variant="primary"
              selected={value.includes(show)}
              onClick={() => handleToggleShow(show)}
            />
          ))}
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">Your selections</p>
          <div className="flex flex-wrap gap-2">
            {value.map((show) => (
              <InterestBadge
                key={show}
                label={show}
                variant="primary"
                selected
                onRemove={() => handleRemoveShow(show)}
              />
            ))}
          </div>
        </div>
      )}
    </QuestionLayout>
  )
}
