export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      children: {
        Row: {
          allergies: string[]
          birth_date: string
          created_at: string
          diet_type: string
          dislikes: string[]
          id: string
          likes: string[]
          name: string
          user_id: string
        }
        Insert: {
          allergies?: string[]
          birth_date: string
          created_at?: string
          diet_type?: string
          dislikes?: string[]
          id?: string
          likes?: string[]
          name: string
          user_id: string
        }
        Update: {
          allergies?: string[]
          birth_date?: string
          created_at?: string
          diet_type?: string
          dislikes?: string[]
          id?: string
          likes?: string[]
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          allergens: string[]
          calories: number
          carbohydrates: number
          category: string
          diet_type: string
          fat: number
          fiber: number
          id: string
          image: string
          meal_types: string[]
          name: string
          protein: number
          serving_size: string
          sugar: number
        }
        Insert: {
          allergens?: string[]
          calories: number
          carbohydrates: number
          category: string
          diet_type: string
          fat: number
          fiber?: number
          id?: string
          image?: string
          meal_types?: string[]
          name: string
          protein: number
          serving_size: string
          sugar?: number
        }
        Update: {
          allergens?: string[]
          calories?: number
          carbohydrates?: number
          category?: string
          diet_type?: string
          fat?: number
          fiber?: number
          id?: string
          image?: string
          meal_types?: string[]
          name?: string
          protein?: number
          serving_size?: string
          sugar?: number
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          breakfast: Json
          created_at: string
          dinner: Json
          id: string
          lunch: Json
          plan_date: string
          snack: Json
          target_calories: number
          total_calories: number
          total_carbohydrates: number
          total_fat: number
          total_protein: number
          user_id: string
        }
        Insert: {
          breakfast: Json
          created_at?: string
          dinner: Json
          id?: string
          lunch: Json
          plan_date?: string
          snack: Json
          target_calories: number
          total_calories: number
          total_carbohydrates: number
          total_fat: number
          total_protein: number
          user_id: string
        }
        Update: {
          breakfast?: Json
          created_at?: string
          dinner?: Json
          id?: string
          lunch?: Json
          plan_date?: string
          snack?: Json
          target_calories?: number
          total_calories?: number
          total_carbohydrates?: number
          total_fat?: number
          total_protein?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[]
          created_at: string
          diet_type: string | null
          full_name: string
          gender: string | null
          goal: string | null
          health_conditions: string[]
          height: number | null
          liked_recipe_ids: string[]
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          created_at?: string
          diet_type?: string | null
          full_name?: string
          gender?: string | null
          goal?: string | null
          health_conditions?: string[]
          height?: number | null
          liked_recipe_ids?: string[]
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[]
          created_at?: string
          diet_type?: string | null
          full_name?: string
          gender?: string | null
          goal?: string | null
          health_conditions?: string[]
          height?: number | null
          liked_recipe_ids?: string[]
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          allergens: string[]
          audience: string
          calories: number
          carbohydrates: number
          cook_minutes: number
          course: string
          description: string
          diet_type: string
          fat: number
          fiber: number
          flavors: string[]
          id: string
          image: string
          ingredients: string[]
          key_ingredients: string[]
          max_age_months: number | null
          meal_types: string[]
          min_age_months: number | null
          name: string
          prep_minutes: number
          protein: number
          region: string
          serving_size: string
          servings: number
          slug: string
          sodium: number
          steps: string[]
          sugar: number
          suitable_for: string[]
          texture: string
          tips: string
        }
        Insert: {
          allergens?: string[]
          audience?: string
          calories: number
          carbohydrates: number
          cook_minutes?: number
          course: string
          description?: string
          diet_type: string
          fat: number
          fiber?: number
          flavors?: string[]
          id?: string
          image?: string
          ingredients?: string[]
          key_ingredients?: string[]
          max_age_months?: number | null
          meal_types?: string[]
          min_age_months?: number | null
          name: string
          prep_minutes?: number
          protein: number
          region: string
          serving_size: string
          servings?: number
          slug: string
          sodium?: number
          steps?: string[]
          sugar?: number
          suitable_for?: string[]
          texture?: string
          tips?: string
        }
        Update: {
          allergens?: string[]
          audience?: string
          calories?: number
          carbohydrates?: number
          cook_minutes?: number
          course?: string
          description?: string
          diet_type?: string
          fat?: number
          fiber?: number
          flavors?: string[]
          id?: string
          image?: string
          ingredients?: string[]
          key_ingredients?: string[]
          max_age_months?: number | null
          meal_types?: string[]
          min_age_months?: number | null
          name?: string
          prep_minutes?: number
          protein?: number
          region?: string
          serving_size?: string
          servings?: number
          slug?: string
          sodium?: number
          steps?: string[]
          sugar?: number
          suitable_for?: string[]
          texture?: string
          tips?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
