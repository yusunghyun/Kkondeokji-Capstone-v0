import { Card, CardContent } from "@/shared/ui/card"
import { MessageCircle } from "lucide-react"

interface SmallTalkCardProps {
  suggestions: string[]
}

export function SmallTalkCard({ suggestions }: SmallTalkCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <MessageCircle className="mr-2 h-5 w-5 text-primary" />
          <h3 className="font-medium">대화 주제 추천</h3>
        </div>

        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="p-3 bg-primary/5 rounded-lg">
              "{suggestion}"
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
