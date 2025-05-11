import { InterestSection } from "@/components/ui/interest-section"
import { Tv, Dumbbell, Book, MapPin } from "lucide-react"

interface InterestTabProps {
  interests: {
    streaming: string[]
    fitness: string[]
    books: string[]
    hometown: string
  }
}

export function InterestTab({ interests }: InterestTabProps) {
  return (
    <div className="space-y-4">
      {interests.hometown && (
        <InterestSection
          title="Hometown"
          icon={<MapPin className="h-4 w-4 text-primary-500" />}
          interests={[interests.hometown]}
          variant="primary"
        />
      )}

      {interests.streaming.length > 0 && (
        <InterestSection
          title="Streaming"
          icon={<Tv className="h-4 w-4 text-primary-500" />}
          interests={interests.streaming}
          variant="primary"
        />
      )}

      {interests.fitness.length > 0 && (
        <InterestSection
          title="Fitness"
          icon={<Dumbbell className="h-4 w-4 text-secondary-500" />}
          interests={interests.fitness}
          variant="secondary"
        />
      )}

      {interests.books.length > 0 && (
        <InterestSection
          title="Books"
          icon={<Book className="h-4 w-4 text-secondary-500" />}
          interests={interests.books}
          variant="secondary"
        />
      )}
    </div>
  )
}
