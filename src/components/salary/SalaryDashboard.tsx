
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Users, DollarSign, Calendar, Zap, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, BulkPayroll, SalaryTemplate, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { PayrollManagement } from "./PayrollManagement";
import { BulkPayrollManagement } from "./BulkPayrollManagement";
import { SalaryTemplateManagement } from "./SalaryTemplateManagement";

export const SalaryDashboard = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [bulkPayrolls, setBulkPayrolls] = useState<BulkPayroll[]>([]);
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [payrollsRes, bulkPayrollsRes, templatesRes, profilesRes] = await Promise.all([
        supabase.from('payroll').select(`
          *,
          profiles!payroll_profile_id_fkey (id, full_name, email, role, avatar_url, is_active, phone, employment_type, hourly_rate, salary, tax_file_number, start_date, created_at, updated_at),
          bank_accounts (id, bank_name, account_number)
        `).order('created_at', { ascending: false }),
        
        supabase.from('bulk_payroll').select(`
          *,
          profiles!bulk_payroll_created_by_fkey (id, full_name, email, role, avatar_url, is_active, phone, employment_type, hourly_rate, salary, tax_file_number, start_date, created_at, updated_at)
        `).order('created_at', { ascending: false }),
        
        supabase.from('salary_templates').select(`
          *,
          profiles (id, full_name, email, role, avatar_url, is_active, phone, employment_type, hourly_rate, salary, tax_file_number, start_date, created_at, updated_at),
          clients (id, name, email, phone, company, status, created_at, updated_at),
          projects (id, name, description, client_id, status, start_date, end_date, budget, created_at, updated_at),
          bank_accounts (id, profile_id, bank_name, account_number, bsb_code, swift_code, account_holder_name, opening_balance, is_primary, created_at, updated_at)
        `).order('created_at', { ascending: false }),
        
        supabase.from('profiles').select('*').eq('is_active', true).order('full_name')
      ]);

      if (payrollsRes.error) throw payrollsRes.error;
      if (bulkPayrollsRes.error) throw bulkPayrollsRes.error;
      if (templatesRes.error) throw templatesRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setPayrolls(payrollsRes.data as Payroll[]);
      setBulkPayrolls(bulkPayrollsRes.data as BulkPayroll[]);
      setTemplates(templatesRes.data as SalaryTemplate[]);
      setProfiles(profilesRes.data as Profile[]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch salary data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPayroll = payrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = payrolls.reduce((sum, p) => sum + p.total_hours, 0);
  const activeTemplates = templates.filter(t => t.is_active).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading salary dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Management System</h1>
            <p className="text-gray-600">Comprehensive payroll, bulk processing, and salary templates</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <p className="text-xs text-muted-foreground">Hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bulk Operations</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{bulkPayrolls.length}</div>
            <p className="text-xs text-muted-foreground">Bulk payroll batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Templates</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeTemplates}</div>
            <p className="text-xs text-muted-foreground">Salary templates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payroll">Individual Payroll</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          <TabsTrigger value="templates">Salary Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <PayrollManagement 
            payrolls={payrolls}
            profiles={profiles}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkPayrollManagement 
            bulkPayrolls={bulkPayrolls}
            profiles={profiles}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="templates">
          <SalaryTemplateManagement 
            templates={templates}
            profiles={profiles}
            onRefresh={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
