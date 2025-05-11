import type { Option, Question, Response, UserProfile } from "@/shared/types/domain"

export const mockQuestions: Question[] = [
  { id: 1, text: "어떤 음악을 좋아하세요?", weight: 2 },
  { id: 2, text: "여행 가고 싶은 곳은?", weight: 1 },
  { id: 3, text: "좋아하는 운동은?", weight: 1 },
  { id: 4, text: "최근에 본 영화나 드라마는?", weight: 2 },
  { id: 5, text: "관심있는 학문 분야는?", weight: 3 },
  { id: 6, text: "좋아하는 음식은?", weight: 1 },
  { id: 7, text: "취미는 무엇인가요?", weight: 2 },
  { id: 8, text: "좋아하는 책 장르는?", weight: 2 },
  { id: 9, text: "주말에 주로 무엇을 하나요?", weight: 1 },
  { id: 10, text: "관심있는 기술은?", weight: 3 },
]

export const mockOptions: Option[] = [
  // Music options (id: 1)
  { id: 1, questionId: 1, text: "팝", value: "POP", icon: "🎵" },
  { id: 2, questionId: 1, text: "록", value: "ROCK", icon: "🎸" },
  { id: 3, questionId: 1, text: "클래식", value: "CLASSICAL", icon: "🎻" },
  { id: 4, questionId: 1, text: "힙합", value: "HIPHOP", icon: "🎤" },
  { id: 5, questionId: 1, text: "재즈", value: "JAZZ", icon: "🎷" },

  // Travel options (id: 2)
  { id: 6, questionId: 2, text: "유럽", value: "EUROPE", icon: "🏰" },
  { id: 7, questionId: 2, text: "아시아", value: "ASIA", icon: "🏯" },
  { id: 8, questionId: 2, text: "북미", value: "NORTH_AMERICA", icon: "🗽" },
  { id: 9, questionId: 2, text: "남미", value: "SOUTH_AMERICA", icon: "🌴" },
  { id: 10, questionId: 2, text: "오세아니아", value: "OCEANIA", icon: "🏝️" },

  // Sports options (id: 3)
  { id: 11, questionId: 3, text: "축구", value: "SOCCER", icon: "⚽" },
  { id: 12, questionId: 3, text: "농구", value: "BASKETBALL", icon: "🏀" },
  { id: 13, questionId: 3, text: "야구", value: "BASEBALL", icon: "⚾" },
  { id: 14, questionId: 3, text: "테니스", value: "TENNIS", icon: "🎾" },
  { id: 15, questionId: 3, text: "수영", value: "SWIMMING", icon: "🏊" },

  // Movie/Drama options (id: 4)
  { id: 16, questionId: 4, text: "액션", value: "ACTION", icon: "💥" },
  { id: 17, questionId: 4, text: "로맨스", value: "ROMANCE", icon: "❤️" },
  { id: 18, questionId: 4, text: "코미디", value: "COMEDY", icon: "😂" },
  { id: 19, questionId: 4, text: "스릴러", value: "THRILLER", icon: "😱" },
  { id: 20, questionId: 4, text: "SF", value: "SCI_FI", icon: "🚀" },

  // Academic fields options (id: 5)
  { id: 21, questionId: 5, text: "컴퓨터 과학", value: "COMPUTER_SCIENCE", icon: "💻" },
  { id: 22, questionId: 5, text: "경영학", value: "BUSINESS", icon: "📊" },
  { id: 23, questionId: 5, text: "심리학", value: "PSYCHOLOGY", icon: "🧠" },
  { id: 24, questionId: 5, text: "생물학", value: "BIOLOGY", icon: "🧬" },
  { id: 25, questionId: 5, text: "물리학", value: "PHYSICS", icon: "⚛️" },

  // Food options (id: 6)
  { id: 26, questionId: 6, text: "한식", value: "KOREAN", icon: "🍲" },
  { id: 27, questionId: 6, text: "일식", value: "JAPANESE", icon: "🍣" },
  { id: 28, questionId: 6, text: "중식", value: "CHINESE", icon: "🥢" },
  { id: 29, questionId: 6, text: "양식", value: "WESTERN", icon: "🍝" },
  { id: 30, questionId: 6, text: "디저트", value: "DESSERT", icon: "🍰" },

  // Hobby options (id: 7)
  { id: 31, questionId: 7, text: "독서", value: "READING", icon: "📚" },
  { id: 32, questionId: 7, text: "게임", value: "GAMING", icon: "🎮" },
  { id: 33, questionId: 7, text: "요리", value: "COOKING", icon: "👨‍🍳" },
  { id: 34, questionId: 7, text: "그림", value: "DRAWING", icon: "🎨" },
  { id: 35, questionId: 7, text: "사진", value: "PHOTOGRAPHY", icon: "📷" },

  // Book genre options (id: 8)
  { id: 36, questionId: 8, text: "소설", value: "FICTION", icon: "📖" },
  { id: 37, questionId: 8, text: "자기계발", value: "SELF_HELP", icon: "🌱" },
  { id: 38, questionId: 8, text: "역사", value: "HISTORY", icon: "🏛️" },
  { id: 39, questionId: 8, text: "과학", value: "SCIENCE", icon: "🔬" },
  { id: 40, questionId: 8, text: "판타지", value: "FANTASY", icon: "🧙" },

  // Weekend activity options (id: 9)
  { id: 41, questionId: 9, text: "휴식", value: "REST", icon: "😴" },
  { id: 42, questionId: 9, text: "친구 만남", value: "FRIENDS", icon: "👫" },
  { id: 43, questionId: 9, text: "운동", value: "EXERCISE", icon: "🏋️" },
  { id: 44, questionId: 9, text: "쇼핑", value: "SHOPPING", icon: "🛍️" },
  { id: 45, questionId: 9, text: "공부", value: "STUDY", icon: "📝" },

  // Technology options (id: 10)
  { id: 46, questionId: 10, text: "AI", value: "AI", icon: "🤖" },
  { id: 47, questionId: 10, text: "블록체인", value: "BLOCKCHAIN", icon: "⛓️" },
  { id: 48, questionId: 10, text: "VR/AR", value: "VR_AR", icon: "👓" },
  { id: 49, questionId: 10, text: "IoT", value: "IOT", icon: "🔌" },
  { id: 50, questionId: 10, text: "로봇공학", value: "ROBOTICS", icon: "🦾" },
]

export const mockUserProfile: UserProfile = {
  id: "user-1",
  interests: ["MUSIC", "TRAVEL", "TECHNOLOGY"],
  createdAt: new Date(),
}

export const mockUserResponses: Response[] = [
  { questionId: 1, optionId: 1 }, // POP
  { questionId: 2, optionId: 6 }, // EUROPE
  { questionId: 3, optionId: 11 }, // SOCCER
  { questionId: 4, optionId: 17 }, // ROMANCE
  { questionId: 5, optionId: 21 }, // COMPUTER_SCIENCE
  { questionId: 6, optionId: 26 }, // KOREAN
  { questionId: 7, optionId: 32 }, // GAMING
  { questionId: 8, optionId: 36 }, // FICTION
  { questionId: 9, optionId: 42 }, // FRIENDS
  { questionId: 10, optionId: 46 }, // AI
]

export const mockOtherUserResponses: Response[] = [
  { questionId: 1, optionId: 1 }, // POP (match)
  { questionId: 2, optionId: 7 }, // ASIA (no match)
  { questionId: 3, optionId: 11 }, // SOCCER (match)
  { questionId: 4, optionId: 17 }, // ROMANCE (match)
  { questionId: 5, optionId: 21 }, // COMPUTER_SCIENCE (match)
  { questionId: 6, optionId: 27 }, // JAPANESE (no match)
  { questionId: 7, optionId: 32 }, // GAMING (match)
  { questionId: 8, optionId: 37 }, // SELF_HELP (no match)
  { questionId: 9, optionId: 42 }, // FRIENDS (match)
  { questionId: 10, optionId: 46 }, // AI (match)
]
