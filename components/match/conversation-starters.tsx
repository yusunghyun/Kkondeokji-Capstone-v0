import { Card, CardContent } from "@/components/ui/card"

interface ConversationStartersProps {
  starters: string[]
}

export function ConversationStarters({ starters }: ConversationStartersProps) {
  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800">Conversation Starters</h2>

      <Card>
        <CardContent className="p-4 space-y-3">
          {starters.map((starter, index) => (
            <div key={index} className="p-3 bg-gradient-to-b from-pink-50 to-purple-50 rounded-lg">
              <p className="text-gray-800">{starter}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
