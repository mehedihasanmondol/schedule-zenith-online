
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Zap, Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BulkPayroll, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EnhancedProfileSelector } from "./EnhancedProfileSelector";

interface BulkSalaryProcessorProps {
  bulkPayrolls: BulkPayroll[];
  profiles: Profile[];
  onRefresh: () => void;
}

export const BulkSalaryProcessor = ({ bulkPayrolls, profiles, onRefresh }: BulkSalaryProcessorProps) => {
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [bulkData, setBulkData] = useState({
    name: "",
    description: "",
    pay_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pay_period_end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const createBulkPayroll = async () => {
    if (selectedProfileIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one profile",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create bulk payroll record
      const { data: bulkPayrollData, error: bulkError } = await supabase
        .from('bulk_payroll')
        .insert([{
          name: bulkData.name,
          description: bulkData.description,
          pay_period_start: bulkData.pay_period_start,
          pay_period_end: bulkData.pay_period_end,
          created_by: 'system', // In real app, this would be the current user ID
          status: 'processing' as const,
          total_records: selectedProfileIds.length,
          processed_records: 0,
          total_amount: 0
        }])
        .select()
        .single();

      if (bulkError) throw bulkError;

      // Create bulk payroll items
      const bulkItems = selectedProfileIds.map(profileId => ({
        bulk_payroll_id: bulkPayrollData.id,
        profile_id: profileId,
        status: 'pending' as const
      }));

      const { error: itemsError } = await supabase
        .from('bulk_payroll_items')
        .insert(bulkItems);

      if (itemsError) throw itemsError;

      // Process payrolls one by one
      let processedCount = 0;
      let totalAmount = 0;

      for (const profileId of selectedProfileIds) {
        try {
          // Get working hours for this profile using the individual working hour rates
          const { data: workingHours } = await supabase
            .from('working_hours')
            .select('*, profiles(*)')
            .eq('profile_id', profileId)
            .eq('status', 'approved')
            .gte('date', bulkData.pay_period_start)
            .lte('date', bulkData.pay_period_end);

          const profile = profiles.find(p => p.id === profileId);
          if (!profile || !workingHours) continue;

          // Calculate using individual working hours rates instead of profile rate
          let totalHours = 0;
          let grossPay = 0;

          for (const wh of workingHours) {
            totalHours += wh.total_hours;
            // Use the hourly_rate from each working hour record
            grossPay += wh.total_hours * (wh.hourly_rate || 0);
          }

          const deductions = grossPay * 0.1; // 10% deductions
          const netPay = grossPay - deductions;

          // Create payroll record
          const { data: payrollData, error: payrollError } = await supabase
            .from('payroll')
            .insert([{
              profile_id: profileId,
              pay_period_start: bulkData.pay_period_start,
              pay_period_end: bulkData.pay_period_end,
              total_hours: totalHours,
              hourly_rate: workingHours.length > 0 ? workingHours[0].hourly_rate || 0 : 0, // Use rate from first working hour
              gross_pay: grossPay,
              deductions: deductions,
              net_pay: netPay,
              status: 'pending' as const
            }])
            .select()
            .single();

          if (payrollError) throw payrollError;

          // Update bulk payroll item
          await supabase
            .from('bulk_payroll_items')
            .update({ 
              payroll_id: payrollData.id, 
              status: 'processed' as const
            })
            .eq('bulk_payroll_id', bulkPayrollData.id)
            .eq('profile_id', profileId);

          processedCount++;
          totalAmount += netPay;
          
          // Update progress
          const progress = (processedCount / selectedProfileIds.length) * 100;
          setProcessingProgress(progress);

        } catch (error) {
          console.error(`Error processing payroll for profile ${profileId}:`, error);
          // Update bulk payroll item with error
          await supabase
            .from('bulk_payroll_items')
            .update({ 
              status: 'failed' as const,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('bulk_payroll_id', bulkPayrollData.id)
            .eq('profile_id', profileId);
        }
      }

      // Update bulk payroll status
      await supabase
        .from('bulk_payroll')
        .update({
          status: 'completed' as const,
          processed_records: processedCount,
          total_amount: totalAmount
        })
        .eq('id', bulkPayrollData.id);

      toast({
        title: "Success",
        description: `Bulk payroll completed. Processed ${processedCount} out of ${selectedProfileIds.length} records.`
      });

      // Reset form
      setSelectedProfileIds([]);
      setBulkData({
        name: "",
        description: "",
        pay_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pay_period_end: new Date().toISOString().split('T')[0]
      });
      setProcessingProgress(0);
      onRefresh();

    } catch (error: any) {
      console.error('Error creating bulk payroll:', error);
      toast({
        title: "Error",
        description: "Failed to create bulk payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Bulk Payroll */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Create Bulk Payroll
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bulk Payroll Name</Label>
              <Input
                value={bulkData.name}
                onChange={(e) => setBulkData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monthly Payroll - January 2024"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={bulkData.description}
                onChange={(e) => setBulkData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description..."
                rows={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Pay Period Start</Label>
              <Input
                type="date"
                value={bulkData.pay_period_start}
                onChange={(e) => setBulkData(prev => ({ ...prev, pay_period_start: e.target.value }))}
              />
            </div>
            <div>
              <Label>Pay Period End</Label>
              <Input
                type="date"
                value={bulkData.pay_period_end}
                onChange={(e) => setBulkData(prev => ({ ...prev, pay_period_end: e.target.value }))}
              />
            </div>
          </div>

          <EnhancedProfileSelector
            profiles={profiles}
            selectedProfileIds={selectedProfileIds}
            onProfileSelect={setSelectedProfileIds}
            mode="multiple"
            label="Select Profiles for Bulk Processing"
            showStats={true}
          />

          {loading && processingProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing payrolls...</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}

          <Button 
            onClick={createBulkPayroll} 
            disabled={loading || selectedProfileIds.length === 0 || !bulkData.name}
            className="w-full"
          >
            {loading ? "Processing..." : `Create Bulk Payroll for ${selectedProfileIds.length} Profiles`}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Records</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {bulkPayrolls.map((bulk) => (
                  <tr key={bulk.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{bulk.name}</div>
                        {bulk.description && (
                          <div className="text-sm text-gray-600">{bulk.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(bulk.pay_period_start).toLocaleDateString()} - {new Date(bulk.pay_period_end).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{bulk.processed_records}/{bulk.total_records}</div>
                        {bulk.total_records > bulk.processed_records && (
                          <div className="text-orange-600 text-xs">
                            {bulk.total_records - bulk.processed_records} failed
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">${bulk.total_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                        bulk.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : bulk.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : bulk.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bulk.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        {bulk.status === 'failed' && <AlertCircle className="h-3 w-3" />}
                        {bulk.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(bulk.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {bulkPayrolls.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No bulk payroll records found</p>
                      <p className="text-sm">Create your first bulk payroll above</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
