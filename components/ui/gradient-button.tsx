import type React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import type { ButtonProps } from "@/components/ui/button"

interface GradientButtonProps extends ButtonProps {
  children: React.ReactNode
  className?: string
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    )
  },
)

GradientButton.displayName = "GradientButton"
