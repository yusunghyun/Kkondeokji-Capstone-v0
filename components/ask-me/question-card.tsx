import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Question {
  id: number
  text: string
  anonymous: boolean
  answered: boolean
  answer: string
}

interface QuestionCardProps {
  question: Question
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Card key={question.id} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex justify-between items-start mb-2">
            <p className="font-medium">{question.text}</p>
            <Badge className="text-xs bg-gray-100 text-gray-800">
              {question.anonymous ? "Anonymous" : "From a friend"}
            </Badge>
          </div>
        </div>

        {question.answered ? (
          <div className="p-4 gradient-background">
            <p className="text-gray-800">{question.answer}</p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50">
            <p className="text-gray-500 text-sm italic">Not answered yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
