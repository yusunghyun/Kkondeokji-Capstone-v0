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
    | "emotion"
    | "seasonal"
    | "default";
  size?: "sm" | "md" | "lg"; // 크기 옵션 추가
  weight?: number; // 가중치 기반 시각화
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
  | "emotion"
  | "seasonal"
  | "default";

// 카테고리별 자동 아이콘 매핑
const categoryIcons: Record<TagVariant, string> = {
  media: "🎬",
  sports: "💪",
  music: "🎵",
  location: "📍",
  food: "🍽️",
  book: "📚",
  culture: "🎭",
  tech: "💻",
  lifestyle: "✨",
  emotion: "💫",
  seasonal: "🌸",
  default: "🏷️",
};

// 개별 관심사별 특별 아이콘 (더 구체적)
const specificIcons: Record<string, string> = {
  // 미디어
  드라마: "📺",
  예능: "🎪",
  웹툰: "📖",
  넷플릭스: "📹",
  영화: "🎞️",
  리얼리티쇼: "🎭",
  애니메이션: "🎨",
  유튜브: "📱",

  // 스포츠 & 헬스
  운동: "🏋️",
  헬스: "💪",
  러닝: "🏃",
  요가: "🧘",
  등산: "🥾",
  농구: "🏀",
  축구: "⚽",
  테니스: "🎾",
  수영: "🏊",
  사이클: "🚴",

  // 음악
  "K-POP": "🎤",
  음악: "🎼",
  재즈: "🎷",
  힙합: "🎧",
  EDM: "🎛️",
  발라드: "💕",
  댄스: "💃",
  클래식: "🎻",

  // 음식 & 카페
  카페: "☕",
  커피: "☕",
  요리: "👨‍🍳",
  맛집: "🍽️",
  베이킹: "🧁",
  디저트: "🍰",
  와인: "🍷",
  맥주: "🍺",

  // 여행 & 지역
  여행: "✈️",
  해외여행: "🌍",
  국내여행: "🗾",
  캠핑: "🏕️",
  서울: "🏙️",
  부산: "🏖️",
  제주도: "🌴",

  // 취미 & 라이프스타일
  독서: "📖",
  책: "📚",
  논문: "📄",
  공부: "✏️",
  자기계발: "📈",
  사진: "📸",
  그림: "🎨",
  디자인: "🖌️",
  패션: "👗",
  뷰티: "💄",
  게임: "🎮",
  보드게임: "🎲",
  반려동물: "🐕",
  반려식물: "🌱",

  // 기술 & 비즈니스
  개발: "👨‍💻",
  프로그래밍: "💻",
  AI: "🤖",
  스타트업: "🚀",
  투자: "📊",
  주식: "📈",
  암호화폐: "₿",
  블록체인: "⛓️",

  // 문화 & 예술
  전시회: "🖼️",
  미술관: "🏛️",
  공연: "🎪",
  콘서트: "🎤",
  뮤지컬: "🎭",
  오페라: "🎼",
  발레: "🩰",

  // 특별 감정/계절
  매우좋아함: "😍",
  좋아함: "😊",
  보통: "😐",
  관심없음: "😑",
  봄: "🌸",
  여름: "☀️",
  가을: "🍂",
  겨울: "❄️",
};

// 관심사 태그에 따른 색상 매핑 (한국어도 지원) - 더 생동감 있는 색상으로 업데이트
function getTagVariant(tag: string): TagVariant {
  const lowerTag = tag.toLowerCase();
  const translatedTag = translateInterest(lowerTag);

  // 미디어 관련 (확장)
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
    "애니메이션",
    "유튜브",
    "스트리밍",
    "콘텐츠",
    "방송",
    "티비",
    "OTT",
  ];

  // 스포츠 관련 (확장)
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
    "피트니스",
    "다이어트",
    "건강",
    "축구",
    "테니스",
    "수영",
    "사이클링",
    "클라이밍",
    "골프",
    "배드민턴",
  ];

  // 음악 관련 (확장)
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
    "재즈",
    "힙합",
    "클래식",
    "팝송",
    "인디",
    "락",
    "메탈",
    "R&B",
    "트로트",
    "국악",
    "악기",
    "노래",
    "콘서트",
  ];

  // 지역 관련 (확장)
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
    "부산",
    "대구",
    "인천",
    "광주",
    "대전",
    "울산",
    "세종",
    "제주",
    "지역",
    "동네",
    "거주지",
    "출신",
  ];

  // 음식 관련 (확장)
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
    "베이킹",
    "디저트",
    "음식",
    "맛",
    "레시피",
    "와인",
    "맥주",
    "칵테일",
    "브런치",
    "파스타",
    "한식",
    "양식",
    "일식",
    "중식",
  ];

  // 독서/학습 관련 (확장)
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
    "논문",
    "학습",
    "교육",
    "연구",
    "소설",
    "에세이",
    "시",
    "만화",
    "잡지",
    "신문",
    "지식",
    "정보",
  ];

  // 문화 관련 (확장)
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
    "박물관",
    "갤러리",
    "공연",
    "연극",
    "뮤지컬",
    "오페라",
    "발레",
    "무용",
    "축제",
    "이벤트",
    "체험",
  ];

  // 기술 관련 (확장)
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
    "프로그래밍",
    "코딩",
    "IT",
    "소프트웨어",
    "하드웨어",
    "인공지능",
    "빅데이터",
    "클라우드",
    "블록체인",
    "암호화폐",
  ];

  // 라이프스타일 관련 (확장)
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
    "취미",
    "라이프스타일",
    "인테리어",
    "홈데코",
    "가드닝",
    "DIY",
    "핸드메이드",
    "수집",
  ];

  // 감정 관련 (새로 추가)
  const emotionTerms = [
    "매우좋아함",
    "좋아함",
    "보통",
    "관심없음",
    "love",
    "like",
    "neutral",
    "dislike",
    "최고",
    "완전",
    "별로",
    "싫어",
    "감정",
    "느낌",
    "기분",
  ];

  // 계절 관련 (새로 추가)
  const seasonalTerms = [
    "봄",
    "여름",
    "가을",
    "겨울",
    "spring",
    "summer",
    "autumn",
    "winter",
    "계절",
    "시즌",
    "seasonal",
  ];

  // 검사 로직 (원본과 번역된 태그 모두 확인)
  const checkTerms = (terms: string[]) =>
    terms.some(
      (term) =>
        lowerTag.includes(term.toLowerCase()) ||
        translatedTag.includes(term) ||
        term.includes(translatedTag)
    );

  if (checkTerms(emotionTerms)) return "emotion";
  if (checkTerms(seasonalTerms)) return "seasonal";
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

// 자동 아이콘 추천 함수
function getAutoIcon(label: string, variant: TagVariant): string {
  // 1. 구체적인 매칭 우선
  const translatedLabel = translateInterest(label.toLowerCase());
  const displayLabel =
    translatedLabel === label.toLowerCase() ? label : translatedLabel;

  // 특정 아이콘이 있으면 사용
  if (specificIcons[displayLabel]) {
    return specificIcons[displayLabel];
  }

  // 2. 카테고리별 기본 아이콘
  return categoryIcons[variant] || categoryIcons.default;
}

export function TagChip({
  label,
  icon,
  className,
  variant,
  size = "md",
  weight,
}: TagChipProps) {
  // 라벨을 한국어로 변환
  const translatedLabel = translateInterest(label.toLowerCase());
  const displayLabel =
    translatedLabel === label.toLowerCase() ? label : translatedLabel;

  const actualVariant: TagVariant = variant || getTagVariant(label);
  const autoIcon = icon || getAutoIcon(label, actualVariant);

  // 가중치에 따른 시각적 강조 (3: 매우 강함, 2: 강함, 1: 보통)
  const getIntensityClass = (baseColor: string, weight?: number) => {
    if (!weight) return baseColor;

    switch (weight) {
      case 3:
        return baseColor.replace("100", "200").replace("800", "900"); // 더 강한 색상
      case 2:
        return baseColor.replace("100", "150").replace("800", "850"); // 중간 강도
      default:
        return baseColor; // 기본
    }
  };

  // 크기별 스타일
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  // 더 생동감 있는 색상과 그라데이션 효과
  const variantStyles: Record<TagVariant, string> = {
    media: getIntensityClass(
      "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-300 hover:from-pink-200 hover:to-rose-200",
      weight
    ),
    sports: getIntensityClass(
      "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 hover:from-green-200 hover:to-emerald-200",
      weight
    ),
    music: getIntensityClass(
      "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300 hover:from-purple-200 hover:to-violet-200",
      weight
    ),
    location: getIntensityClass(
      "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border-blue-300 hover:from-blue-200 hover:to-sky-200",
      weight
    ),
    food: getIntensityClass(
      "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-300 hover:from-orange-200 hover:to-amber-200",
      weight
    ),
    book: getIntensityClass(
      "bg-gradient-to-r from-yellow-100 to-lime-100 text-yellow-800 border-yellow-300 hover:from-yellow-200 hover:to-lime-200",
      weight
    ),
    culture: getIntensityClass(
      "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border-indigo-300 hover:from-indigo-200 hover:to-blue-200",
      weight
    ),
    tech: getIntensityClass(
      "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 hover:from-gray-200 hover:to-slate-200",
      weight
    ),
    lifestyle: getIntensityClass(
      "bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border-teal-300 hover:from-teal-200 hover:to-cyan-200",
      weight
    ),
    emotion: getIntensityClass(
      "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border-rose-300 hover:from-rose-200 hover:to-pink-200",
      weight
    ),
    seasonal: getIntensityClass(
      "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 hover:from-emerald-200 hover:to-teal-200",
      weight
    ),
    default: getIntensityClass(
      "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300 hover:from-gray-200 hover:to-slate-200",
      weight
    ),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border transition-all duration-200 hover:scale-105 hover:shadow-md cursor-default",
        sizeStyles[size],
        variantStyles[actualVariant],
        // 가중치에 따른 추가 스타일
        weight === 3 && "ring-2 ring-opacity-30 animate-pulse",
        weight === 2 && "shadow-sm",
        className
      )}
      title={`${displayLabel} ${weight ? `(중요도: ${weight})` : ""}`} // 툴팁 추가
    >
      {autoIcon && <span className="mr-1 text-sm">{autoIcon}</span>}
      <span className="font-semibold">{displayLabel}</span>
      {weight === 3 && <span className="ml-1 text-xs">✨</span>}{" "}
      {/* 최고 가중치 표시 */}
    </span>
  );
}
