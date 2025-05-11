"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface InterestBadgeProps {
  label: string
  variant?: "primary" | "secondary"
  onRemove?: () => void
  onClick?: () => void
  selected?: boolean
  className?: string
  icon?: React.ReactNode
}

export function InterestBadge({
  label,
  variant = "primary",
  onRemove,
  onClick,
  selected = false,
  className,
  icon,
}: InterestBadgeProps) {
  const baseClasses = "rounded-full px-3 py-1 cursor-pointer"
  const variantClasses = {
    primary: selected ? "badge-primary" : "hover:bg-gray-100",
    secondary: selected ? "badge-secondary" : "hover:bg-gray-100",
  }

  return (
    <Badge
      variant={selected ? "default" : "outline"}
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}
