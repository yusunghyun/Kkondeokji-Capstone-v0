import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles } from "lucide-react"

interface MatchHeaderProps {
  name: string
  totalMatches: number
}

export function MatchHeader({ name, totalMatches }: MatchHeaderProps) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-24 relative">
        <div className="absolute -bottom-10 left-4">
          <Avatar className="h-20 w-20 border-4 border-white">
            <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Profile" />
            <AvatarFallback className="bg-pink-200 text-pink-800 text-xl">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <CardContent className="pt-12 pb-6">
        <h2 className="text-xl font-bold">{name}</h2>

        <div className="mt-4 flex items-center">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            {totalMatches} shared interests
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
