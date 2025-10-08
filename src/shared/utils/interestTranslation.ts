// 영어 관심사 → 한국어 매핑
const interestMap: Record<string, string> = {
  // 기존 데이터 매핑
  reality_show: "리얼리티쇼",
  self_development: "자기계발",
  culture: "문화",
  drama: "드라마",
  netflix: "넷플릭스",
  variety_show: "예능",
  running: "러닝",
  gym: "헬스",
  sports: "스포츠",
  yoga: "요가",
  hiking: "등산",
  outdoor: "아웃도어",
  cafe_food: "카페음식",
  literature: "문학",
  philosophy: "철학",
  science: "과학",
  study: "공부",
  social: "사교",
  economy: "경제",
  // ---- 라이프스타일 & 취미 ----
  painting: "그림그리기",
  gardening: "가드닝",
  knitting: "뜨개질",
  baking: "베이킹",
  brewing: "홈브루잉",
  fishing: "낚시",
  surfing: "서핑",
  snowboarding: "스노보드",
  golf: "골프",
  climbing: "클라이밍",
  pilates: "필라테스",
  skateboarding: "스케이트보드",
  coding: "코딩",
  ux_design: "UX디자인",
  data_science: "데이터사이언스",
  blockchain: "블록체인",
  vr_ar: "VR/AR",

  // ---- 음식 & 음료 ----
  coffee: "커피",
  tea: "차",
  wine: "와인",
  beer: "맥주",
  cocktail: "칵테일",
  vegan_food: "비건음식",
  korean_bbq: "한식바베큐",
  sushi: "스시",
  ramen: "라멘",
  street_food: "길거리음식",

  // ---- 음악 장르 ----
  hiphop: "힙합",
  jazz: "재즈",
  classical: "클래식",
  rock: "록",
  edm: "EDM",
  indie: "인디음악",

  // ---- 영화 & 드라마 장르 ----
  action_movie: "액션영화",
  romance_movie: "로맨스영화",
  thriller_movie: "스릴러영화",
  documentary: "다큐멘터리",
  animation: "애니메이션",

  // ---- 여행 스타일 ----
  backpacking: "배낭여행",
  city_tour: "도시관광",
  luxury_travel: "럭셔리여행",
  camping: "캠핑",
  glamping: "글램핑",

  // ---- 기타 ----
  sudoku: "스도쿠",
  volunteering: "봉사활동",
  language_learning: "언어학습",
  finance: "재테크",
  diy: "DIY",

  // 지역
  songpa: "송파구",
  gangnam: "강남구",
  hongdae: "홍대",
  mapo: "마포구",
  gyeonggi: "경기도",
  seoul_other: "서울 기타",

  // 감정 태그 (필터링용)
  like: "좋아함",
  love: "매우좋아함",
  neutral: "보통",
  dislike: "관심없음",
  none: "없음",

  // 새로운 트렌드 관심사들 (미리 정의)
  webtoon: "웹툰",
  k_pop: "K-POP",
  cooking: "요리",
  travel: "여행",
  photography: "사진",
  music: "음악",
  movie: "영화",
  game: "게임",
  reading: "독서",
  fashion: "패션",
  beauty: "뷰티",
  pet: "반려동물",
  investment: "투자",
  startup: "스타트업",
  ai_tech: "AI기술",
  environmental: "환경",
  mindfulness: "명상",
  dance: "댄스",
  art: "예술",
  board_game: "보드게임",
};

// 감정 태그 (실제 관심사에서 제외할 태그들)
const emotionTags = new Set(["like", "love", "neutral", "dislike", "none"]);

/**
 * 영어 관심사를 한국어로 변환
 */
export function translateInterest(englishInterest: string): string {
  const korean = interestMap[englishInterest];
  return korean || englishInterest; // 매핑이 없으면 원본 반환
}

/**
 * 관심사 배열을 한국어로 변환하고 감정 태그 제거
 */
export function translateInterests(interests: string[]): string[] {
  return interests
    .filter((interest) => !emotionTags.has(interest)) // 감정 태그 제거
    .map((interest) => translateInterest(interest))
    .filter((interest) => interest !== "없음"); // '없음' 제거
}

/**
 * 관심사가 감정 태그인지 확인
 */
export function isEmotionTag(tag: string): boolean {
  return emotionTags.has(tag);
}

/**
 * 새로운 한국어 관심사 키워드 생성 (AI 설문용)
 */
export function getKoreanInterestKeywords(): string[] {
  return [
    "웹툰",
    "K-POP",
    "요리",
    "여행",
    "사진",
    "음악",
    "영화",
    "게임",
    "독서",
    "패션",
    "뷰티",
    "반려동물",
    "투자",
    "스타트업",
    "AI기술",
    "환경",
    "명상",
    "댄스",
    "예술",
    "보드게임",
    "리얼리티쇼",
    "자기계발",
    "드라마",
    "넷플릭스",
    "예능",
    "러닝",
    "헬스",
    "요가",
    "등산",
  ];
}

/**
 * 트렌드 기반 관심사 생성 (계절/시기별)
 */
export function getTrendingInterests(): string[] {
  const currentMonth = new Date().getMonth() + 1;
  const baseInterests = getKoreanInterestKeywords();

  // 계절별 트렌드 관심사
  const seasonalInterests: Record<number, string[]> = {
    12: ["스키", "온천", "연말정산", "새해계획", "홈트레이닝"],
    1: ["새해계획", "헬스", "독서", "온라인쇼핑", "겨울여행"],
    2: ["발렌타인", "홈카페", "인테리어", "온라인강의"],
    3: ["벚꽃", "피크닉", "새학기", "취업준비", "봄나들이"],
    4: ["벚꽃축제", "야외활동", "캠핑", "바베큐", "자전거"],
    5: ["가정의달", "어린이날", "어버이날", "피크닉", "등산"],
    6: ["여름휴가", "해외여행", "수영", "축제", "야외활동"],
    7: ["휴가", "해변", "물놀이", "시원한음식", "여름축제"],
    8: ["휴가", "캠핑", "물놀이", "여름영화", "아이스크림"],
    9: ["가을", "단풍", "독서", "전시회", "문화생활"],
    10: ["단풍구경", "가을여행", "독서", "미술관", "공연"],
    11: ["감사절", "김장", "겨울준비", "실내활동", "독서"],
  };

  const seasonal = seasonalInterests[currentMonth] || [];
  return [...baseInterests, ...seasonal];
}
