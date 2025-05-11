import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { InterestBadge } from "@/components/ui/interest-badge"

interface InterestSectionProps {
  title: string
  icon: ReactNode
  interests: string[]
  variant?: "primary" | "secondary"
  emptyMessage?: string
}

export function InterestSection({
  title,
  icon,
  interests,
  variant = "primary",
  emptyMessage = "No interests added yet",
}: InterestSectionProps) {
  if (interests.length === 0 && !emptyMessage) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="font-medium">{title}</h3>
        </div>

        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <InterestBadge key={interest} label={interest} variant={variant} selected />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  )
}
