
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Payroll as PayrollType } from "@/types/database";

interface PayrollEditDialogProps {
  payroll: PayrollType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayrollEditDialog = ({ payroll, isOpen, onClose, onSuccess }: PayrollEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pay_period_start: payroll?.pay_period_start || "",
    pay_period_end: payroll?.pay_period_end || "",
    total_hours: payroll?.total_hours || 0,
    hourly_rate: payroll?.hourly_rate || 0,
    gross_pay: payroll?.gross_pay || 0,
    deductions: payroll?.deductions || 0,
    net_pay: payroll?.net_pay || 0,
    status: payroll?.status || 'pending'
  });
  const { toast } = useToast();

  // Update form data when payroll changes
  useState(() => {
    if (payroll) {
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
    }
  });

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Payroll Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
