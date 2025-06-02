
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Zap, Users, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BulkPayroll, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface BulkPayrollManagementProps {
  bulkPayrolls: BulkPayroll[];
  profiles: Profile[];
  onRefresh: () => void;
}

export const BulkPayrollManagement = ({ bulkPayrolls, profiles, onRefresh }: BulkPayrollManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pay_period_start: "",
    pay_period_end: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one employee",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create bulk payroll record
      const { data: bulkPayroll, error: bulkError } = await supabase
        .from('bulk_payroll')
        .insert([{
          name: formData.name,
          description: formData.description,
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          created_by: 'current-user-id', // Replace with actual user ID
          total_records: selectedProfiles.length
        }])
        .select()
        .single();

      if (bulkError) throw bulkError;

      // Create bulk payroll items
      const bulkItems = selectedProfiles.map(profileId => ({
        bulk_payroll_id: bulkPayroll.id,
        profile_id: profileId
      }));

      const { error: itemsError } = await supabase
        .from('bulk_payroll_items')
        .insert(bulkItems);

      if (itemsError) throw itemsError;

      toast({ title: "Success", description: "Bulk payroll created successfully" });
      setIsDialogOpen(false);
      setFormData({ name: "", description: "", pay_period_start: "", pay_period_end: "" });
      setSelectedProfiles([]);
      onRefresh();
    } catch (error: any) {
      console.error('Error creating bulk payroll:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create bulk payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processBulkPayroll = async (bulkPayrollId: string) => {
    setLoading(true);
    try {
      // Update status to processing
      await supabase
        .from('bulk_payroll')
        .update({ status: 'processing' })
        .eq('id', bulkPayrollId);

      // Get bulk payroll items
      const { data: items, error } = await supabase
        .from('bulk_payroll_items')
        .select('*, profiles(*)')
        .eq('bulk_payroll_id', bulkPayrollId);

      if (error) throw error;

      // Process each item (simplified logic)
      let processedCount = 0;
      for (const item of items) {
        try {
          // Calculate payroll for this profile
          // This is a simplified version - you'd want more sophisticated logic
          const hourlyRate = item.profiles?.hourly_rate || 0;
          const totalHours = 40; // Example: 40 hours per week
          const grossPay = totalHours * hourlyRate;
          const deductions = grossPay * 0.1;
          const netPay = grossPay - deductions;

          // Create individual payroll record
          const { data: payroll, error: payrollError } = await supabase
            .from('payroll')
            .insert([{
              profile_id: item.profile_id,
              pay_period_start: formData.pay_period_start,
              pay_period_end: formData.pay_period_end,
              total_hours: totalHours,
              hourly_rate: hourlyRate,
              gross_pay: grossPay,
              deductions: deductions,
              net_pay: netPay,
              status: 'pending'
            }])
            .select()
            .single();

          if (payrollError) throw payrollError;

          // Update bulk item
          await supabase
            .from('bulk_payroll_items')
            .update({ 
              status: 'processed',
              payroll_id: payroll.id 
            })
            .eq('id', item.id);

          processedCount++;
        } catch (itemError) {
          console.error('Error processing item:', itemError);
          await supabase
            .from('bulk_payroll_items')
            .update({ 
              status: 'failed',
              error_message: itemError.message 
            })
            .eq('id', item.id);
        }
      }

      // Update bulk payroll status
      await supabase
        .from('bulk_payroll')
        .update({ 
          status: 'completed',
          processed_records: processedCount 
        })
        .eq('id', bulkPayrollId);

      toast({ title: "Success", description: `Processed ${processedCount} payroll records` });
      onRefresh();
    } catch (error: any) {
      console.error('Error processing bulk payroll:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process bulk payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bulk Payroll Operations</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Bulk Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Bulk Payroll Batch</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Batch Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Weekly Payroll - Week 1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      rows={1}
                    />
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

                <div>
                  <Label>Select Employees *</Label>
                  <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {profiles.map((profile) => (
                        <label key={profile.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedProfiles.includes(profile.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProfiles([...selectedProfiles, profile.id]);
                              } else {
                                setSelectedProfiles(selectedProfiles.filter(id => id !== profile.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{profile.full_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Selected: {selectedProfiles.length} employees
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Bulk Payroll"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bulkPayrolls.map((bulk) => (
            <Card key={bulk.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Zap className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">{bulk.name}</h3>
                      <p className="text-sm text-gray-600">{bulk.description}</p>
                      <p className="text-xs text-gray-500">
                        Period: {new Date(bulk.pay_period_start).toLocaleDateString()} - {new Date(bulk.pay_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{bulk.processed_records}/{bulk.total_records}</span>
                      </div>
                      <div className="text-sm font-medium">${bulk.total_amount.toFixed(2)}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bulk.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : bulk.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : bulk.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bulk.status}
                      </span>
                    </div>
                    {bulk.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => processBulkPayroll(bulk.id)}
                        disabled={loading}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Process
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {bulkPayrolls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bulk payroll operations found</p>
              <p className="text-sm">Create a bulk operation to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
