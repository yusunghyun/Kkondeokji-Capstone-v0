"use client"

import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { QuestionLayout } from "@/components/onboarding/question-layout"
import { mockLocationOptions } from "@/constants/mock-data"

interface HometownQuestionProps {
  value: string
  onChange: (value: string) => void
}

export default function OnboardingHometownQuestion({ value, onChange }: HometownQuestionProps) {
  const handleSelectLocation = (location: string) => {
    onChange(location)
  }

  return (
    <QuestionLayout title="Where were you born?" description="Share your hometown or place of birth">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your hometown..."
          className="pl-10 py-6 rounded-full"
        />
      </div>

      {!value && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-500">Popular locations</p>
          <div className="flex flex-wrap gap-2">
            {mockLocationOptions.map((location) => (
              <Badge
                key={location}
                variant="outline"
                className="rounded-full px-3 py-1 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelectLocation(location)}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {location}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {value && (
        <div className="p-4 bg-secondary-50 rounded-xl">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-secondary-500 mr-2" />
            <span className="text-secondary-800 font-medium">{value}</span>
          </div>
          <p className="text-sm text-secondary-600 mt-2">We'll use this to help you find people from your hometown!</p>
        </div>
      )}
    </QuestionLayout>
  )
}
