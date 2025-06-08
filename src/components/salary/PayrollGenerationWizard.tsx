import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Profile, WorkingHour, Payroll } from "@/types/database";
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
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [payrollPreview, setPayrollPreview] = useState<any[]>([]);
  const [existingPayrolls, setExistingPayrolls] = useState<Payroll[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [filteredWorkingHours, setFilteredWorkingHours] = useState<WorkingHour[]>([]);
  const [overlappingPayrolls, setOverlappingPayrolls] = useState<string[]>([]);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [linkedWorkingHoursIds, setLinkedWorkingHoursIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchExistingPayrolls();
    fetchLinkedWorkingHours();
  }, []);

  useEffect(() => {
    reloadFilteredData();
  }, [dateRange, linkedWorkingHoursIds]);

  useEffect(() => {
    if (selectedProfileIds.length > 0 && dateRange.start && dateRange.end) {
      generatePayrollPreview();
      checkForOverlappingPayrolls();
    } else {
      setPayrollPreview([]);
      setOverlappingPayrolls([]);
    }
  }, [selectedProfileIds, filteredWorkingHours, existingPayrolls]);

  const fetchLinkedWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_working_hours')
        .select('working_hours_id');

      if (error) throw error;

      const linkedIds = new Set(data?.map(link => link.working_hours_id) || []);
      setLinkedWorkingHoursIds(linkedIds);
    } catch (error) {
      console.error('Error fetching linked working hours:', error);
    }
  };

  const reloadFilteredData = async () => {
    try {
      setFilterLoading(true);
      
      console.log('Reloading filtered data with:', { dateRange, linkedWorkingHoursCount: linkedWorkingHoursIds.size });
      
      // Fetch only approved working hours based on date range that are NOT already linked to payroll
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
      console.log('Linked working hours to filter out:', linkedWorkingHoursIds.size);

      // Filter out working hours that are already linked to existing payroll records
      const availableWorkingHours = (workingHoursData || []).filter(wh => 
        !linkedWorkingHoursIds.has(wh.id)
      ).map(wh => ({
        ...wh,
        status: wh.status as 'approved'
      })) as WorkingHour[];

      console.log('Available working hours after filtering:', availableWorkingHours.length);

      setFilteredWorkingHours(availableWorkingHours);

      // Get unique profile IDs from available working hours only
      const profileIdsFromWorkingHours = new Set(availableWorkingHours.map(wh => wh.profile_id));
      console.log('Profile IDs from available working hours:', profileIdsFromWorkingHours.size);

      // Filter profiles that have available (non-linked) approved working hours in the date range
      let eligibleProfiles = profiles.filter(profile => {
        return profileIdsFromWorkingHours.has(profile.id);
      });

      console.log('Profiles with available working hours:', eligibleProfiles.length);
      setFilteredProfiles(eligibleProfiles);

      // Maintain selected profiles if they're still eligible
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

        // Get working hours for this profile in date range (only available ones)
        const profileHours = filteredWorkingHours.filter(wh => 
          wh.profile_id === profileId
        );

        const totalHours = profileHours.reduce((sum, wh) => sum + wh.total_hours, 0);
        const overtimeHours = profileHours.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0);
        const regularHours = totalHours - overtimeHours;
        
        // Calculate average hourly rate from working hours
        const totalPayableAmount = profileHours.reduce((sum, wh) => sum + (wh.hourly_rate || 0) * wh.total_hours, 0);
        const averageRate = totalHours > 0 ? totalPayableAmount / totalHours : 0;
        
        const regularPay = regularHours * averageRate;
        const overtimePay = overtimeHours * averageRate * 1.5;
        const grossPay = regularPay + overtimePay;
        
        const deductions = grossPay * 0.1;
        const netPay = grossPay - deductions;

        if (totalHours > 0) {
          preview.push({
            profile,
            totalHours,
            regularHours,
            overtimeHours,
            hourlyRate: averageRate,
            regularPay,
            overtimePay,
            grossPay,
            deductions,
            netPay,
            workingHours: profileHours
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

  const handleNextStep = () => {
    if (overlappingPayrolls.length > 0) {
      setShowConfirmDialog(true);
    } else {
      setStep(2);
    }
  };

  const confirmProceedWithOverlaps = () => {
    setShowConfirmDialog(false);
    setStep(2);
  };

  const generatePayroll = async () => {
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
          bank_account_id: null
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
        description: `Generated ${payrollRecords.length} payroll records successfully. Working hours have been automatically linked.`
      });

      // Refresh linked working hours after successful payroll generation
      await fetchLinkedWorkingHours();
      
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
  const totalEmployees = payrollPreview.length;
  const totalHoursSum = payrollPreview.reduce((sum, p) => sum + p.totalHours, 0);
  const totalGrossPay = payrollPreview.reduce((sum, p) => sum + p.grossPay, 0);

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Payroll Generation Wizard - Step {step} of 2</span>
            <span className="sm:hidden">Payroll - Step {step}/2</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  <span className="hidden sm:inline">Step 1: Select Profiles & Configure Pay Period</span>
                  <span className="sm:hidden">Select Profiles & Period</span>
                </h3>
                
                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
                  <div className="lg:col-span-2">
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 mb-2">
                        <Calculator className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="hidden sm:inline">Showing employees with available working hours (not linked to existing payroll)</span>
                        <span className="sm:hidden">Available hours only</span>
                        {filterLoading && <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />}
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
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
                      <h4 className="font-medium text-gray-700 text-sm sm:text-base">Pay Period Settings</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs sm:text-sm">Pay Period Start</Label>
                          <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs sm:text-sm">Pay Period End</Label>
                          <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={reloadFilteredData} 
                      variant="outline" 
                      className="w-full text-xs sm:text-sm"
                      disabled={filterLoading}
                      size="sm"
                    >
                      {filterLoading ? (
                        <>
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Refreshing...</span>
                          <span className="sm:hidden">Loading...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Refresh Data</span>
                          <span className="sm:hidden">Refresh</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Mobile-friendly stats grid */}
                <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="text-center sm:text-left">
                      <div className="text-gray-600 mb-1">Available</div>
                      <div className="font-bold text-blue-600">{filteredProfiles.length}</div>
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="text-gray-600 mb-1">Hours</div>
                      <div className="font-bold text-green-600">
                        {filteredWorkingHours.reduce((sum, wh) => sum + wh.total_hours, 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center sm:text-left col-span-2 sm:col-span-1">
                      <div className="text-gray-600 mb-1">Period</div>
                      <div className="font-bold text-xs">{dateRange.start} to {dateRange.end}</div>
                    </div>
                    <div className="text-center sm:text-left col-span-2 sm:col-span-1">
                      <div className="text-gray-600 mb-1">Status</div>
                      <div className="font-bold text-green-600">Available</div>
                    </div>
                  </div>
                </div>

                {overlappingPayrolls.length > 0 && (
                  <div className="mt-4 p-3 sm:p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Overlapping Payroll Detected</span>
                    </div>
                    <p className="text-xs sm:text-sm text-orange-700 mb-2">
                      Employees with overlapping periods:
                    </p>
                    <ul className="text-xs sm:text-sm text-orange-700 mb-2 space-y-1">
                      {overlappingPayrolls.map(profileId => {
                        const profile = filteredProfiles.find(p => p.id === profileId);
                        return <li key={profileId}>• {profile?.full_name}</li>;
                      })}
                    </ul>
                    <p className="text-xs sm:text-sm text-orange-700 font-medium">
                      You can proceed but this may create duplicates.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      onClick={handleNextStep}
                      disabled={selectedProfileIds.length === 0 || !dateRange.start || !dateRange.end || payrollPreview.length === 0}
                      className="w-full sm:w-auto text-sm"
                      size="sm"
                    >
                      <span className="hidden sm:inline">Next: Review Payroll ({payrollPreview.length} employees)</span>
                      <span className="sm:hidden">Review ({payrollPreview.length})</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Existing Payroll Records Found
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Some selected employees already have payroll records for overlapping periods:
                        <ul className="mt-2 space-y-1">
                          {overlappingPayrolls.map(profileId => {
                            const profile = filteredProfiles.find(p => p.id === profileId);
                            return (
                              <li key={profileId} className="text-sm font-medium">
                                • {profile?.full_name}
                              </li>
                            );
                          })}
                        </ul>
                        <p className="mt-3 font-medium">
                          Do you want to proceed? This may create duplicate payroll records for the overlapping periods.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmProceedWithOverlaps}>
                        Proceed Anyway
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">
                  <span className="hidden sm:inline">Step 2: Review Payroll Calculations</span>
                  <span className="sm:hidden">Review Calculations</span>
                </h3>
              </div>

              {/* Mobile-friendly Summary Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{totalEmployees}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Employees</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-purple-600">{totalHoursSum.toFixed(1)}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Hours</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-orange-600">${totalGrossPay.toFixed(2)}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Gross</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-green-600">${totalPreviewAmount.toFixed(2)}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Net</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {payrollPreview.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm sm:text-base">No available working hours found for the selected period and profiles.</p>
                </div>
              ) : (
                <>
                  {/* Desktop table view */}
                  <div className="hidden lg:block max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Rate</th>
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

                  {/* Mobile card view */}
                  <div className="lg:hidden space-y-3 max-h-96 overflow-y-auto">
                    {payrollPreview.map((preview) => (
                      <Card key={preview.profile.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-3">
                            {/* Header */}
                            <div>
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900">
                                {preview.profile.full_name}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600">{preview.profile.role}</p>
                            </div>

                            {/* Hours breakdown */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="text-blue-600 font-medium">Regular</div>
                                <div className="font-semibold text-blue-700">{preview.regularHours.toFixed(1)}h</div>
                              </div>
                              {preview.overtimeHours > 0 && (
                                <div className="text-center p-2 bg-orange-50 rounded">
                                  <div className="text-orange-600 font-medium">Overtime</div>
                                  <div className="font-semibold text-orange-700">{preview.overtimeHours.toFixed(1)}h</div>
                                </div>
                              )}
                              <div className="text-center p-2 bg-purple-50 rounded">
                                <div className="text-purple-600 font-medium">Total</div>
                                <div className="font-semibold text-purple-700">{preview.totalHours.toFixed(1)}h</div>
                              </div>
                            </div>

                            {/* Financial details */}
                            <div className="grid grid-cols-4 gap-2 text-xs pt-2 border-t">
                              <div className="text-center">
                                <div className="text-gray-600">Rate</div>
                                <div className="font-semibold">${preview.hourlyRate.toFixed(2)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-600">Gross</div>
                                <div className="font-semibold text-purple-700">${preview.grossPay.toFixed(2)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-600">Deduct</div>
                                <div className="font-semibold text-red-600">${preview.deductions.toFixed(2)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-600">Net</div>
                                <div className="font-semibold text-green-600">${preview.netPay.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Collapsible Working Hours Details */}
                  <Collapsible open={isWorkingHoursOpen} onOpenChange={setIsWorkingHoursOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm" size="sm">
                        <span>View Working Hours Details</span>
                        {isWorkingHoursOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 sm:space-y-4 mt-4">
                      {payrollPreview.map((preview) => (
                        <Card key={preview.profile.id}>
                          <CardHeader className="pb-2 sm:pb-3">
                            <CardTitle className="text-sm sm:text-base">{preview.profile.full_name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs sm:text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2 hidden sm:table-cell">Client</th>
                                    <th className="text-left py-2 hidden sm:table-cell">Project</th>
                                    <th className="text-left py-2">Hours</th>
                                    <th className="text-left py-2">Rate</th>
                                    <th className="text-left py-2">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {preview.workingHours.map((wh: any) => (
                                    <tr key={wh.id} className="border-b border-gray-100">
                                      <td className="py-2">{new Date(wh.date).toLocaleDateString()}</td>
                                      <td className="py-2 hidden sm:table-cell">{wh.clients?.company || 'N/A'}</td>
                                      <td className="py-2 hidden sm:table-cell">{wh.projects?.name || 'N/A'}</td>
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

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(1)} className="text-sm" size="sm">
                  <span className="hidden sm:inline">Back: Edit Selection</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <Button 
                  onClick={generatePayroll}
                  disabled={loading || payrollPreview.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-sm"
                  size="sm"
                >
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {loading ? "Generating..." : (
                    <>
                      <span className="hidden sm:inline">Generate Payroll Records</span>
                      <span className="sm:hidden">Generate ({payrollPreview.length})</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
