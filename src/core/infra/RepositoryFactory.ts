import type { UserRepo } from "@/core/repositories/UserRepo";
import type { SurveyRepo } from "@/core/repositories/SurveyRepo";
import type { MatchRepo } from "@/core/repositories/MatchRepo";
import type { QRCodeRepo } from "@/core/repositories/QRCodeRepo";

import { supabaseUserRepo } from "@/core/infra/SupabaseUserRepo";
import { supabaseSurveyRepo } from "@/core/infra/SupabaseSurveyRepo";
import { supabaseMatchRepo } from "@/core/infra/SupabaseMatchRepo";
import { supabaseQRCodeRepo } from "@/core/infra/SupabaseQRCodeRepo";

export const getUserRepo = (): UserRepo => {
  return supabaseUserRepo;
};

export const getSurveyRepo = (): SurveyRepo => {
  return supabaseSurveyRepo;
};

export const getMatchRepo = (): MatchRepo => {
  return supabaseMatchRepo;
};

export const getQRCodeRepo = (): QRCodeRepo => {
  return supabaseQRCodeRepo;
};

export const getSurveyTemplateIdList = async (): Promise<string[]> => {
  return await supabaseSurveyRepo.getTemplateIdList();
};
