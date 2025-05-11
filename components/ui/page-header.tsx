import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  backHref?: string
  rightElement?: ReactNode
  className?: string
}

export function PageHeader({ title, backHref, rightElement, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      {backHref ? (
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href={backHref}>
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Link>
        </Button>
      ) : (
        <div className="w-9" /> // Spacer for alignment
      )}
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      {rightElement ? rightElement : <div className="w-9" />} {/* Spacer for alignment */}
    </div>
  )
}
