
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, ChevronDown, ChevronUp, Zap, AlertTriangle, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, WorkingHour } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";

interface PayrollQuickGenerateProps {
  profiles: Profile[];
  profilesWithHours: Profile[];
  workingHours: WorkingHour[];
  onRefresh: () => void;
  preSelectedProfile?: Profile;
  isInDialog?: boolean;
}

interface WorkingHourWithLinkStatus extends WorkingHour {
  isLinkedToPayroll?: boolean;
  linkedPayrollId?: string;
}

export const PayrollQuickGenerate = ({ 
  profiles, 
  profilesWithHours, 
  workingHours, 
  onRefresh,
  preSelectedProfile,
  isInDialog = false
}: PayrollQuickGenerateProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWorkingHoursPreviewOpen, setIsWorkingHoursPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const [previewWorkingHours, setPreviewWorkingHours] = useState<WorkingHourWithLinkStatus[]>([]);

  // Auto-fill form when preSelectedProfile is provided
  useEffect(() => {
    if (preSelectedProfile && isDialogOpen) {
      const profileWorkingHours = workingHours.filter(wh => wh.profile_id === preSelectedProfile.id);
      
      if (profileWorkingHours.length > 0) {
        // Get date range
        const dates = profileWorkingHours.map(wh => new Date(wh.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0]?.toISOString().split('T')[0];
        const endDate = dates[dates.length - 1]?.toISOString().split('T')[0];
        
        // Calculate totals
        const totalHours = profileWorkingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
        const avgHourlyRate = profileWorkingHours.length > 0 
          ? profileWorkingHours.reduce((sum, wh) => sum + (wh.hourly_rate || 0), 0) / profileWorkingHours.length
          : preSelectedProfile.hourly_rate || 0;

        setFormData({
          profile_id: preSelectedProfile.id,
          pay_period_start: startDate || "",
          pay_period_end: endDate || "",
          total_hours: totalHours,
          hourly_rate: avgHourlyRate,
          gross_pay: 0,
          deductions: 0,
          net_pay: 0,
          status: "pending"
        });
        
        checkWorkingHoursLinkStatus(profileWorkingHours);
        setIsWorkingHoursPreviewOpen(true);
      }
    }
  }, [preSelectedProfile, isDialogOpen, workingHours]);

  const checkWorkingHoursLinkStatus = async (hoursToCheck: WorkingHour[]) => {
    try {
      const workingHourIds = hoursToCheck.map(wh => wh.id);
      
      const { data: linkedHours, error } = await supabase
        .from('payroll_working_hours')
        .select('working_hours_id, payroll_id')
        .in('working_hours_id', workingHourIds);

      if (error) throw error;

      const linkedMap = new Map(linkedHours?.map(link => [link.working_hours_id, link.payroll_id]) || []);

      const hoursWithStatus: WorkingHourWithLinkStatus[] = hoursToCheck.map(wh => ({
        ...wh,
        isLinkedToPayroll: linkedMap.has(wh.id),
        linkedPayrollId: linkedMap.get(wh.id)
      }));

      setPreviewWorkingHours(hoursWithStatus);
    } catch (error) {
      console.error('Error checking working hours link status:', error);
      setPreviewWorkingHours(hoursToCheck);
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
      toast({ title: "Success", description: "Payroll record created successfully. Working hours have been automatically linked." });
      
      if (!isInDialog) {
        setIsDialogOpen(false);
      }
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
      onRefresh();
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

  useEffect(() => {
    if (formData.profile_id && formData.pay_period_start && formData.pay_period_end && !preSelectedProfile) {
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
      
      checkWorkingHoursLinkStatus(profileWorkingHours);
    }
  }, [formData.profile_id, formData.pay_period_start, formData.pay_period_end, workingHours, preSelectedProfile]);

  const buttonText = preSelectedProfile ? "Quick Generate" : "Create Payroll";
  const buttonIcon = preSelectedProfile ? <Zap className="h-4 w-4" /> : <Plus className="h-4 w-4" />;

  const availableHours = previewWorkingHours.filter(wh => !wh.isLinkedToPayroll);
  const linkedHours = previewWorkingHours.filter(wh => wh.isLinkedToPayroll);

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!preSelectedProfile && (
        <ProfileSelector
          profiles={profiles}
          selectedProfileId={formData.profile_id}
          onProfileSelect={(profileId) => setFormData({ ...formData, profile_id: profileId })}
          label="Select Profile"
          placeholder="Choose an employee"
          showRoleFilter={true}
        />
      )}

      {preSelectedProfile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="font-medium text-white">
                {preSelectedProfile.full_name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">{preSelectedProfile.full_name}</h3>
              <p className="text-sm text-blue-700">{preSelectedProfile.role}</p>
            </div>
          </div>
        </div>
      )}

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
                Working Hours Preview ({availableHours.length} available, {linkedHours.length} already linked)
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
                  <div key={wh.id} className={`flex justify-between items-center text-sm p-2 rounded ${
                    wh.isLinkedToPayroll 
                      ? 'bg-orange-50 border border-orange-200' 
                      : 'bg-gray-50'
                  }`}>
                    <div>
                      <span className="font-medium">{new Date(wh.date).toLocaleDateString()}</span>
                      <span className="text-gray-600 ml-2">
                        {wh.clients?.company || 'N/A'} - {wh.projects?.name || 'N/A'}
                      </span>
                      {wh.isLinkedToPayroll && (
                        <div className="text-xs text-orange-700 flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          Already linked to another payroll
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div>{wh.total_hours}h × ${wh.hourly_rate}/hr</div>
                      <div className="font-medium">${(wh.total_hours * (wh.hourly_rate || 0)).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {linkedHours.length > 0 && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <div className="flex items-center gap-1 text-orange-700 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Warning: {linkedHours.length} working hour(s) already linked to other payrolls
                  </div>
                  <p className="text-orange-600 mt-1">
                    Only {availableHours.length} working hour(s) will be linked to this new payroll.
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating..." : buttonText}
      </Button>
    </form>
  );

  // If used within a dialog, just return the form content
  if (isInDialog) {
    return formContent;
  }

  // Otherwise, return the dialog wrapper
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant={preSelectedProfile ? "default" : "outline"}>
          {buttonIcon}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {preSelectedProfile ? `Quick Generate Payroll - ${preSelectedProfile.full_name}` : "Create Payroll Record"}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
