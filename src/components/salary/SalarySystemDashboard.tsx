import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Users, DollarSign, Calendar, FileText, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, BulkPayroll, Profile, WorkingHour, BankTransaction } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { PayrollGenerationWizard } from "./PayrollGenerationWizard";
import { SalarySheetManager } from "./SalarySheetManager";
import { BulkSalaryProcessor } from "./BulkSalaryProcessor";
import { SalaryReports } from "./SalaryReports";

export const SalarySystemDashboard = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [bulkPayrolls, setBulkPayrolls] = useState<BulkPayroll[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [payrollsRes, bulkPayrollsRes, profilesRes, workingHoursRes, transactionsRes] = await Promise.all([
        supabase.from('payroll').select(`
          *,
          profiles!payroll_profile_id_fkey (id, full_name, email, role, hourly_rate, salary),
          bank_accounts (id, bank_name, account_number)
        `).order('created_at', { ascending: false }),
        
        supabase.from('bulk_payroll').select(`
          *,
          profiles!bulk_payroll_created_by_fkey (id, full_name, email, role)
        `).order('created_at', { ascending: false }),
        
        supabase.from('profiles').select('*').eq('is_active', true).order('full_name'),
        
        supabase.from('working_hours').select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role, hourly_rate),
          clients!working_hours_client_id_fkey (id, name, company),
          projects!working_hours_project_id_fkey (id, name)
        `).eq('status', 'approved').order('date', { ascending: false }),
        
        supabase.from('bank_transactions').select(`
          *,
          profiles!bank_transactions_profile_id_fkey (id, full_name),
          bank_accounts (id, bank_name, account_number)
        `).eq('category', 'salary').order('date', { ascending: false })
      ]);

      if (payrollsRes.error) throw payrollsRes.error;
      if (bulkPayrollsRes.error) throw bulkPayrollsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (workingHoursRes.error) throw workingHoursRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setPayrolls(payrollsRes.data as Payroll[]);
      setBulkPayrolls(bulkPayrollsRes.data as BulkPayroll[]);
      setProfiles(profilesRes.data as Profile[]);
      setWorkingHours(workingHoursRes.data as WorkingHour[]);
      setBankTransactions(transactionsRes.data as BankTransaction[]);
    } catch (error: any) {
      console.error('Error fetching salary data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch salary system data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPayroll = payrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = workingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
  const totalSalaryTransactions = bankTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingPayrolls = payrolls.filter(p => p.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading salary system...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprehensive Salary System</h1>
            <p className="text-gray-600">Manage payroll, bulk processing, salary sheets, and reports</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPayroll.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Net pay amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Approved hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Profiles</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payrolls</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingPayrolls}</div>
            <p className="text-xs text-muted-foreground">Require processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bulk Operations</CardTitle>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{bulkPayrolls.length}</div>
            <p className="text-xs text-muted-foreground">Batch processes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Salary Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${totalSalaryTransactions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Bank transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="salary-sheets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="salary-sheets">Salary Sheets</TabsTrigger>
          <TabsTrigger value="payroll-generation">Payroll Generation</TabsTrigger>
          <TabsTrigger value="bulk-processing">Bulk Processing</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="salary-sheets">
          <SalarySheetManager 
            payrolls={payrolls}
            profiles={profiles}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="payroll-generation">
          <PayrollGenerationWizard 
            profiles={profiles}
            workingHours={workingHours}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="bulk-processing">
          <BulkSalaryProcessor 
            bulkPayrolls={bulkPayrolls}
            profiles={profiles}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="reports">
          <SalaryReports 
            payrolls={payrolls}
            workingHours={workingHours}
            bankTransactions={bankTransactions}
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
