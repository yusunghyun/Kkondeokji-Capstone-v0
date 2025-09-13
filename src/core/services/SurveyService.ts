import {
  getSurveyRepo,
  getUserRepo,
  getMatchRepo,
} from "@/core/infra/RepositoryFactory";
import {
  generateMatchInsightsWithOpenAI,
  generatePersonalizedMatchInsights,
  generateSurveyWithOpenAI,
  generateEnhancedPersonalizedSurvey,
} from "@/shared/utils/openaiClient";
import { translateInterests } from "@/shared/utils/interestTranslation";
import type {
  MatchResult,
  UserResponse,
  Question,
  Option,
  Match,
  SurveyTemplate,
} from "@/shared/types/domain";

export async function generatePersonalizedSurvey(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
  otherUserId?: string;
}): Promise<string> {
  console.log("🚀 AI 개인화 설문 생성 시작:", userInfo);

  try {
    // AI로 설문 데이터 생성
    const surveyData = await generateSurveyWithOpenAI(userInfo);
    console.log("✅ AI 설문 데이터 생성 완료:", surveyData?.title);

    if (!surveyData || !surveyData.questions) {
      throw new Error("AI 설문 데이터가 올바르지 않습니다");
    }

    // 기존 방식으로 설문 템플릿 저장
    const templateId = await getSurveyRepo().createTemplate({
      title: surveyData.title || "AI 맞춤 설문조사",
      description: surveyData.description || "AI가 생성한 개인 맞춤형 설문조사",
      aiGenerated: true,
      questions: surveyData.questions,
    });

    console.log("🎯 AI 설문 생성 완료:", templateId);
    return templateId;
  } catch (error) {
    console.error("❌ AI 설문 생성 실패:", error);
    throw new Error("AI 설문 생성에 실패했습니다");
  }
}

// 기본 한국어 설문 생성 (폴백용)
async function generateBasicKoreanSurvey(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
}): Promise<string> {
  try {
    const surveyRepo = getSurveyRepo();

    const template = {
      title: `${userInfo.name || "당신"}을 위한 기본 설문`,
      description: "한국어 기반 매칭 설문조사",
      aiGenerated: false,
      questions: [
        {
          text: "요즘 가장 즐겨보는 콘텐츠는?",
          weight: 3,
          options: [
            { text: "매우 좋아함", value: "content_love", icon: "😍" },
            { text: "좋아함", value: "content_like", icon: "😊" },
            { text: "보통", value: "content_neutral", icon: "😐" },
            { text: "관심 없음", value: "content_dislike", icon: "😑" },
          ],
        },
        {
          text: "주말에 가장 하고 싶은 활동은?",
          weight: 3,
          options: [
            { text: "매우 좋아함", value: "weekend_love", icon: "🌟" },
            { text: "좋아함", value: "weekend_like", icon: "👍" },
            { text: "보통", value: "weekend_neutral", icon: "😐" },
            { text: "관심 없음", value: "weekend_dislike", icon: "👎" },
          ],
        },
        {
          text: "카페 데이트에 대한 관심도는?",
          weight: 2,
          options: [
            { text: "매우 좋아함", value: "cafe_love", icon: "☕" },
            { text: "좋아함", value: "cafe_like", icon: "🥤" },
            { text: "보통", value: "cafe_neutral", icon: "😐" },
            { text: "관심 없음", value: "cafe_dislike", icon: "😑" },
          ],
        },
        {
          text: "운동이나 액티비티 참여도는?",
          weight: 2,
          options: [
            { text: "매우 적극적", value: "active_love", icon: "💪" },
            { text: "적극적", value: "active_like", icon: "🏃" },
            { text: "보통", value: "active_neutral", icon: "😐" },
            { text: "소극적", value: "active_dislike", icon: "😴" },
          ],
        },
        {
          text: "새로운 사람들과 만나는 것을 좋아하나요?",
          weight: 3,
          options: [
            { text: "매우 좋아함", value: "social_love", icon: "🤝" },
            { text: "좋아함", value: "social_like", icon: "😊" },
            { text: "보통", value: "social_neutral", icon: "😐" },
            { text: "어려워함", value: "social_dislike", icon: "😅" },
          ],
        },
      ],
    };

    const templateId = await surveyRepo.createTemplate(template);
    console.log("📋 기본 한국어 설문 생성 완료:", templateId);

    return templateId;
  } catch (error) {
    console.error("❌ 기본 설문 생성도 실패:", error);
    throw new Error("설문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
}

/**
 * 기존 사용자를 위한 향상된 설문 생성
 * 사용자의 프로필, 매칭 이력, 트렌드를 반영한 3-5개 문항 생성
 */
export async function generateEnhancedSurvey(userId: string): Promise<string> {
  console.log("generateEnhancedSurvey 호출:", userId);

  try {
    // 1. 사용자 프로필 정보 가져오기
    const userRepo = getUserRepo();
    const userProfile = await userRepo.getProfile(userId);

    if (!userProfile) {
      throw new Error("사용자 프로필을 찾을 수 없습니다");
    }

    // 2. 기존 완료된 설문 수 확인
    const surveyRepo = getSurveyRepo();
    const completedSurveys = await surveyRepo.getUserCompletedSurveys(userId);
    const surveyCount = completedSurveys.length;

    // 3. 매칭 이력 가져오기
    const matchRepo = getMatchRepo();
    const userMatches = await matchRepo.getUserMatches(userId);

    // 매칭 이력을 향상된 설문 입력 형식으로 변환
    const matchHistory = userMatches.map((match) => ({
      partnerInterests: match.commonInterests?.tags || [],
      commonInterests: match.commonInterests?.tags || [],
      matchScore: match.matchScore,
    }));

    // 4. 향상된 AI 설문 생성
    const enhancedSurveyData = await generateEnhancedPersonalizedSurvey({
      userProfile: {
        name: userProfile.name || undefined,
        age: userProfile.age || undefined,
        occupation: userProfile.occupation || undefined,
        currentInterests: translateInterests(userProfile.interests || []),
      },
      matchHistory,
      surveyCount,
    });

    // 5. 설문 템플릿을 데이터베이스에 저장
    const templateId = await surveyRepo.createTemplate({
      title: `${surveyCount + 1}차 맞춤형 설문조사`,
      description: `트렌드와 매칭 이력을 반영한 ${
        surveyCount >= 2 ? "심화" : "확장"
      } 설문조사`,
      isActive: true,
      createdAt: new Date(),
    });

    // 6. 생성된 질문들을 데이터베이스에 저장
    if (enhancedSurveyData?.questions) {
      for (let i = 0; i < enhancedSurveyData.questions.length; i++) {
        const questionData = enhancedSurveyData.questions[i];

        const questionId = await surveyRepo.createQuestion({
          templateId,
          text: questionData.text,
          type: "single_choice",
          order: i + 1,
          isRequired: true,
        });

        // 옵션들 저장
        for (let j = 0; j < questionData.options.length; j++) {
          const optionData = questionData.options[j];
          await surveyRepo.createOption({
            questionId,
            text: optionData.text,
            value: questionData.interest_tags?.[0] || optionData.value, // 관심사 태그를 value로 사용
            order: j + 1,
          });
        }
      }
    }

    console.log(
      "향상된 설문 생성 완료:",
      templateId,
      `${enhancedSurveyData?.questions?.length || 0}개 문항`
    );
    return templateId;
  } catch (error) {
    console.error("Error generating enhanced survey:", error);

    // 폴백: 기본 개인화 설문 생성
    console.log("향상된 설문 생성 실패, 기본 설문으로 폴백");
    const userRepo = getUserRepo();
    const user = await userRepo.getById(userId);

    return generatePersonalizedSurvey({
      name: user?.name,
      age: user?.age,
      occupation: user?.occupation,
    });
  }
}

export async function getSurveyTemplateIdList(): Promise<string[]> {
  return getSurveyRepo().getTemplateIdList();
}

export async function getSurveyWithQuestions(
  templateId: string
): Promise<SurveyTemplate | null> {
  return getSurveyRepo().getTemplateWithQuestions(templateId);
}

export async function startUserSurvey(
  userId: string,
  templateId: string
): Promise<string> {
  return getSurveyRepo().createUserSurvey(userId, templateId);
}

export async function saveUserResponses(
  userSurveyId: string,
  responses: Array<{ questionId: string; optionId: string }>
): Promise<void> {
  await getSurveyRepo().saveUserResponses(userSurveyId, responses);
}

export async function completeSurvey(userSurveyId: string): Promise<void> {
  await getSurveyRepo().completeUserSurvey(userSurveyId);
}
