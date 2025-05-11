"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { useParams } from "next/navigation"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/ui/page-header"
import { InterestSection } from "@/components/ui/interest-section"
import { MatchHeader } from "@/components/match/match-header"
import { ConversationStarters } from "@/components/match/conversation-starters"
import { MatchActions } from "@/components/match/match-actions"
import { useUser } from "@/contexts/user-context"
import { mockOtherUser, mockConversationStarters } from "@/constants/mock-data"
import { Tv, Dumbbell, Book, MapPin } from "lucide-react"

export default function MatchPage() {
  const params = useParams()
  const { userInterests } = useUser()
  const [otherUser, setOtherUser] = useState(mockOtherUser)
  const [matches, setMatches] = useState({
    streaming: [],
    fitness: [],
    books: [],
    hometown: false,
  })

  useEffect(() => {
    // In a real app, this would fetch the other user's data from an API
    // For this demo, we're using mock data

    // Calculate matches
    const streamingMatches = userInterests.streaming.filter((item) => otherUser.interests.streaming.includes(item))

    const fitnessMatches = userInterests.fitness.filter((item) => otherUser.interests.fitness.includes(item))

    const bookMatches = userInterests.books.filter((item) => otherUser.interests.books.includes(item))

    const hometownMatch = userInterests.hometown === otherUser.interests.hometown

    setMatches({
      streaming: streamingMatches,
      fitness: fitnessMatches,
      books: bookMatches,
      hometown: hometownMatch,
    })
  }, [userInterests, otherUser])

  const totalMatches =
    matches.streaming.length + matches.fitness.length + matches.books.length + (matches.hometown ? 1 : 0)

  return (
    <PageContainer>
      <PageHeader title="Match Results" backHref="/profile" />

      <MatchHeader name={otherUser.name} totalMatches={totalMatches} />

      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-primary-500" />
          Common Interests
        </h2>

        {matches.hometown && (
          <InterestSection
            title="You're both from the same place!"
            icon={<MapPin className="h-4 w-4 text-primary-500" />}
            interests={[otherUser.interests.hometown]}
            variant="primary"
          />
        )}

        {matches.streaming.length > 0 && (
          <InterestSection
            title="You both watched"
            icon={<Tv className="h-4 w-4 text-primary-500" />}
            interests={matches.streaming}
            variant="primary"
          />
        )}

        {matches.fitness.length > 0 && (
          <InterestSection
            title="You both enjoy"
            icon={<Dumbbell className="h-4 w-4 text-secondary-500" />}
            interests={matches.fitness}
            variant="secondary"
          />
        )}

        {matches.books.length > 0 && (
          <InterestSection
            title="You both read"
            icon={<Book className="h-4 w-4 text-secondary-500" />}
            interests={matches.books}
            variant="secondary"
          />
        )}
      </div>

      <ConversationStarters starters={mockConversationStarters} />

      <MatchActions />
    </PageContainer>
  )
}
