export type InterestTag = string;

export interface User {
  id: string;
  name: string | null;
  age: number | null;
  occupation: string | null;
  // createdAt: Date
  // updatedAt: Date
}

export interface SurveyTemplate {
  id: string;
  title: string;
  description: string | null;
  aiGenerated: boolean;
  createdAt: Date;
  questions?: Question[];
}

export interface Question {
  id: string;
  surveyTemplateId: string;
  text: string;
  weight: number;
  orderIndex: number;
  createdAt: Date;
  options?: Option[];
}

export interface Option {
  id: string;
  questionId: string;
  text: string;
  value: InterestTag;
  icon: string | null;
  orderIndex: number;
  createdAt: Date;
}

export interface UserSurvey {
  id: string;
  userId: string;
  surveyTemplateId: string;
  completed: boolean;
  createdAt: Date;
  completedAt: Date | null;
  responses?: UserResponse[];
}

export interface UserResponse {
  id: string;
  userSurveyId: string;
  questionId: string;
  optionId: string;
  createdAt: Date;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchScore: number;
  commonInterests: {
    tags: InterestTag[];
    responses: Array<{
      question: string;
      answer: string;
    }>;
  } | null;
  aiInsights: string | null;
  createdAt: Date;
}

export interface QRCode {
  id: string;
  userId: string;
  code: string;
  scans: number;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  age: number | null;
  occupation: string | null;
  interests: InterestTag[];
  createdAt: Date;
}

export interface MatchResult {
  score: number;
  commonTags: InterestTag[];
  commonResponses: Array<{
    question: string;
    answer: string;
  }>;
  aiInsights: string | null;
}
