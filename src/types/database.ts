
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
  category: string;
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
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
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
  profiles?: Profile;
}

export interface RolePermission {
  id: string;
  role: 'admin' | 'employee' | 'accountant' | 'operation' | 'sales_manager';
  permission: string;
}
