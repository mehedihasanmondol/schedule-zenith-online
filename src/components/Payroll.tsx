import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, DollarSign, Calendar, FileText, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Payroll as PayrollType, Profile, WorkingHour } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";

export const PayrollComponent = () => {
  const [payrolls, setPayrolls] = useState<PayrollType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [profilesWithHours, setProfilesWithHours] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWorkingHoursPreviewOpen, setIsWorkingHoursPreviewOpen] = useState(false);
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
    status: "pending" as const
  });

  const [previewWorkingHours, setPreviewWorkingHours] = useState<WorkingHour[]>([]);

  useEffect(() => {
    fetchPayrolls();
    fetchProfiles();
    fetchWorkingHours();
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

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role),
          clients!working_hours_client_id_fkey (id, name, company),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkingHours(data as WorkingHour[]);
      
      // Get profiles that have approved working hours
      const profileIds = [...new Set(data.map(wh => wh.profile_id))];
      const profilesWithApprovedHours = profiles.filter(p => profileIds.includes(p.id));
      setProfilesWithHours(profilesWithApprovedHours);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  // Update profiles with hours when profiles change
  useEffect(() => {
    if (profiles.length > 0 && workingHours.length > 0) {
      const profileIds = [...new Set(workingHours.map(wh => wh.profile_id))];
      const profilesWithApprovedHours = profiles.filter(p => profileIds.includes(p.id));
      setProfilesWithHours(profilesWithApprovedHours);
    }
  }, [profiles, workingHours]);

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
      setPreviewWorkingHours([]);
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
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const profileWorkingHours = workingHours.filter(wh => 
        wh.profile_id === profileId &&
        wh.date >= monthStart &&
        wh.date <= monthEnd
      );

      const totalHours = profileWorkingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
      const avgHourlyRate = profileWorkingHours.length > 0 
        ? profileWorkingHours.reduce((sum, wh) => sum + (wh.hourly_rate || 0), 0) / profileWorkingHours.length
        : 0;

      setFormData({
        profile_id: profileId,
        pay_period_start: monthStart,
        pay_period_end: monthEnd,
        total_hours: totalHours,
        hourly_rate: avgHourlyRate,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
        status: "pending"
      });
      
      setPreviewWorkingHours(profileWorkingHours);
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

  // Update preview when form data changes
  useEffect(() => {
    if (formData.profile_id && formData.pay_period_start && formData.pay_period_end) {
      const profileWorkingHours = workingHours.filter(wh => 
        wh.profile_id === formData.profile_id &&
        wh.date >= formData.pay_period_start &&
        wh.date <= formData.pay_period_end
      );

      const totalHours = profileWorkingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
      const avgHourlyRate = profileWorkingHours.length > 0 
        ? profileWorkingHours.reduce((sum, wh) => sum + (wh.hourly_rate || 0), 0) / profileWorkingHours.length
        : 0;

      setFormData(prev => ({
        ...prev,
        total_hours: totalHours,
        hourly_rate: avgHourlyRate
      }));
      
      setPreviewWorkingHours(profileWorkingHours);
    }
  }, [formData.profile_id, formData.pay_period_start, formData.pay_period_end, workingHours]);

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
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                    <Label htmlFor="total_hours">Total Hours (Auto-calculated)</Label>
                    <Input
                      id="total_hours"
                      type="number"
                      step="0.5"
                      value={formData.total_hours}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hourly_rate">Average Hourly Rate (Auto-calculated)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      readOnly
                      className="bg-gray-50"
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

                {previewWorkingHours.length > 0 && (
                  <Collapsible open={isWorkingHoursPreviewOpen} onOpenChange={setIsWorkingHoursPreviewOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Working Hours Preview ({previewWorkingHours.length} entries)
                        </span>
                        {isWorkingHoursPreviewOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="border rounded-lg p-4">
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {previewWorkingHours.map((wh) => (
                            <div key={wh.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium">{new Date(wh.date).toLocaleDateString()}</span>
                                <span className="text-gray-600 ml-2">
                                  {wh.clients?.company || 'N/A'} - {wh.projects?.name || 'N/A'}
                                </span>
                              </div>
                              <div className="text-right">
                                <div>{wh.total_hours}h × ${wh.hourly_rate}/hr</div>
                                <div className="font-medium">${(wh.total_hours * (wh.hourly_rate || 0)).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Quick Generate Payroll - Employees with Approved Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profilesWithHours.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No employees have approved working hours available
                </p>
              ) : (
                profilesWithHours.map((profile) => {
                  const profileHours = workingHours.filter(wh => wh.profile_id === profile.id);
                  const totalHours = profileHours.reduce((sum, wh) => sum + wh.total_hours, 0);
                  const avgRate = profileHours.length > 0 
                    ? profileHours.reduce((sum, wh) => sum + (wh.hourly_rate || 0), 0) / profileHours.length
                    : 0;
                  
                  return (
                    <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{profile.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {profile.role} - {totalHours.toFixed(1)}h available at avg ${avgRate.toFixed(2)}/hr
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePayrollForProfile(profile.id)}
                      >
                        Generate
                      </Button>
                    </div>
                  );
                })
              )}
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
