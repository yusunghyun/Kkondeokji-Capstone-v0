import { translateInterest } from "./interestTranslation";

/**
 * 스마트한 관심사 추출 시스템
 * 다양한 질문 형태에서 의미적으로 관심사를 추출합니다.
 */

// 질문 패턴 매칭 규칙들
const questionPatterns = [
  // "~을/를 좋아하시나요?" 패턴
  {
    pattern: /(.+?)[을를]\s*좋아하시나요\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "~에 대한 관심도는?" 패턴
  {
    pattern: /(.+?)에\s*대한\s*관심도는?/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "~에 얼마나 관심이 있나요?" 패턴
  {
    pattern: /(.+?)에?\s*얼마나\s*관심이?\s*있나요\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "요즘 가장 재미있게 보고 있는 ~는?" 패턴
  {
    pattern: /요즘\s*가장\s*재미있게\s*보고?\s*있는\s*(.+?)[는은]\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "가장 즐겨보는 ~는?" 패턴
  {
    pattern: /가장\s*즐겨보는\s*(.+?)[는은]\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "주로 시키는/마시는 ~는?" 패턴
  {
    pattern: /주로\s*(?:시키는|마시는)\s*(.+?)[는은]\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "선호하는 ~는?" 패턴
  {
    pattern: /선호하는\s*(.+?)[는은]\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "좋아하는 ~는?" 패턴
  {
    pattern: /좋아하는\s*(.+?)[는은]\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
  // "~을/를 어떻게 생각하시나요?" 패턴
  {
    pattern: /(.+?)[을를]\s*어떻게\s*생각하시나요\??/,
    extractor: (match: RegExpMatchArray) => match[1].trim(),
  },
];

// 감정 태그 매핑 (더 다양한 형태 지원)
const emotionMappings = {
  // 긍정적 감정들 (가중치 3)
  매우좋아함: 3,
  "매우 좋아함": 3,
  매우그렇다: 3,
  "매우 그렇다": 3,
  love: 3,
  very_much: 3,
  최고: 3,
  완전좋아함: 3,

  // 좋아함 (가중치 2)
  좋아함: 2,
  그렇다: 2,
  좋음: 2,
  관심있음: 2,
  "관심 있음": 2,
  like: 2,
  good: 2,
  선호함: 2,
  "선호 함": 2,

  // 보통 (가중치 1) - 약간의 관심사로 취급
  보통: 1,
  괜찮음: 1,
  그럭저럭: 1,
  neutral: 1,
  okay: 1,

  // 관심없음 (가중치 0) - 제외
  관심없음: 0,
  "관심 없음": 0,
  싫어함: 0,
  별로: 0,
  아니다: 0,
  dislike: 0,
  hate: 0,
  none: 0,
};

// 키워드 정제 함수들
const keywordCleaners = [
  // 불필요한 조사 제거
  (text: string) => text.replace(/[을를이가는은에서와과]/g, ""),
  // 물음표 제거
  (text: string) => text.replace(/\?/g, ""),
  // 공백 정리
  (text: string) => text.trim(),
  // 특수문자 정리 (일부만)
  (text: string) => text.replace(/[·・]/g, " "), // 중점을 공백으로
];

/**
 * 질문에서 주제/관심사 키워드를 추출합니다
 */
function extractTopicFromQuestion(questionText: string): string | null {
  console.log("🔍 질문에서 주제 추출 시도:", questionText);

  // 각 패턴에 대해 매칭 시도
  for (const rule of questionPatterns) {
    const match = questionText.match(rule.pattern);
    if (match) {
      let topic = rule.extractor(match);

      // 키워드 정제
      for (const cleaner of keywordCleaners) {
        topic = cleaner(topic);
      }

      console.log(
        "✅ 주제 추출 성공:",
        topic,
        "패턴:",
        rule.pattern.toString()
      );
      return topic;
    }
  }

  console.log("❌ 패턴 매칭 실패, 키워드 추출 시도");

  // 패턴 매칭이 실패한 경우, 명사 추출 시도
  const nounCandidates = extractNounCandidates(questionText);
  if (nounCandidates.length > 0) {
    console.log("✅ 명사 후보 추출:", nounCandidates[0]);
    return nounCandidates[0];
  }

  return null;
}

/**
 * 간단한 명사 후보 추출 (한국어 특성 고려)
 */
function extractNounCandidates(text: string): string[] {
  const candidates: string[] = [];

  // 일반적인 관심사 키워드들 (더 확장 가능)
  const commonInterests = [
    "드라마",
    "예능",
    "영화",
    "웹툰",
    "만화",
    "음악",
    "K-팝",
    "힙합",
    "재즈",
    "클래식",
    "운동",
    "헬스",
    "요가",
    "러닝",
    "축구",
    "농구",
    "테니스",
    "수영",
    "여행",
    "카페",
    "맛집",
    "요리",
    "베이킹",
    "독서",
    "논문",
    "책",
    "게임",
    "스포츠",
    "패션",
    "뷰티",
    "사진",
    "그림",
    "디자인",
    "IT",
    "개발",
    "프로그래밍",
    "AI",
    "기술",
    "스타트업",
    "투자",
    "주식",
    "부동산",
    "경제",
    "비트코인",
    "암호화폐",
  ];

  // 텍스트에서 관심사 키워드 찾기
  for (const interest of commonInterests) {
    if (text.includes(interest)) {
      candidates.push(interest);
    }
  }

  return candidates;
}

/**
 * 옵션 텍스트가 감정 태그인지 실제 관심사인지 판단
 */
function isEmotionTag(optionText: string): boolean {
  return Object.keys(emotionMappings).some(
    (emotion) =>
      optionText.includes(emotion) ||
      optionText.toLowerCase().includes(emotion.toLowerCase())
  );
}

/**
 * 감정 태그의 가중치를 반환
 */
function getEmotionWeight(optionText: string): number {
  for (const [emotion, weight] of Object.entries(emotionMappings)) {
    if (
      optionText.includes(emotion) ||
      optionText.toLowerCase().includes(emotion.toLowerCase())
    ) {
      return weight;
    }
  }
  return 0; // 알 수 없는 감정은 0
}

/**
 * 설문 응답에서 스마트하게 관심사를 추출하는 메인 함수
 */
export function extractInterestsFromSurveyData(
  surveyData: Array<{
    options?: { value?: string; text?: string };
    questions?: { text?: string };
  }>
): Array<{ interest: string; weight: number; source: string }> {
  const interestMap = new Map<
    string,
    { weight: number; sources: Set<string>; count: number }
  >();

  console.log("🧠 스마트 관심사 추출 시작:", surveyData.length, "개 응답");

  surveyData.forEach((item, index) => {
    const optionValue = item.options?.value;
    const optionText = item.options?.text;
    const questionText = item.questions?.text;

    console.log(`\n📝 응답 ${index + 1}:`, {
      question: questionText,
      optionValue,
      optionText,
    });

    if (!optionValue || !optionText || !questionText) return;

    let extractedInterest: string | null = null;
    let weight: number = 1;
    let source: string = "unknown";

    // 1. 옵션이 감정 태그인지 확인
    if (isEmotionTag(optionText)) {
      console.log("🎭 감정 태그 감지:", optionText);
      weight = getEmotionWeight(optionText);

      if (weight > 0) {
        // 긍정적 감정만 처리
        // 질문에서 주제 추출
        extractedInterest = extractTopicFromQuestion(questionText);
        source = "question_emotion";
      }
    }
    // 2. 옵션이 직접적인 관심사인 경우
    else {
      console.log("🎯 직접 관심사 감지:", optionValue);
      extractedInterest = optionValue;
      weight = 2; // 직접 선택한 관심사는 가중치 2
      source = "direct_option";
    }

    // 3. 추출된 관심사 처리
    if (extractedInterest) {
      // 한국어로 번역 시도
      const translatedInterest = translateInterest(
        extractedInterest.toLowerCase()
      );
      const finalInterest =
        translatedInterest !== extractedInterest.toLowerCase()
          ? translatedInterest
          : extractedInterest;

      console.log(
        "✨ 최종 관심사:",
        finalInterest,
        "가중치:",
        weight,
        "출처:",
        source
      );

      if (interestMap.has(finalInterest)) {
        const existing = interestMap.get(finalInterest)!;
        existing.weight = Math.max(existing.weight, weight);
        existing.count += 1;
        existing.sources.add(source);
      } else {
        interestMap.set(finalInterest, {
          weight,
          sources: new Set([source]),
          count: 1,
        });
      }
    }
  });

  // 결과 정리 및 반환
  const results = Array.from(interestMap.entries())
    .filter(([_, data]) => data.weight > 0) // 가중치 0 제외
    .map(([interest, data]) => ({
      interest,
      weight: data.weight,
      source: Array.from(data.sources).join(", "),
    }))
    .sort((a, b) => b.weight - a.weight); // 가중치 순 정렬

  console.log("🎉 최종 추출된 관심사:", results);

  return results;
}

/**
 * 관심사 목록을 문자열 배열로 변환 (기존 호환성 유지)
 */
export function extractInterestStrings(
  surveyData: Array<{
    options?: { value?: string; text?: string };
    questions?: { text?: string };
  }>
): string[] {
  const extractedInterests = extractInterestsFromSurveyData(surveyData);
  return extractedInterests
    .filter((item) => item.weight >= 2) // 가중치 2 이상만 (좋아함 이상)
    .map((item) => item.interest);
}
