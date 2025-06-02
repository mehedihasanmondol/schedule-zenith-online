
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, User, Calendar, CreditCard } from "lucide-react";

interface PayrollDetailsDialogProps {
  payroll: Payroll | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export const PayrollDetailsDialog = ({
  payroll,
  open,
  onOpenChange,
  onRefresh
}: PayrollDetailsDialogProps) => {
  const [profileBankAccounts, setProfileBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (payroll && open) {
      fetchProfileBankAccounts();
      setSelectedBankAccount(payroll.bank_account_id || "");
    }
  }, [payroll, open]);

  const fetchProfileBankAccounts = async () => {
    if (!payroll?.profile_id) return;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('profile_id', payroll.profile_id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setProfileBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching profile bank accounts:', error);
    }
  };

  const updatePayrollBankAccount = async () => {
    if (!payroll) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('payroll')
        .update({ bank_account_id: selectedBankAccount || null })
        .eq('id', payroll.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bank account updated successfully"
      });
      
      onRefresh();
    } catch (error: any) {
      console.error('Error updating payroll bank account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update bank account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!payroll) return null;

  const selectedBank = profileBankAccounts.find(bank => bank.id === selectedBankAccount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payroll Details - {payroll.profiles?.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Name</Label>
                <div className="font-medium">{payroll.profiles?.full_name}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Role</Label>
                <div>{payroll.profiles?.role}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Email</Label>
                <div>{payroll.profiles?.email}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Employment Type</Label>
                <div>{payroll.profiles?.employment_type}</div>
              </div>
            </CardContent>
          </Card>

          {/* Pay Period Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Pay Period
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Start Date</Label>
                <div className="font-medium">{new Date(payroll.pay_period_start).toLocaleDateString()}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">End Date</Label>
                <div className="font-medium">{new Date(payroll.pay_period_end).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Total Hours</Label>
                <div className="font-medium">{payroll.total_hours.toFixed(1)} hours</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Hourly Rate</Label>
                <div className="font-medium">${payroll.hourly_rate.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Gross Pay</Label>
                <div className="font-medium">${payroll.gross_pay.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Deductions</Label>
                <div className="font-medium text-red-600">${payroll.deductions.toFixed(2)}</div>
              </div>
              <div className="col-span-2">
                <Label className="text-sm text-gray-600">Net Pay</Label>
                <div className="text-2xl font-bold text-green-600">${payroll.net_pay.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Payment Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bank_account">Employee Bank Account</Label>
                <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Bank Account</SelectItem>
                    {profileBankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_number}
                        {account.is_primary && " (Primary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBank && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Bank Account Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Bank:</span> {selectedBank.bank_name}
                    </div>
                    <div>
                      <span className="text-gray-600">Account:</span> {selectedBank.account_number}
                    </div>
                    <div>
                      <span className="text-gray-600">Holder:</span> {selectedBank.account_holder_name}
                    </div>
                    {selectedBank.bsb_code && (
                      <div>
                        <span className="text-gray-600">BSB:</span> {selectedBank.bsb_code}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={updatePayrollBankAccount} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Updating..." : "Update Bank Account"}
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-600">Status</Label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                  payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {payroll.status.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
