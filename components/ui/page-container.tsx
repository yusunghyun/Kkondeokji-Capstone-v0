import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("flex flex-col min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-4", className)}>
      {children}
    </div>
  )
}
