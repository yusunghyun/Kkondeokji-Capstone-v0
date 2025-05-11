"use client"

import { useEffect, useState } from "react"
import { cn } from "@/shared/utils/cn"

interface MatchGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function MatchGauge({ score, size = 200, strokeWidth = 12, className }: MatchGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0)

  // Animate the score
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev >= score) {
          clearInterval(interval)
          return score
        }
        return prev + 1
      })
    }, 20)

    return () => clearInterval(interval)
  }, [score])

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (displayScore / 100) * circumference

  // Determine color based on score
  const getColor = () => {
    if (displayScore >= 80) return "text-green-500"
    if (displayScore >= 60) return "text-primary"
    if (displayScore >= 40) return "text-yellow-500"
    if (displayScore >= 20) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={getColor()}
        />
      </svg>

      {/* Score text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-4xl font-bold", getColor())}>{displayScore}%</span>
        <span className="text-sm text-gray-500">매칭률</span>
      </div>
    </div>
  )
}
