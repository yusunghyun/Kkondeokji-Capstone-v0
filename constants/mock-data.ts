// Mock data for the application
// This centralizes all mock data in one place

export const mockStreamingOptions = [
  "I Am Solo",
  "Squid Game",
  "Stranger Things",
  "Wednesday",
  "Bridgerton",
  "Money Heist",
  "The Queen's Gambit",
  "Narcos",
  "Black Mirror",
  "Kingdom",
]

export const mockFitnessOptions = [
  { name: "Yoga", emoji: "🧘" },
  { name: "Running", emoji: "🏃" },
  { name: "Weightlifting", emoji: "🏋️" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Cycling", emoji: "🚴" },
  { name: "Pilates", emoji: "💪" },
  { name: "Hiking", emoji: "🥾" },
  { name: "Dancing", emoji: "💃" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Tennis", emoji: "🎾" },
]

export const mockBookOptions = [
  "Atomic Habits",
  "The Alchemist",
  "Harry Potter",
  "It Ends With Us",
  "The Seven Husbands of Evelyn Hugo",
  "Fourth Wing",
  "The Midnight Library",
  "Where the Crawdads Sing",
  "Educated",
  "Pachinko",
]

export const mockLocationOptions = [
  "Seoul, South Korea",
  "Busan, South Korea",
  "Incheon, South Korea",
  "Daegu, South Korea",
  "Daejeon, South Korea",
  "Gwangju, South Korea",
  "Suwon, South Korea",
  "Ulsan, South Korea",
  "Jeju, South Korea",
]

export const mockUserProfile = {
  id: "user123",
  name: "Kkondeokji User",
  joinDate: "April 2023",
  interests: {
    streaming: ["I Am Solo", "Squid Game", "Money Heist"],
    fitness: ["Running", "Yoga"],
    books: ["Atomic Habits", "The Alchemist"],
    hometown: "Seoul, South Korea",
  },
}

export const mockOtherUser = {
  id: "user456",
  name: "Alex Kim",
  interests: {
    streaming: ["I Am Solo", "Squid Game", "Money Heist"],
    fitness: ["Running", "Yoga"],
    books: ["Atomic Habits", "The Alchemist"],
    hometown: "Seoul, South Korea",
  },
}

export const mockConversationStarters = [
  "Have you watched the latest season of I Am Solo?",
  "How long have you been practicing yoga?",
  "What did you think about the ending of The Alchemist?",
  "What's your favorite place in Seoul?",
  "Did you enjoy Squid Game? I thought the ending was surprising!",
]

export const mockQuestions = [
  {
    id: 1,
    text: "What's your favorite movie of all time?",
    anonymous: true,
    answered: true,
    answer: "Definitely Parasite! I love how it blends social commentary with suspense.",
  },
  {
    id: 2,
    text: "Do you prefer coffee or tea?",
    anonymous: false,
    answered: true,
    answer: "I'm a tea person! Especially green tea and herbal teas.",
  },
  {
    id: 3,
    text: "What's your dream travel destination?",
    anonymous: true,
    answered: false,
    answer: "",
  },
]
