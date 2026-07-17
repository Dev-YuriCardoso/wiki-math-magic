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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lan_clientes: {
        Row: {
          address: string | null
          age: number | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          saldo_minutos: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
          saldo_minutos?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          saldo_minutos?: number
          updated_at?: string
        }
        Relationships: []
      }
      lan_computers: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          status?: string
          tempo_comprado_minutos?: number
          tempo_usado_minutos?: number
          timestamp_ultimo_inicio?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          tempo_comprado_minutos?: number
          tempo_usado_minutos?: number
          timestamp_ultimo_inicio?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lan_time_transactions: {
        Row: {
          amount_paid: number
          computer_id: string | null
          created_at: string
          id: string
          minutes: number
          note: string | null
          operation: string | null
          payment_method: string | null
          seller_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          computer_id?: string | null
          created_at?: string
          id: string
          minutes: number
          note?: string | null
          operation?: string | null
          payment_method?: string | null
          seller_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          computer_id?: string | null
          created_at?: string
          id?: string
          minutes?: number
          note?: string | null
          operation?: string | null
          payment_method?: string | null
          seller_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      lan_computer_add_time: {
        Args: { _computer_id: string; _minutes: number }
        Returns: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lan_computers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lan_computer_assign:
        | {
            Args: { _computer_id: string; _user_id: string }
            Returns: {
              created_at: string
              id: string
              name: string
              status: string
              tempo_comprado_minutos: number
              tempo_usado_minutos: number
              timestamp_ultimo_inicio: string | null
              updated_at: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "lan_computers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _computer_id: string
              _initial_minutes?: number
              _user_id: string
            }
            Returns: {
              created_at: string
              id: string
              name: string
              status: string
              tempo_comprado_minutos: number
              tempo_usado_minutos: number
              timestamp_ultimo_inicio: string | null
              updated_at: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "lan_computers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      lan_computer_disconnect: {
        Args: { _computer_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lan_computers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lan_computer_disconnect_save_saldo: {
        Args: { _computer_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lan_computers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lan_computer_heartbeat: {
        Args: { _computer_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lan_computers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lan_computer_pause: {
        Args: { _computer_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lan_computers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lan_computer_remove_time: {
        Args: { _computer_id: string; _minutes: number }
        Returns: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lan_computers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lan_computer_start: {
        Args: { _computer_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          status: string
          tempo_comprado_minutos: number
          tempo_usado_minutos: number
          timestamp_ultimo_inicio: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "lan_computers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lan_elapsed_minutes: { Args: { _last_started: string }; Returns: number }
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
