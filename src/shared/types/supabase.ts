export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          age: number | null
          occupation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          age?: number | null
          occupation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          age?: number | null
          occupation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      survey_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          ai_generated?: boolean
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          survey_template_id: string
          text: string
          weight: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          survey_template_id: string
          text: string
          weight?: number
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          survey_template_id?: string
          text?: string
          weight?: number
          order_index?: number
          created_at?: string
        }
      }
      options: {
        Row: {
          id: string
          question_id: string
          text: string
          value: string
          icon: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          text: string
          value: string
          icon?: string | null
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          text?: string
          value?: string
          icon?: string | null
          order_index?: number
          created_at?: string
        }
      }
      user_surveys: {
        Row: {
          id: string
          user_id: string
          survey_template_id: string
          completed: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          survey_template_id: string
          completed?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          survey_template_id?: string
          completed?: boolean
          created_at?: string
          completed_at?: string | null
        }
      }
      user_responses: {
        Row: {
          id: string
          user_survey_id: string
          question_id: string
          option_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_survey_id: string
          question_id: string
          option_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_survey_id?: string
          question_id?: string
          option_id?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          match_score: number
          common_interests: Json | null
          ai_insights: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          match_score: number
          common_interests?: Json | null
          ai_insights?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          match_score?: number
          common_interests?: Json | null
          ai_insights?: string | null
          created_at?: string
        }
      }
      qr_codes: {
        Row: {
          id: string
          user_id: string
          code: string
          scans: number
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          scans?: number
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          scans?: number
          created_at?: string
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
