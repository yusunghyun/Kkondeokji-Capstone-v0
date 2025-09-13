import { cn } from "@/shared/utils/cn";
import { translateInterest } from "@/shared/utils/interestTranslation";

interface TagChipProps {
  label: string;
  icon?: string;
  className?: string;
  variant?:
    | "media"
    | "sports"
    | "music"
    | "location"
    | "food"
    | "book"
    | "culture"
    | "tech"
    | "lifestyle"
    | "default";
}

type TagVariant =
  | "media"
  | "sports"
  | "music"
  | "location"
  | "food"
  | "book"
  | "culture"
  | "tech"
  | "lifestyle"
  | "default";

// 관심사 태그에 따른 색상 매핑 (한국어도 지원)
function getTagVariant(tag: string): TagVariant {
  const lowerTag = tag.toLowerCase();
  const translatedTag = translateInterest(lowerTag);

  // 미디어 관련
  const mediaTerms = [
    "reality_show",
    "drama",
    "netflix",
    "drama_variety",
    "horror_mystery",
    "anime_manga",
    "edm_festival",
    "리얼리티쇼",
    "드라마",
    "넷플릭스",
    "예능",
    "웹툰",
    "영화",
  ];

  // 스포츠 관련
  const sportsTerms = [
    "running",
    "gym",
    "fitness_health",
    "diet_nutrition",
    "basketball_nba",
    "running_marathon",
    "러닝",
    "헬스",
    "운동",
    "농구",
    "마라톤",
    "요가",
    "등산",
    "아웃도어",
    "스포츠",
  ];

  // 음악 관련
  const musicTerms = [
    "k_pop",
    "jazz",
    "hiphop",
    "edm_festival",
    "ballad_emotional",
    "dance",
    "K-POP",
    "음악",
    "EDM",
    "발라드",
    "댄스",
  ];

  // 지역 관련
  const locationTerms = [
    "songpa",
    "gangnam",
    "hongdae",
    "mapo",
    "gyeonggi",
    "seoul_other",
    "송파구",
    "강남구",
    "홍대",
    "마포구",
    "경기도",
    "서울",
  ];

  // 음식 관련
  const foodTerms = [
    "cafe_food",
    "coffee_tea",
    "food_cooking",
    "cooking",
    "카페음식",
    "카페",
    "맛집",
    "커피",
    "요리",
    "쿠킹",
  ];

  // 독서/학습 관련
  const bookTerms = [
    "self_development",
    "tech_books",
    "reading_humanities",
    "literature",
    "philosophy",
    "study",
    "자기계발",
    "독서",
    "문학",
    "철학",
    "공부",
    "책",
  ];

  // 문화 관련
  const cultureTerms = [
    "culture",
    "art",
    "exhibition",
    "theater",
    "photography",
    "문화",
    "예술",
    "전시회",
    "사진",
    "미술관",
  ];

  // 기술 관련
  const techTerms = [
    "figma",
    "notion",
    "productivity",
    "ai_tech",
    "startup",
    "investment",
    "기술",
    "AI기술",
    "스타트업",
    "투자",
    "개발",
  ];

  // 라이프스타일 관련
  const lifestyleTerms = [
    "fashion",
    "beauty",
    "pet",
    "travel",
    "mindfulness",
    "environmental",
    "패션",
    "뷰티",
    "반려동물",
    "여행",
    "명상",
    "환경",
    "게임",
    "보드게임",
  ];

  // 검사 로직 (원본과 번역된 태그 모두 확인)
  const checkTerms = (terms: string[]) =>
    terms.some(
      (term) =>
        lowerTag.includes(term.toLowerCase()) ||
        translatedTag.includes(term) ||
        term.includes(translatedTag)
    );

  if (checkTerms(mediaTerms)) return "media";
  if (checkTerms(sportsTerms)) return "sports";
  if (checkTerms(musicTerms)) return "music";
  if (checkTerms(locationTerms)) return "location";
  if (checkTerms(foodTerms)) return "food";
  if (checkTerms(bookTerms)) return "book";
  if (checkTerms(cultureTerms)) return "culture";
  if (checkTerms(techTerms)) return "tech";
  if (checkTerms(lifestyleTerms)) return "lifestyle";

  return "default";
}

export function TagChip({ label, icon, className, variant }: TagChipProps) {
  // 라벨을 한국어로 변환
  const translatedLabel = translateInterest(label.toLowerCase());
  const displayLabel =
    translatedLabel === label.toLowerCase() ? label : translatedLabel;

  const actualVariant: TagVariant = variant || getTagVariant(label);

  const variantStyles: Record<TagVariant, string> = {
    media: "bg-pink-100 text-pink-800 border-pink-200",
    sports: "bg-green-100 text-green-800 border-green-200",
    music: "bg-purple-100 text-purple-800 border-purple-200",
    location: "bg-blue-100 text-blue-800 border-blue-200",
    food: "bg-orange-100 text-orange-800 border-orange-200",
    book: "bg-yellow-100 text-yellow-800 border-yellow-200",
    culture: "bg-indigo-100 text-indigo-800 border-indigo-200",
    tech: "bg-gray-100 text-gray-800 border-gray-200",
    lifestyle: "bg-teal-100 text-teal-800 border-teal-200",
    default: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variantStyles[actualVariant],
        className
      )}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {displayLabel}
    </span>
  );
}
