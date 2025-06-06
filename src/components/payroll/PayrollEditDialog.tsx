
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, ChevronDown, ChevronUp, Zap } from "lucide-react";
import type { Payroll as PayrollType, WorkingHour } from "@/types/database";

interface PayrollEditDialogProps {
  payroll: PayrollType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayrollEditDialog = ({ payroll, isOpen, onClose, onSuccess }: PayrollEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isWorkingHoursPreviewOpen, setIsWorkingHoursPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    pay_period_start: "",
    pay_period_end: "",
    total_hours: 0,
    hourly_rate: 0,
    gross_pay: 0,
    deductions: 0,
    net_pay: 0,
    status: 'pending' as 'pending' | 'approved' | 'paid'
  });
  const { toast } = useToast();

  // Populate form data when payroll changes
  useEffect(() => {
    if (payroll && isOpen) {
      setFormData({
        pay_period_start: payroll.pay_period_start,
        pay_period_end: payroll.pay_period_end,
        total_hours: payroll.total_hours,
        hourly_rate: payroll.hourly_rate,
        gross_pay: payroll.gross_pay,
        deductions: payroll.deductions,
        net_pay: payroll.net_pay,
        status: payroll.status
      });
      
      // Fetch working hours for this payroll period
      fetchWorkingHours();
    }
  }, [payroll, isOpen]);

  const fetchWorkingHours = async () => {
    if (!payroll) return;
    
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          clients!working_hours_client_id_fkey (id, name, company, email, status, created_at, updated_at),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .eq('profile_id', payroll.profile_id)
        .gte('date', payroll.pay_period_start)
        .lte('date', payroll.pay_period_end)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkingHours((data || []) as WorkingHour[]);
      setIsWorkingHoursPreviewOpen(data && data.length > 0);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate gross pay and net pay when relevant fields change
      if (field === 'total_hours' || field === 'hourly_rate') {
        const totalHours = field === 'total_hours' ? Number(value) : updated.total_hours;
        const hourlyRate = field === 'hourly_rate' ? Number(value) : updated.hourly_rate;
        updated.gross_pay = totalHours * hourlyRate;
        updated.net_pay = updated.gross_pay - updated.deductions;
      }
      
      if (field === 'deductions') {
        updated.net_pay = updated.gross_pay - Number(value);
      }
      
      if (field === 'gross_pay') {
        updated.net_pay = Number(value) - updated.deductions;
      }
      
      return updated;
    });
  };

  const recalculateFromWorkingHours = () => {
    if (workingHours.length > 0) {
      const totalHours = workingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
      const avgHourlyRate = workingHours.reduce((sum, wh) => sum + (wh.hourly_rate || 0), 0) / workingHours.length;
      const grossPay = totalHours * avgHourlyRate;
      
      setFormData(prev => ({
        ...prev,
        total_hours: totalHours,
        hourly_rate: avgHourlyRate,
        gross_pay: grossPay,
        net_pay: grossPay - prev.deductions
      }));

      toast({
        title: "Recalculated",
        description: "Payroll has been recalculated based on approved working hours"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payroll) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          total_hours: Number(formData.total_hours),
          hourly_rate: Number(formData.hourly_rate),
          gross_pay: Number(formData.gross_pay),
          deductions: Number(formData.deductions),
          net_pay: Number(formData.net_pay),
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', payroll.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll record updated successfully"
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payroll Record - {payroll.profiles?.full_name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="font-medium text-white">
                  {payroll.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-blue-900">{payroll.profiles?.full_name}</h3>
                <p className="text-sm text-blue-700">{payroll.profiles?.role}</p>
              </div>
            </div>
            {workingHours.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={recalculateFromWorkingHours}
                className="w-full flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Recalculate from Working Hours ({workingHours.length} entries)
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pay_period_start">Pay Period Start</Label>
              <Input
                id="pay_period_start"
                type="date"
                value={formData.pay_period_start}
                onChange={(e) => handleInputChange('pay_period_start', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pay_period_end">Pay Period End</Label>
              <Input
                id="pay_period_end"
                type="date"
                value={formData.pay_period_end}
                onChange={(e) => handleInputChange('pay_period_end', e.target.value)}
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
                step="0.01"
                value={formData.total_hours}
                onChange={(e) => handleInputChange('total_hours', e.target.value)}
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
                onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gross_pay">Gross Pay</Label>
              <Input
                id="gross_pay"
                type="number"
                step="0.01"
                value={formData.gross_pay}
                onChange={(e) => handleInputChange('gross_pay', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="deductions">Deductions</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => handleInputChange('deductions', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="net_pay">Net Pay</Label>
              <Input
                id="net_pay"
                type="number"
                step="0.01"
                value={formData.net_pay}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </div>

          {/* Real-time calculation preview */}
          {formData.total_hours > 0 && formData.hourly_rate > 0 && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex justify-between text-sm">
                <span>Calculated Gross Pay:</span>
                <span>${(formData.total_hours * formData.hourly_rate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Deductions:</span>
                <span>-${formData.deductions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Calculated Net Pay:</span>
                <span>${(formData.total_hours * formData.hourly_rate - formData.deductions).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'pending' | 'approved' | 'paid') => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                {payroll.status === 'paid' && <SelectItem value="paid">Paid</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {workingHours.length > 0 && (
            <Collapsible open={isWorkingHoursPreviewOpen} onOpenChange={setIsWorkingHoursPreviewOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Working Hours Preview ({workingHours.length} entries)
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
                    {workingHours.map((wh) => (
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Payroll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
