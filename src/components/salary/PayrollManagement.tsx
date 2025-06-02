
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, Profile, WorkingHour, Client, Project, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface PayrollManagementProps {
  payrolls: Payroll[];
  profiles: Profile[];
  onRefresh: () => void;
}

export const PayrollManagement = ({ payrolls, profiles, onRefresh }: PayrollManagementProps) => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    pay_period_start: "",
    pay_period_end: "",
    bank_account_id: ""
  });

  useEffect(() => {
    fetchAdditionalData();
  }, []);

  const fetchAdditionalData = async () => {
    try {
      const [hoursRes, clientsRes, projectsRes, banksRes] = await Promise.all([
        supabase.from('working_hours').select(`
          *,
          profiles (id, full_name, email, role, avatar_url, is_active, phone, employment_type, hourly_rate, salary, tax_file_number, start_date, created_at, updated_at),
          clients (id, name, email, phone, company, status, created_at, updated_at),
          projects (id, name, description, client_id, status, start_date, end_date, budget, created_at, updated_at)
        `).eq('status', 'approved'),
        supabase.from('clients').select('*').eq('status', 'active'),
        supabase.from('projects').select('*').eq('status', 'active'),
        supabase.from('bank_accounts').select('*')
      ]);

      if (hoursRes.error) throw hoursRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (banksRes.error) throw banksRes.error;

      setWorkingHours(hoursRes.data as WorkingHour[]);
      setClients(clientsRes.data as Client[]);
      setProjects(projectsRes.data as Project[]);
      setBankAccounts(banksRes.data as BankAccount[]);
    } catch (error) {
      console.error('Error fetching additional data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const relevantHours = workingHours.filter(wh => 
        wh.profile_id === formData.profile_id &&
        wh.date >= formData.pay_period_start &&
        wh.date <= formData.pay_period_end
      );

      const totalHours = relevantHours.reduce((sum, wh) => sum + wh.total_hours, 0);
      const profile = profiles.find(p => p.id === formData.profile_id);
      const hourlyRate = profile?.hourly_rate || 0;
      const grossPay = totalHours * hourlyRate;
      const deductions = grossPay * 0.1;
      const netPay = grossPay - deductions;

      const payrollData = {
        profile_id: formData.profile_id,
        pay_period_start: formData.pay_period_start,
        pay_period_end: formData.pay_period_end,
        total_hours: totalHours,
        hourly_rate: hourlyRate,
        gross_pay: grossPay,
        deductions: deductions,
        net_pay: netPay,
        bank_account_id: formData.bank_account_id || null,
        status: 'pending' as const
      };

      const { error } = await supabase.from('payroll').insert([payrollData]);
      if (error) throw error;

      toast({ title: "Success", description: "Payroll created successfully" });
      setIsDialogOpen(false);
      setFormData({ profile_id: "", pay_period_start: "", pay_period_end: "", bank_account_id: "" });
      onRefresh();
    } catch (error: any) {
      console.error('Error creating payroll:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayrolls = payrolls.filter(payroll =>
    payroll.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Individual Payroll Management</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Payroll</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profile_id">Employee *</Label>
                      <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bank_account_id">Bank Account</Label>
                      <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Bank Account</SelectItem>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.bank_name} - {account.account_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="pay_period_start">Pay Period Start *</Label>
                      <Input
                        id="pay_period_start"
                        type="date"
                        value={formData.pay_period_start}
                        onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="pay_period_end">Pay Period End *</Label>
                      <Input
                        id="pay_period_end"
                        type="date"
                        value={formData.pay_period_end}
                        onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creating..." : "Create Payroll"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Pay Period</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrolls.map((payroll) => (
                <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">
                    {payroll.profiles?.full_name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {payroll.total_hours.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">
                    ${payroll.gross_pay.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-red-600">
                    ${payroll.deductions.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-green-600 font-bold">
                    ${payroll.net_pay.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payroll.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : payroll.status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payroll.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPayrolls.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payroll records found</p>
                    <p className="text-sm">Create a payroll to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
