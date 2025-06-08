
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Payroll, WorkingHour } from "@/types/database";

interface PayrollEditDialogProps {
  payroll: Payroll | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const PayrollEditDialog = ({ payroll, isOpen, onClose, onUpdate }: PayrollEditDialogProps) => {
  const [formData, setFormData] = useState({
    pay_period_start: "",
    pay_period_end: "",
    total_hours: 0,
    hourly_rate: 0,
    gross_pay: 0,
    deductions: 0,
    net_pay: 0,
    status: "pending" as "pending" | "approved" | "paid"
  });
  const [loading, setLoading] = useState(false);
  const [linkedWorkingHours, setLinkedWorkingHours] = useState<WorkingHour[]>([]);
  const { toast } = useToast();

  useEffect(() => {
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
      fetchLinkedWorkingHours();
    }
  }, [payroll]);

  const fetchLinkedWorkingHours = async () => {
    if (!payroll) return;

    try {
      const { data, error } = await supabase
        .from('payroll_working_hours')
        .select(`
          *,
          working_hours:working_hours_id (
            *,
            clients:client_id (id, name, company),
            projects:project_id (id, name)
          )
        `)
        .eq('payroll_id', payroll.id);

      if (error) throw error;

      // Transform the data to match WorkingHour type
      const workingHours = data?.map(item => ({
        ...item.working_hours,
        clients: item.working_hours?.clients,
        projects: item.working_hours?.projects
      })).filter(Boolean) as WorkingHour[];

      setLinkedWorkingHours(workingHours || []);
    } catch (error) {
      console.error('Error fetching linked working hours:', error);
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
          total_hours: formData.total_hours,
          hourly_rate: formData.hourly_rate,
          gross_pay: formData.gross_pay,
          deductions: formData.deductions,
          net_pay: formData.net_pay,
          status: formData.status
        })
        .eq('id', payroll.id);

      if (error) throw error;

      toast({ title: "Success", description: "Payroll record updated successfully" });
      onUpdate();
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

  const calculatePayroll = (hours: number, rate: number, deductions: number) => {
    const gross = hours * rate;
    const net = gross - deductions;
    setFormData(prev => ({
      ...prev,
      gross_pay: gross,
      net_pay: net
    }));
  };

  useEffect(() => {
    calculatePayroll(formData.total_hours, formData.hourly_rate, formData.deductions);
  }, [formData.total_hours, formData.hourly_rate, formData.deductions]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Payroll Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {linkedWorkingHours.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Linked Working Hours</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {linkedWorkingHours.map((wh) => (
                  <div key={wh.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
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
          )}

          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between text-sm">
              <span>Gross Pay:</span>
              <span>${formData.gross_pay.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Deductions:</span>
              <span>-${formData.deductions.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Net Pay:</span>
              <span>${formData.net_pay.toFixed(2)}</span>
            </div>
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
