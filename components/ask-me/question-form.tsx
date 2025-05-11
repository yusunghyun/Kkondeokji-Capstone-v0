"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"

interface QuestionFormProps {
  onSubmit: (question: string) => void
}

export function QuestionForm({ onSubmit }: QuestionFormProps) {
  const [question, setQuestion] = useState("")

  const handleSubmit = () => {
    if (question.trim() === "") return
    onSubmit(question)
    setQuestion("")
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        <Textarea
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="resize-none rounded-xl"
          rows={3}
        />

        <div className="flex justify-end">
          <GradientButton onClick={handleSubmit} disabled={question.trim() === ""}>
            <Send className="h-4 w-4 mr-2" />
            Send Question
          </GradientButton>
        </div>
      </CardContent>
    </Card>
  )
}
