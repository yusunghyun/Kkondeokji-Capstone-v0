import { cn } from "@/shared/utils/cn";

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

// 관심사 태그에 따른 색상 매핑
function getTagVariant(tag: string): TagChipProps["variant"] {
  // 미디어 관련
  const mediaTerms = [
    "reality_show",
    "drama",
    "netflix",
    "drama_variety",
    "horror_mystery",
    "anime_manga",
    "edm_festival",
    "나는 솔로",
    "하트시그널",
    "ballad_emotional",
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
  ];

  // 음악 관련
  const musicTerms = [
    "k_pop",
    "jazz",
    "hiphop",
    "edm_festival",
    "ballad_emotional",
    "음악",
    "EDM",
    "발라드",
  ];

  // 지역 관련
  const locationTerms = [
    "songpa",
    "gangnam",
    "송파구",
    "강남구",
    "지역",
    "동네",
  ];

  // 음식 관련
  const foodTerms = [
    "cafe_food",
    "coffee_tea",
    "food_cooking",
    "카페",
    "맛집",
    "커피",
    "차",
    "음식",
    "쿠킹",
  ];

  // 독서/학습 관련
  const bookTerms = [
    "self_development",
    "tech_books",
    "reading_humanities",
    "자기계발서",
    "책",
    "독서",
    "기술서적",
    "인문학",
  ];

  // 문화/취미 관련
  const cultureTerms = [
    "culture",
    "travel_culture",
    "photo_video",
    "fashion_beauty",
    "영화",
    "전시",
    "여행",
    "사진",
    "패션",
    "뷰티",
  ];

  // 기술 관련
  const techTerms = [
    "figma",
    "notion",
    "science_tech",
    "productivity",
    "blockchain_crypto",
    "startup_tips",
    "개발",
    "기술",
    "과학",
    "생산성",
  ];

  // 자연/라이프스타일 관련
  const lifestyleTerms = [
    "pets",
    "plants",
    "gardening",
    "meditation_yoga",
    "environment_sustainability",
    "volunteer_social",
    "games_hobby",
    "반려동물",
    "반려식물",
    "명상",
    "요가",
    "환경",
    "봉사",
  ];

  const lowerTag = tag.toLowerCase();

  if (mediaTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "media";
  if (sportsTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "sports";
  if (musicTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "music";
  if (locationTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "location";
  if (foodTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "food";
  if (bookTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "book";
  if (cultureTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "culture";
  if (techTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "tech";
  if (lifestyleTerms.some((term) => lowerTag.includes(term.toLowerCase())))
    return "lifestyle";

  return "default";
}

function getVariantStyles(variant: TagChipProps["variant"]) {
  switch (variant) {
    case "media":
      return "bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200";
    case "sports":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
    case "music":
      return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200";
    case "location":
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
    case "food":
      return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200";
    case "book":
      return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200";
    case "culture":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200";
    case "tech":
      return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
    case "lifestyle":
      return "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200";
    default:
      return "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
  }
}

export function TagChip({ label, icon, className, variant }: TagChipProps) {
  const autoVariant = variant || getTagVariant(label);
  const variantStyles = getVariantStyles(autoVariant);

  return (
    <div
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:shadow-sm",
        variantStyles,
        className
      )}
    >
      {icon && <span className="mr-1.5 text-base">{icon}</span>}
      <span>{label}</span>
    </div>
  );
}
