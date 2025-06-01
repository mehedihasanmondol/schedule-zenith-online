export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          bsb_code: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          opening_balance: number | null
          profile_id: string | null
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          bsb_code?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          opening_balance?: number | null
          profile_id?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          bsb_code?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          opening_balance?: number | null
          profile_id?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string
          client_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          profile_id: string | null
          project_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category: string
          client_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          profile_id?: string | null
          project_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          profile_id?: string | null
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          email: string
          hourly_rate: number
          id: string
          name: string
          phone: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          hourly_rate?: number
          id?: string
          name: string
          phone?: string | null
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          hourly_rate?: number
          id?: string
          name?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          created_at: string
          deductions: number
          gross_pay: number
          hourly_rate: number
          id: string
          net_pay: number
          pay_period_end: string
          pay_period_start: string
          profile_id: string
          status: string
          total_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deductions?: number
          gross_pay?: number
          hourly_rate?: number
          id?: string
          net_pay?: number
          pay_period_end: string
          pay_period_start: string
          profile_id: string
          status?: string
          total_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deductions?: number
          gross_pay?: number
          hourly_rate?: number
          id?: string
          net_pay?: number
          pay_period_end?: string
          pay_period_start?: string
          profile_id?: string
          status?: string
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          full_address: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          salary: number | null
          start_date: string | null
          tax_file_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          full_address?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          start_date?: string | null
          tax_file_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          full_address?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          start_date?: string | null
          tax_file_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      rosters: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_locked: boolean | null
          notes: string | null
          profile_id: string
          project_id: string
          start_time: string
          status: string | null
          total_hours: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_locked?: boolean | null
          notes?: string | null
          profile_id: string
          project_id: string
          start_time: string
          status?: string | null
          total_hours: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_locked?: boolean | null
          notes?: string | null
          profile_id?: string
          project_id?: string
          start_time?: string
          status?: string | null
          total_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rosters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          client_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          profile_id: string
          project_id: string
          roster_id: string | null
          start_time: string
          status: string
          total_hours: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          profile_id: string
          project_id: string
          roster_id?: string | null
          start_time: string
          status?: string
          total_hours: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          profile_id?: string
          project_id?: string
          roster_id?: string | null
          start_time?: string
          status?: string
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_role_permissions: {
        Args: { user_role: Database["public"]["Enums"]["user_role"] }
        Returns: {
          permission: Database["public"]["Enums"]["app_permission"]
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_permission: {
        Args: {
          user_id: string
          required_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      role_has_permission: {
        Args: {
          user_role: Database["public"]["Enums"]["user_role"]
          required_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "dashboard_view"
        | "employees_view"
        | "employees_manage"
        | "clients_view"
        | "clients_manage"
        | "projects_view"
        | "projects_manage"
        | "working_hours_view"
        | "working_hours_manage"
        | "working_hours_approve"
        | "roster_view"
        | "roster_manage"
        | "payroll_view"
        | "payroll_manage"
        | "payroll_process"
        | "bank_balance_view"
        | "bank_balance_manage"
        | "reports_view"
        | "reports_generate"
        | "notifications_view"
      employment_type: "full-time" | "part-time" | "casual"
      user_role:
        | "admin"
        | "employee"
        | "accountant"
        | "operation"
        | "sales_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "dashboard_view",
        "employees_view",
        "employees_manage",
        "clients_view",
        "clients_manage",
        "projects_view",
        "projects_manage",
        "working_hours_view",
        "working_hours_manage",
        "working_hours_approve",
        "roster_view",
        "roster_manage",
        "payroll_view",
        "payroll_manage",
        "payroll_process",
        "bank_balance_view",
        "bank_balance_manage",
        "reports_view",
        "reports_generate",
        "notifications_view",
      ],
      employment_type: ["full-time", "part-time", "casual"],
      user_role: [
        "admin",
        "employee",
        "accountant",
        "operation",
        "sales_manager",
      ],
    },
  },
} as const
