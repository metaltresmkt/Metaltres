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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_config: {
        Row: {
          auto_schedule: boolean
          bio_text: string | null
          business_hours: Json | null
          confirm_enabled: boolean
          confirm_lead_time: number | null
          confirm_message: string | null
          default_ticket_value: number | null
          followup_delay: number | null
          followup_enabled: boolean
          followup_message: string | null
          handoff_enabled: boolean
          handoff_message: string | null
          handoff_rules: Json
          handoff_triggers: string[] | null
          id: string
          loja_id: string
          name: string | null
          phone: string | null
          prompt: string | null
          response_speed: string
          response_style: string
          sla_minutes: number | null
          tone: number
          updated_at: string
        }
        Insert: {
          auto_schedule?: boolean
          bio_text?: string | null
          business_hours?: Json | null
          confirm_enabled?: boolean
          confirm_lead_time?: number | null
          confirm_message?: string | null
          default_ticket_value?: number | null
          followup_delay?: number | null
          followup_enabled?: boolean
          followup_message?: string | null
          handoff_enabled?: boolean
          handoff_message?: string | null
          handoff_rules?: Json
          handoff_triggers?: string[] | null
          id?: string
          loja_id: string
          name?: string | null
          phone?: string | null
          prompt?: string | null
          response_speed?: string
          response_style?: string
          sla_minutes?: number | null
          tone?: number
          updated_at?: string
        }
        Update: {
          auto_schedule?: boolean
          bio_text?: string | null
          business_hours?: Json | null
          confirm_enabled?: boolean
          confirm_lead_time?: number | null
          confirm_message?: string | null
          default_ticket_value?: number | null
          followup_delay?: number | null
          followup_enabled?: boolean
          followup_message?: string | null
          handoff_enabled?: boolean
          handoff_message?: string | null
          handoff_rules?: Json
          handoff_triggers?: string[] | null
          id?: string
          loja_id?: string
          name?: string | null
          phone?: string | null
          prompt?: string | null
          response_speed?: string
          response_style?: string
          sla_minutes?: number | null
          tone?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: true
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          id: string
          lead_id: string | null
          loja_id: string
          message_sent: string | null
          metadata: Json | null
          rule_id: string | null
          status: string
          triggered_at: string
          type: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          loja_id: string
          message_sent?: string | null
          metadata?: Json | null
          rule_id?: string | null
          status?: string
          triggered_at?: string
          type: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          loja_id?: string
          message_sent?: string | null
          metadata?: Json | null
          rule_id?: string | null
          status?: string
          triggered_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          customer_id: string | null
          direction: string
          id: string
          lead_id: string | null
          loja_id: string
          message: Json | null
          metadata: Json | null
          phone: string | null
          sender: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          direction: string
          id?: string
          lead_id?: string | null
          loja_id: string
          message?: Json | null
          metadata?: Json | null
          phone?: string | null
          sender?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          loja_id?: string
          message?: Json | null
          metadata?: Json | null
          phone?: string | null
          sender?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          loja_id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          loja_id: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          loja_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          customer_id: string | null
          date: string
          description: string | null
          id: string
          loja_id: string
          payment_method: string | null
          quote_id: string | null
          status: string
          type: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          customer_id?: string | null
          date?: string
          description?: string | null
          id?: string
          loja_id: string
          payment_method?: string | null
          quote_id?: string | null
          status?: string
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          customer_id?: string | null
          date?: string
          description?: string | null
          id?: string
          loja_id?: string
          payment_method?: string | null
          quote_id?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_system: boolean
          loja_id: string
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          loja_id: string
          name: string
          position?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          loja_id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          loja_id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          loja_id: string
          notes?: string | null
          product_id: string
          quantity: number
          reason: string
          reference_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          loja_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_enabled: boolean | null
          confirm_sent_at: string | null
          converted_customer_id: string | null
          converted_patient_id: string | null
          created_at: string
          email: string | null
          estimated_value: number | null
          followup_count: number
          followup_sent_at: string | null
          handoff_triggered_at: string | null
          id: string
          last_message_at: string | null
          last_message_by: string | null
          last_message_preview: string | null
          last_outbound_at: string | null
          loja_id: string
          name: string
          notes: string | null
          phone: string | null
          sla_breach_count: number | null
          source: string | null
          stage_id: string | null
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean | null
          confirm_sent_at?: string | null
          converted_customer_id?: string | null
          converted_patient_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          followup_count?: number
          followup_sent_at?: string | null
          handoff_triggered_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_by?: string | null
          last_message_preview?: string | null
          last_outbound_at?: string | null
          loja_id: string
          name: string
          notes?: string | null
          phone?: string | null
          sla_breach_count?: number | null
          source?: string | null
          stage_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean | null
          confirm_sent_at?: string | null
          converted_customer_id?: string | null
          converted_patient_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          followup_count?: number
          followup_sent_at?: string | null
          handoff_triggered_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_by?: string | null
          last_message_preview?: string | null
          last_outbound_at?: string | null
          loja_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          sla_breach_count?: number | null
          source?: string | null
          stage_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_patient_id_fkey"
            columns: ["converted_patient_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          notification_group_id: string | null
          phone: string | null
          plan: string
          primary_color: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          notification_group_id?: string | null
          phone?: string | null
          plan?: string
          primary_color?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          notification_group_id?: string | null
          phone?: string | null
          plan?: string
          primary_color?: string | null
        }
        Relationships: []
      }
      production_orders: {
        Row: {
          created_at: string
          delivery_date: string | null
          id: string
          loja_id: string
          notes: string | null
          priority: string | null
          quote_id: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string | null
          id?: string
          loja_id: string
          notes?: string | null
          priority?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string | null
          id?: string
          loja_id?: string
          notes?: string | null
          priority?: string | null
          quote_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          current_stock: number | null
          description: string | null
          id: string
          loja_id: string
          min_stock: number | null
          name: string
          sku: string | null
          unit_price: number
          unit_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          loja_id: string
          min_stock?: number | null
          name: string
          sku?: string | null
          unit_price?: number
          unit_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          loja_id?: string
          min_stock?: number | null
          name?: string
          sku?: string | null
          unit_price?: number
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          height: number | null
          id: string
          product_id: string
          quantity: number
          quote_id: string
          subtotal: number
          unit_price: number
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          product_id: string
          quantity?: number
          quote_id: string
          subtotal: number
          unit_price: number
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          product_id?: string
          quantity?: number
          quote_id?: string
          subtotal?: number
          unit_price?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          loja_id: string
          notes: string | null
          seller_id: string | null
          status: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          loja_id: string
          notes?: string | null
          seller_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          loja_id?: string
          notes?: string | null
          seller_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          loja_id: string
          name: string
          phone: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          loja_id: string
          name: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          loja_id?: string
          name?: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellers_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          loja_id: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          loja_id: string
          role: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          loja_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_token: string
          api_url: string
          connected_at: string | null
          id: string
          loja_id: string
          phone_number: string | null
          status: string
        }
        Insert: {
          api_token: string
          api_url: string
          connected_at?: string | null
          id?: string
          loja_id: string
          phone_number?: string | null
          status?: string
        }
        Update: {
          api_token?: string
          api_url?: string
          connected_at?: string | null
          id?: string
          loja_id?: string
          phone_number?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_clinic_id_fkey"
            columns: ["loja_id"]
            isOneToOne: true
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_loja_id: { Args: never; Returns: string }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
