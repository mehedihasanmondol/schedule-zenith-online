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
          category: Database["public"]["Enums"]["transaction_category"]
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
          category: Database["public"]["Enums"]["transaction_category"]
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
          category?: Database["public"]["Enums"]["transaction_category"]
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
      bulk_payroll: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          pay_period_end: string
          pay_period_start: string
          processed_records: number | null
          status: string
          total_amount: number | null
          total_records: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          pay_period_end: string
          pay_period_start: string
          processed_records?: number | null
          status?: string
          total_amount?: number | null
          total_records?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          pay_period_end?: string
          pay_period_start?: string
          processed_records?: number | null
          status?: string
          total_amount?: number | null
          total_records?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_payroll_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_payroll_items: {
        Row: {
          bulk_payroll_id: string
          created_at: string
          error_message: string | null
          id: string
          payroll_id: string | null
          profile_id: string
          status: string
        }
        Insert: {
          bulk_payroll_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          payroll_id?: string | null
          profile_id: string
          status?: string
        }
        Update: {
          bulk_payroll_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payroll_id?: string | null
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_payroll_items_bulk_payroll_id_fkey"
            columns: ["bulk_payroll_id"]
            isOneToOne: false
            referencedRelation: "bulk_payroll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_payroll_items_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_payroll_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      notification_permissions: {
        Row: {
          can_create_bulk_notifications: boolean
          can_create_notifications: boolean
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          can_create_bulk_notifications?: boolean
          can_create_notifications?: boolean
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          can_create_bulk_notifications?: boolean
          can_create_notifications?: boolean
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_data: Json | null
          action_type: string | null
          actioned_at: string | null
          created_at: string
          id: string
          is_actioned: boolean
          is_read: boolean
          message: string
          priority: string
          read_at: string | null
          recipient_profile_id: string
          related_id: string | null
          sender_profile_id: string | null
          title: string
          type: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          actioned_at?: string | null
          created_at?: string
          id?: string
          is_actioned?: boolean
          is_read?: boolean
          message: string
          priority?: string
          read_at?: string | null
          recipient_profile_id: string
          related_id?: string | null
          sender_profile_id?: string | null
          title: string
          type: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          actioned_at?: string | null
          created_at?: string
          id?: string
          is_actioned?: boolean
          is_read?: boolean
          message?: string
          priority?: string
          read_at?: string | null
          recipient_profile_id?: string
          related_id?: string | null
          sender_profile_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          bank_account_id: string | null
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
          bank_account_id?: string | null
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
          bank_account_id?: string | null
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
            foreignKeyName: "payroll_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
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
      roster_profiles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          roster_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          roster_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          roster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_profiles_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          end_date: string | null
          end_time: string
          expected_profiles: number | null
          id: string
          is_editable: boolean | null
          is_locked: boolean | null
          name: string | null
          notes: string | null
          per_hour_rate: number | null
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
          end_date?: string | null
          end_time: string
          expected_profiles?: number | null
          id?: string
          is_editable?: boolean | null
          is_locked?: boolean | null
          name?: string | null
          notes?: string | null
          per_hour_rate?: number | null
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
          end_date?: string | null
          end_time?: string
          expected_profiles?: number | null
          id?: string
          is_editable?: boolean | null
          is_locked?: boolean | null
          name?: string | null
          notes?: string | null
          per_hour_rate?: number | null
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
      salary_templates: {
        Row: {
          bank_account_id: string | null
          base_hourly_rate: number | null
          client_id: string | null
          created_at: string
          deduction_percentage: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          overtime_multiplier: number | null
          profile_id: string | null
          project_id: string | null
          updated_at: string
        }
        Insert: {
          bank_account_id?: string | null
          base_hourly_rate?: number | null
          client_id?: string | null
          created_at?: string
          deduction_percentage?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          overtime_multiplier?: number | null
          profile_id?: string | null
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_id?: string | null
          base_hourly_rate?: number | null
          client_id?: string | null
          created_at?: string
          deduction_percentage?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          overtime_multiplier?: number | null
          profile_id?: string | null
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_templates_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          actual_hours: number | null
          client_id: string
          created_at: string
          date: string
          end_time: string
          hourly_rate: number | null
          id: string
          notes: string | null
          overtime_hours: number | null
          payable_amount: number | null
          profile_id: string
          project_id: string
          roster_id: string | null
          sign_in_time: string | null
          sign_out_time: string | null
          start_time: string
          status: string
          total_hours: number
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          client_id: string
          created_at?: string
          date: string
          end_time: string
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payable_amount?: number | null
          profile_id: string
          project_id: string
          roster_id?: string | null
          sign_in_time?: string | null
          sign_out_time?: string | null
          start_time: string
          status?: string
          total_hours: number
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          client_id?: string
          created_at?: string
          date?: string
          end_time?: string
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payable_amount?: number | null
          profile_id?: string
          project_id?: string
          roster_id?: string | null
          sign_in_time?: string | null
          sign_out_time?: string | null
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
      transaction_category:
        | "income"
        | "expense"
        | "transfer"
        | "salary"
        | "equipment"
        | "materials"
        | "travel"
        | "office"
        | "utilities"
        | "marketing"
        | "other"
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
      transaction_category: [
        "income",
        "expense",
        "transfer",
        "salary",
        "equipment",
        "materials",
        "travel",
        "office",
        "utilities",
        "marketing",
        "other",
      ],
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
