import { Button } from "@/components/ui/button"
import { Heart, MessageCircle } from "lucide-react"
import { GradientButton } from "@/components/ui/gradient-button"

export function MatchActions() {
  return (
    <div className="flex gap-2 mt-auto">
      <Button variant="outline" className="flex-1 rounded-full">
        <Heart className="h-4 w-4 mr-2" />
        Like
      </Button>
      <GradientButton className="flex-1">
        <MessageCircle className="h-4 w-4 mr-2" />
        Message
      </GradientButton>
    </div>
  )
}
