import type { ReactNode } from "react"

interface QuestionLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export function QuestionLayout({ title, description, children }: QuestionLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  )
}
