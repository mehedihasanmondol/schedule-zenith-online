import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Payroll as PayrollType, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";

export const PayrollComponent = () => {
  const [payrolls, setPayrolls] = useState<PayrollType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    pay_period_start: "",
    pay_period_end: "",
    total_hours: 0,
    hourly_rate: 0,
    gross_pay: 0,
    deductions: 0,
    net_pay: 0,
    status: "pending"
  });

  useEffect(() => {
    fetchPayrolls();
    fetchProfiles();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          profiles!payroll_profile_id_fkey (id, full_name, role, hourly_rate)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Handle the data safely with proper type checking
      const payrollData = (data || []).map(payroll => ({
        ...payroll,
        profiles: Array.isArray(payroll.profiles) ? payroll.profiles[0] : payroll.profiles
      }));
      
      setPayrolls(payrollData as PayrollType[]);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const calculatePayroll = (hours: number, rate: number, deductions: number) => {
    const gross = hours * rate;
    const net = gross - deductions;
    return { gross, net };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { gross, net } = calculatePayroll(formData.total_hours, formData.hourly_rate, formData.deductions);
      
      const { error } = await supabase
        .from('payroll')
        .insert([{
          ...formData,
          gross_pay: gross,
          net_pay: net
        }]);

      if (error) throw error;
      toast({ title: "Success", description: "Payroll record created successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        pay_period_start: "",
        pay_period_end: "",
        total_hours: 0,
        hourly_rate: 0,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
        status: "pending"
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Error creating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePayrollStatus = async (id: string, status: 'approved' | 'paid') => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Payroll ${status} successfully` 
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Error updating payroll status:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll status",
        variant: "destructive"
      });
    }
  };

  const generatePayrollForProfile = async (profileId: string) => {
    try {
      // Get current month start and end
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Get approved working hours for this profile
      const { data: workingHours, error: whError } = await supabase
        .from('working_hours')
        .select('total_hours')
        .eq('profile_id', profileId)
        .eq('status', 'approved')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (whError) throw whError;

      const totalHours = workingHours?.reduce((sum, wh) => sum + wh.total_hours, 0) || 0;
      
      // Get profile hourly rate
      const profile = profiles.find(p => p.id === profileId);
      const hourlyRate = profile?.hourly_rate || 25;

      setFormData({
        profile_id: profileId,
        pay_period_start: monthStart,
        pay_period_end: monthEnd,
        total_hours: totalHours,
        hourly_rate: hourlyRate,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
        status: "pending"
      });
      
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to generate payroll",
        variant: "destructive"
      });
    }
  };

  if (loading && payrolls.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
            <p className="text-gray-600">Manage employee payroll and payments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Payroll Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <ProfileSelector
                  profiles={profiles}
                  selectedProfileId={formData.profile_id}
                  onProfileSelect={(profileId) => setFormData({ ...formData, profile_id: profileId })}
                  label="Select Profile"
                  placeholder="Choose an employee"
                  showRoleFilter={true}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pay_period_start">Period Start</Label>
                    <Input
                      id="pay_period_start"
                      type="date"
                      value={formData.pay_period_start}
                      onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pay_period_end">Period End</Label>
                    <Input
                      id="pay_period_end"
                      type="date"
                      value={formData.pay_period_end}
                      onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_hours">Total Hours</Label>
                    <Input
                      id="total_hours"
                      type="number"
                      step="0.5"
                      value={formData.total_hours}
                      onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deductions">Deductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {formData.total_hours > 0 && formData.hourly_rate > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between text-sm">
                      <span>Gross Pay:</span>
                      <span>${(formData.total_hours * formData.hourly_rate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Deductions:</span>
                      <span>-${formData.deductions.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Net Pay:</span>
                      <span>${(formData.total_hours * formData.hourly_rate - formData.deductions).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Payroll"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payroll</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${payrolls.reduce((sum, p) => sum + p.gross_pay, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payrolls.filter(p => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payrolls.filter(p => p.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payrolls.filter(p => p.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Generate Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{profile.full_name}</div>
                    <div className="text-sm text-gray-600">{profile.role} - ${profile.hourly_rate || 25}/hr</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generatePayrollForProfile(profile.id)}
                  >
                    Generate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payrolls.slice(0, 5).map((payroll) => (
                <div key={payroll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{payroll.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium">${payroll.net_pay.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      payroll.status === "paid" ? "default" : 
                      payroll.status === "approved" ? "secondary" : "outline"
                    }>
                      {payroll.status}
                    </Badge>
                    {payroll.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePayrollStatus(payroll.id, "approved")}
                      >
                        Approve
                      </Button>
                    )}
                    {payroll.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => updatePayrollStatus(payroll.id, "paid")}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Gross</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Net</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{payroll.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">{payroll.profiles?.role || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{payroll.total_hours}h</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.hourly_rate}/hr</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.gross_pay.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">${payroll.net_pay.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        payroll.status === "paid" ? "default" : 
                        payroll.status === "approved" ? "secondary" : "outline"
                      }>
                        {payroll.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
