// 하이브리드 설문 생성 시스템
import { generateSurveyWithOpenAI } from "./openaiClient";
import { getSurveyTemplateIdList } from "@/core/services/SurveyService";

export async function generateHybridSurvey(userInfo: {
  name?: string;
  age?: number;
  occupation?: string;
}) {
  try {
    // 1. AI 생성 시도
    return await generateSurveyWithOpenAI(userInfo);
  } catch (error) {
    console.log("AI 생성 실패, 하이브리드 모드 사용");
    
    // 2. 사용자 정보 기반 템플릿 선택
    const templateIdList = await getSurveyTemplateIdList();
    
    // 나이/직업에 따른 템플릿 선택 로직
    let selectedTemplate;
    if (userInfo.age && userInfo.age < 25) {
      // 20대 초반용 템플릿
      selectedTemplate = templateIdList[0];
    } else if (userInfo.occupation?.includes("개발자")) {
      // 개발자용 템플릿
      selectedTemplate = templateIdList[1];
    } else {
      // 기본 템플릿
      selectedTemplate = templateIdList[Math.floor(Math.random() * templateIdList.length)];
    }
    
    return selectedTemplate;
  }
}
