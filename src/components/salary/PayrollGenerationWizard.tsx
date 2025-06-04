
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, DollarSign, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { Profile, WorkingHour, BankAccount, Payroll } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EnhancedProfileSelector } from "./EnhancedProfileSelector";

interface PayrollGenerationWizardProps {
  profiles: Profile[];
  workingHours: WorkingHour[];
  onRefresh: () => void;
}

export const PayrollGenerationWizard = ({ profiles, workingHours, onRefresh }: PayrollGenerationWizardProps) => {
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [payrollPreview, setPayrollPreview] = useState<any[]>([]);
  const [existingPayrolls, setExistingPayrolls] = useState<Payroll[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [filteredWorkingHours, setFilteredWorkingHours] = useState<WorkingHour[]>([]);
  const [overlappingPayrolls, setOverlappingPayrolls] = useState<string[]>([]);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBankAccounts();
    fetchExistingPayrolls();
  }, []);

  useEffect(() => {
    reloadFilteredData();
  }, [dateRange]);

  useEffect(() => {
    if (selectedProfileIds.length > 0 && dateRange.start && dateRange.end) {
      generatePayrollPreview();
      checkForOverlappingPayrolls();
    } else {
      setPayrollPreview([]);
      setOverlappingPayrolls([]);
    }
  }, [selectedProfileIds, filteredWorkingHours, existingPayrolls]);

  const reloadFilteredData = async () => {
    try {
      setFilterLoading(true);
      
      console.log('Reloading filtered data with:', { dateRange });
      
      // Fetch only approved working hours based on date range
      const { data: workingHoursData, error: whError } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role, hourly_rate, employment_type),
          clients!working_hours_client_id_fkey (id, name, company),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (whError) {
        console.error('Error fetching working hours:', whError);
        throw whError;
      }

      console.log('Fetched approved working hours:', workingHoursData?.length || 0);

      const typedWorkingHours = (workingHoursData || []).map(wh => ({
        ...wh,
        status: wh.status as 'approved'
      })) as WorkingHour[];

      setFilteredWorkingHours(typedWorkingHours);

      // Get unique profile IDs from working hours
      const profileIdsFromWorkingHours = new Set(typedWorkingHours.map(wh => wh.profile_id));
      console.log('Profile IDs from working hours:', profileIdsFromWorkingHours.size);

      // Filter profiles that have working hours and unpaid hours
      let eligibleProfiles = profiles.filter(profile => {
        if (!profileIdsFromWorkingHours.has(profile.id)) {
          return false;
        }

        const profileHours = typedWorkingHours.filter(wh => 
          wh.profile_id === profile.id
        );

        if (profileHours.length === 0) {
          return false;
        }

        // Check if any of these hours are NOT already paid (exist in a paid payroll)
        const hasUnpaidHours = profileHours.some(wh => {
          const isPaid = existingPayrolls.some(payroll => 
            payroll.profile_id === profile.id &&
            payroll.status === 'paid' &&
            wh.date >= payroll.pay_period_start &&
            wh.date <= payroll.pay_period_end
          );
          return !isPaid;
        });

        return hasUnpaidHours;
      });

      console.log('Profiles with unpaid hours:', eligibleProfiles.length);
      setFilteredProfiles(eligibleProfiles);

      // Clear selected profiles if they're no longer eligible
      setSelectedProfileIds(prev => 
        prev.filter(id => eligibleProfiles.some(p => p.id === id))
      );

    } catch (error) {
      console.error('Error reloading filtered data:', error);
      toast({
        title: "Error",
        description: "Failed to reload data with current filters",
        variant: "destructive"
      });
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .is('profile_id', null)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBankAccounts(data as BankAccount[]);
      
      const primary = data.find(acc => acc.is_primary);
      if (primary) setSelectedBankAccount(primary.id);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchExistingPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*');

      if (error) throw error;
      setExistingPayrolls(data as Payroll[]);
    } catch (error) {
      console.error('Error fetching existing payrolls:', error);
    }
  };

  const checkForOverlappingPayrolls = () => {
    const overlapping: string[] = [];

    selectedProfileIds.forEach(profileId => {
      const hasOverlap = existingPayrolls.some(payroll => 
        payroll.profile_id === profileId &&
        (
          (dateRange.start >= payroll.pay_period_start && dateRange.start <= payroll.pay_period_end) ||
          (dateRange.end >= payroll.pay_period_start && dateRange.end <= payroll.pay_period_end) ||
          (dateRange.start <= payroll.pay_period_start && dateRange.end >= payroll.pay_period_end)
        )
      );

      if (hasOverlap) {
        overlapping.push(profileId);
      }
    });

    setOverlappingPayrolls(overlapping);
  };

  const generatePayrollPreview = async () => {
    try {
      setLoading(true);
      const preview: any[] = [];

      for (const profileId of selectedProfileIds) {
        const profile = filteredProfiles.find(p => p.id === profileId);
        if (!profile) continue;

        // Get working hours for this profile in date range, excluding already paid ones
        const profileHours = filteredWorkingHours.filter(wh => 
          wh.profile_id === profileId
        );

        // Filter out hours that are already covered by paid payrolls
        const unpaidHours = profileHours.filter(wh => {
          const isPaid = existingPayrolls.some(payroll => 
            payroll.profile_id === profileId &&
            payroll.status === 'paid' &&
            wh.date >= payroll.pay_period_start &&
            wh.date <= payroll.pay_period_end
          );
          return !isPaid;
        });

        const totalHours = unpaidHours.reduce((sum, wh) => sum + wh.total_hours, 0);
        const overtimeHours = unpaidHours.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0);
        const regularHours = totalHours - overtimeHours;
        
        // Use the working hours rate instead of profile rate
        const workingHoursRate = unpaidHours.length > 0 ? unpaidHours[0].hourly_rate || 0 : profile.hourly_rate || 0;
        const regularPay = regularHours * workingHoursRate;
        const overtimePay = overtimeHours * workingHoursRate * 1.5;
        const grossPay = regularPay + overtimePay;
        
        const deductions = grossPay * 0.1;
        const netPay = grossPay - deductions;

        if (totalHours > 0) {
          preview.push({
            profile,
            totalHours,
            regularHours,
            overtimeHours,
            hourlyRate: workingHoursRate,
            regularPay,
            overtimePay,
            grossPay,
            deductions,
            netPay,
            workingHours: unpaidHours
          });
        }
      }

      setPayrollPreview(preview);
    } catch (error) {
      console.error('Error generating payroll preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    if (overlappingPayrolls.length > 0) {
      toast({
        title: "Cannot Generate Payroll",
        description: "Some profiles have overlapping payroll periods. Please resolve conflicts first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const payrollRecords = [];

      for (const preview of payrollPreview) {
        const payrollData = {
          profile_id: preview.profile.id,
          pay_period_start: dateRange.start,
          pay_period_end: dateRange.end,
          total_hours: preview.totalHours,
          hourly_rate: preview.hourlyRate,
          gross_pay: preview.grossPay,
          deductions: preview.deductions,
          net_pay: preview.netPay,
          status: 'pending' as const,
          bank_account_id: selectedBankAccount || null
        };

        payrollRecords.push(payrollData);
      }

      const { data: createdPayrolls, error } = await supabase
        .from('payroll')
        .insert(payrollRecords)
        .select('*');

      if (error) throw error;

      if (createdPayrolls) {
        const notifications = createdPayrolls.map(payroll => ({
          title: 'New Payroll Created',
          message: `Your payroll for period ${payroll.pay_period_start} to ${payroll.pay_period_end} has been created. Net amount: $${payroll.net_pay.toFixed(2)}`,
          type: 'payroll_created',
          recipient_profile_id: payroll.profile_id,
          related_id: payroll.id,
          action_type: 'none' as const,
          priority: 'medium' as const
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Failed to send notifications:', notificationError);
        }
      }

      toast({
        title: "Success",
        description: `Generated ${payrollRecords.length} payroll records successfully`
      });

      setSelectedProfileIds([]);
      setStep(1);
      setPayrollPreview([]);
      setOverlappingPayrolls([]);
      onRefresh();
    } catch (error: any) {
      console.error('Error generating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to generate payroll records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPreviewAmount = payrollPreview.reduce((sum, p) => sum + p.netPay, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payroll Generation Wizard - Step {step} of 3
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Step 1: Select Profiles & Configure Pay Period</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                        <Calculator className="h-4 w-4" />
                        Showing employees with unpaid approved working hours for selected period
                        {filterLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                      </div>
                    </div>
                    <EnhancedProfileSelector
                      profiles={filteredProfiles}
                      workingHours={filteredWorkingHours}
                      selectedProfileIds={selectedProfileIds}
                      onProfileSelect={setSelectedProfileIds}
                      mode="multiple"
                      label="Select Team Members for Payroll"
                      showStats={true}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-medium text-gray-700">Pay Period Settings</h4>
                      
                      <div>
                        <Label>Pay Period Start</Label>
                        <Input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Pay Period End</Label>
                        <Input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label>Bank Account</Label>
                        <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.bank_name} - {account.account_number}
                                {account.is_primary && ' (Primary)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={reloadFilteredData} 
                      variant="outline" 
                      className="w-full"
                      disabled={filterLoading}
                    >
                      {filterLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Eligible Profiles</div>
                      <div className="font-bold text-blue-600">{filteredProfiles.length}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Approved Hours</div>
                      <div className="font-bold text-green-600">
                        {filteredWorkingHours.reduce((sum, wh) => sum + wh.total_hours, 0).toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Date Range</div>
                      <div className="font-bold">{dateRange.start} to {dateRange.end}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="font-bold text-green-600">Approved Only</div>
                    </div>
                  </div>
                </div>

                {overlappingPayrolls.length > 0 && (
                  <div className="mt-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Overlapping Payroll Periods Detected</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      The following employees already have payroll records for overlapping periods:
                    </p>
                    <ul className="text-sm text-orange-700 mt-1">
                      {overlappingPayrolls.map(profileId => {
                        const profile = filteredProfiles.find(p => p.id === profileId);
                        return <li key={profileId}>• {profile?.full_name}</li>;
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={selectedProfileIds.length === 0 || !dateRange.start || !dateRange.end || payrollPreview.length === 0 || overlappingPayrolls.length > 0}
                >
                  Next: Review Payroll ({payrollPreview.length} employees)
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Step 2: Review Payroll Calculations</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">${totalPreviewAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Net Pay</div>
                </div>
              </div>

              {payrollPreview.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No unpaid working hours found for the selected period and profiles.</p>
                  <p className="text-sm">Please ensure working hours are approved and not already paid.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollPreview.map((preview) => (
                          <tr key={preview.profile.id} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{preview.profile.full_name}</div>
                                <div className="text-sm text-gray-600">{preview.profile.role}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                <div>Regular: {preview.regularHours.toFixed(1)}h</div>
                                {preview.overtimeHours > 0 && (
                                  <div className="text-orange-600">Overtime: {preview.overtimeHours.toFixed(1)}h</div>
                                )}
                                <div className="font-medium">Total: {preview.totalHours.toFixed(1)}h</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">${preview.hourlyRate.toFixed(2)}/hr</td>
                            <td className="py-3 px-4">${preview.grossPay.toFixed(2)}</td>
                            <td className="py-3 px-4 text-red-600">${preview.deductions.toFixed(2)}</td>
                            <td className="py-3 px-4 font-bold text-green-600">${preview.netPay.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Collapsible Working Hours Details */}
                  <Collapsible open={isWorkingHoursOpen} onOpenChange={setIsWorkingHoursOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>View Working Hours Details</span>
                        {isWorkingHoursOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                      {payrollPreview.map((preview) => (
                        <Card key={preview.profile.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{preview.profile.full_name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2">Client</th>
                                    <th className="text-left py-2">Project</th>
                                    <th className="text-left py-2">Hours</th>
                                    <th className="text-left py-2">Rate</th>
                                    <th className="text-left py-2">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {preview.workingHours.map((wh: any) => (
                                    <tr key={wh.id} className="border-b border-gray-100">
                                      <td className="py-2">{new Date(wh.date).toLocaleDateString()}</td>
                                      <td className="py-2">{wh.clients?.company || 'N/A'}</td>
                                      <td className="py-2">{wh.projects?.name || 'N/A'}</td>
                                      <td className="py-2">{wh.total_hours}h</td>
                                      <td className="py-2">${wh.hourly_rate}/hr</td>
                                      <td className="py-2">${(wh.total_hours * wh.hourly_rate).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back: Edit Selection
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={payrollPreview.length === 0}
                >
                  Next: Confirm & Generate
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Step 3: Confirm & Generate Payroll</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Payroll Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Employees</div>
                    <div className="font-bold">{payrollPreview.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Hours</div>
                    <div className="font-bold">{payrollPreview.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Gross Pay</div>
                    <div className="font-bold">${payrollPreview.reduce((sum, p) => sum + p.grossPay, 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Net Pay</div>
                    <div className="font-bold text-green-600">${totalPreviewAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back: Review Details
                </Button>
                <Button onClick={generatePayroll} disabled={loading || payrollPreview.length === 0}>
                  {loading ? "Generating..." : "Generate Payroll Records"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
