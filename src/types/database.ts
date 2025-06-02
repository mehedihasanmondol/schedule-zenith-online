
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'employee' | 'accountant' | 'operation' | 'sales_manager';
  avatar_url: string | null;
  is_active: boolean;
  full_address?: string;
  employment_type?: 'full-time' | 'part-time' | 'casual';
  hourly_rate?: number;
  salary?: number;
  tax_file_number?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  status: 'active' | 'completed' | 'on-hold';
  start_date: string;
  end_date?: string;
  budget: number;
  created_at: string;
  updated_at: string;
  clients?: Client;
}

export interface WorkingHour {
  id: string;
  profile_id: string;
  client_id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  status: 'pending' | 'approved' | 'rejected';
  roster_id?: string;
  created_at: string;
  updated_at: string;
  sign_in_time?: string;
  sign_out_time?: string;
  actual_hours?: number;
  overtime_hours?: number;
  hourly_rate?: number;
  payable_amount?: number;
  notes?: string;
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
}

export interface BankAccount {
  id: string;
  profile_id: string;
  bank_name: string;
  account_number: string;
  bsb_code?: string;
  swift_code?: string;
  account_holder_name: string;
  opening_balance: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  category: 'income' | 'expense' | 'transfer' | 'salary' | 'equipment' | 'materials' | 'travel' | 'office' | 'utilities' | 'marketing' | 'other';
  date: string;
  created_at: string;
  updated_at: string;
  client_id?: string;
  project_id?: string;
  profile_id?: string;
  bank_account_id?: string;
  clients?: Client;
  projects?: Project;
  profiles?: Profile;
  bank_accounts?: BankAccount;
}

export interface RosterProfile {
  id: string;
  roster_id: string;
  profile_id: string;
  created_at: string;
  profiles?: Profile;
}

export interface Roster {
  id: string;
  profile_id: string;
  client_id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  name?: string;
  expected_profiles?: number;
  per_hour_rate?: number;
  is_editable?: boolean;
  end_date?: string;
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
  roster_profiles?: RosterProfile[];
}

export interface Payroll {
  id: string;
  profile_id: string;
  pay_period_start: string;
  pay_period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
  updated_at: string;
  bank_account_id?: string;
  profiles?: Profile;
  bank_accounts?: BankAccount;
}

export interface BulkPayroll {
  id: string;
  name: string;
  description?: string;
  pay_period_start: string;
  pay_period_end: string;
  created_by: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  total_records: number;
  processed_records: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  bulk_payroll_items?: BulkPayrollItem[];
  profiles?: Profile;
}

export interface BulkPayrollItem {
  id: string;
  bulk_payroll_id: string;
  profile_id: string;
  payroll_id?: string;
  status: 'pending' | 'processed' | 'failed';
  error_message?: string;
  created_at: string;
  profiles?: Profile;
  payroll?: Payroll;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  description?: string;
  profile_id?: string;
  client_id?: string;
  project_id?: string;
  bank_account_id?: string;
  base_hourly_rate: number;
  overtime_multiplier: number;
  deduction_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
  bank_accounts?: BankAccount;
}

export interface RolePermission {
  id: string;
  role: 'admin' | 'employee' | 'accountant' | 'operation' | 'sales_manager';
  permission: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  recipient_profile_id: string;
  sender_profile_id?: string;
  related_id?: string;
  action_type: 'approve' | 'confirm' | 'grant' | 'cancel' | 'reject' | 'none';
  action_data?: any;
  is_read: boolean;
  is_actioned: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  read_at?: string;
  actioned_at?: string;
}

export interface NotificationPermission {
  id: string;
  profile_id: string;
  can_create_notifications: boolean;
  can_create_bulk_notifications: boolean;
  created_at: string;
}
