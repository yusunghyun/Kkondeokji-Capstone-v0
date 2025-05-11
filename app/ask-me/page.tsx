"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/ui/page-header"
import { QuestionForm } from "@/components/ask-me/question-form"
import { QuestionCard } from "@/components/ask-me/question-card"
import { mockQuestions } from "@/constants/mock-data"

export default function AskMePage() {
  const [questions, setQuestions] = useState(mockQuestions)

  const handleSubmitQuestion = (questionText: string) => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
        text: questionText,
        anonymous: true,
        answered: false,
        answer: "",
      },
    ])
  }

  return (
    <PageContainer>
      <PageHeader title="Ask Me Anything" backHref="/profile" />

      <QuestionForm onSubmit={handleSubmitQuestion} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-primary-500" />
          Questions & Answers
        </h2>

        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    </PageContainer>
  )
}
