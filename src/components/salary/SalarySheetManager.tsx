import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Printer, Download, Eye, Calendar, DollarSign, Trash2, CreditCard, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, Profile, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { SalarySheetPrintView } from "./SalarySheetPrintView";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { PayrollDetailsDialog } from "./PayrollDetailsDialog";

interface SalarySheetManagerProps {
  payrolls: Payroll[];
  profiles: Profile[];
  onRefresh: () => void;
}

export const SalarySheetManager = ({ payrolls: initialPayrolls, profiles, onRefresh }: SalarySheetManagerProps) => {
  const [payrolls, setPayrolls] = useState<Payroll[]>(initialPayrolls);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [groupedPayrolls, setGroupedPayrolls] = useState<Record<string, Payroll[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSheet, setSelectedSheet] = useState<Payroll[] | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);
  const [selectedPayrollForView, setSelectedPayrollForView] = useState<Payroll | null>(null);
  const [showPayrollDetails, setShowPayrollDetails] = useState(false);
  const [bankBalance, setBankBalance] = useState<number>(0);
  const { toast } = useToast();

  // Update local payrolls when prop changes
  useEffect(() => {
    setPayrolls(initialPayrolls);
  }, [initialPayrolls]);

  useEffect(() => {
    groupPayrollsByPeriod();
    fetchBankAccounts();
    loadSavedBankAccount();
  }, [payrolls]);

  useEffect(() => {
    if (selectedBankAccount) {
      fetchBankBalance();
    }
  }, [selectedBankAccount]);

  const fetchBankAccounts = async () => {
    try {
      // Only fetch non-profile-linked bank accounts for general use
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .is('profile_id', null)
        .order('bank_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchBankBalance = async () => {
    if (!selectedBankAccount) {
      setBankBalance(0);
      return;
    }

    try {
      // Get bank account opening balance
      const { data: bankAccount, error: bankError } = await supabase
        .from('bank_accounts')
        .select('opening_balance')
        .eq('id', selectedBankAccount)
        .single();

      if (bankError) throw bankError;

      // Get all transactions for this bank account
      const { data: transactions, error: transError } = await supabase
        .from('bank_transactions')
        .select('amount, type')
        .eq('bank_account_id', selectedBankAccount);

      if (transError) throw transError;

      // Calculate current balance
      const transactionBalance = transactions.reduce((sum, t) => 
        sum + (t.type === 'deposit' ? t.amount : -t.amount), 0
      );

      setBankBalance(bankAccount.opening_balance + transactionBalance);
    } catch (error) {
      console.error('Error fetching bank balance:', error);
      setBankBalance(0);
    }
  };

  const loadSavedBankAccount = () => {
    const saved = localStorage.getItem('defaultPaymentBank');
    if (saved && bankAccounts.length > 0) {
      setSelectedBankAccount(saved);
    }
  };

  const saveBankAccountSelection = (bankId: string) => {
    localStorage.setItem('defaultPaymentBank', bankId);
    setSelectedBankAccount(bankId);
  };

  const groupPayrollsByPeriod = () => {
    const grouped: Record<string, Payroll[]> = {};
    
    payrolls.forEach(payroll => {
      const periodKey = `${payroll.pay_period_start} - ${payroll.pay_period_end}`;
      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(payroll);
    });

    setGroupedPayrolls(grouped);
    
    // Auto-select the most recent period
    const periods = Object.keys(grouped).sort().reverse();
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  };

  const filteredPayrolls = selectedPeriod ? groupedPayrolls[selectedPeriod] || [] : [];
  
  const searchFilteredPayrolls = filteredPayrolls.filter(payroll =>
    payroll.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGrossPay = searchFilteredPayrolls.reduce((sum, p) => sum + p.gross_pay, 0);
  const totalDeductions = searchFilteredPayrolls.reduce((sum, p) => sum + p.deductions, 0);
  const totalNetPay = searchFilteredPayrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = searchFilteredPayrolls.reduce((sum, p) => sum + p.total_hours, 0);

  // Get payrolls that can be approved (pending status)
  const approvablePayrolls = searchFilteredPayrolls.filter(p => p.status === 'pending');
  const selectedApprovablePayrolls = selectedPayrolls.filter(id => 
    approvablePayrolls.some(p => p.id === id)
  );

  // Get payrolls that can be paid (approved status)
  const payablePayrolls = searchFilteredPayrolls.filter(p => p.status === 'approved');
  const selectedPayablePayrolls = selectedPayrolls.filter(id => 
    payablePayrolls.some(p => p.id === id)
  );

  // Calculate total amount for selected payable payrolls
  const totalSelectedPayableAmount = selectedPayablePayrolls.reduce((sum, id) => {
    const payroll = payablePayrolls.find(p => p.id === id);
    return sum + (payroll?.net_pay || 0);
  }, 0);

  // Check if bulk approve is disabled
  const isBulkApproveDisabled = selectedApprovablePayrolls.length === 0;

  // Check if bulk payment is disabled (no payable payrolls selected OR insufficient bank balance)
  const isBulkPaymentDisabled = selectedPayablePayrolls.length === 0 || 
    !selectedBankAccount || 
    bankBalance < totalSelectedPayableAmount;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(searchFilteredPayrolls.map(p => p.id));
    } else {
      setSelectedPayrolls([]);
    }
  };

  const handleSelectPayroll = (payrollId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(prev => [...prev, payrollId]);
    } else {
      setSelectedPayrolls(prev => prev.filter(id => id !== payrollId));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'pay') => {
    if (action === 'approve') {
      if (selectedApprovablePayrolls.length === 0) {
        toast({
          title: "No Payrolls to Approve",
          description: "Please select payrolls with pending status to approve",
          variant: "destructive"
        });
        return;
      }

      const confirmMessage = `Mark ${selectedApprovablePayrolls.length} payrolls as approved?`;
      if (!confirm(confirmMessage)) return;

      try {
        for (const payrollId of selectedApprovablePayrolls) {
          await updatePayrollStatus(payrollId, 'approved');
        }
        setSelectedPayrolls([]);
        toast({
          title: "Success",
          description: `${selectedApprovablePayrolls.length} payrolls marked as approved`
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to approve payrolls",
          variant: "destructive"
        });
      }
    } else if (action === 'pay') {
      if (selectedPayablePayrolls.length === 0) {
        toast({
          title: "No Payrolls to Pay",
          description: "Please select payrolls with approved status to mark as paid",
          variant: "destructive"
        });
        return;
      }

      if (bankBalance < totalSelectedPayableAmount) {
        toast({
          title: "Insufficient Bank Balance",
          description: `Bank balance ($${bankBalance.toFixed(2)}) is insufficient for selected payments ($${totalSelectedPayableAmount.toFixed(2)})`,
          variant: "destructive"
        });
        return;
      }

      const confirmMessage = `Mark ${selectedPayablePayrolls.length} payrolls as paid? Total amount: $${totalSelectedPayableAmount.toFixed(2)}`;
      if (!confirm(confirmMessage)) return;

      try {
        for (const payrollId of selectedPayablePayrolls) {
          await updatePayrollStatus(payrollId, 'paid', selectedBankAccount);
        }
        setSelectedPayrolls([]);
        toast({
          title: "Success",
          description: `${selectedPayablePayrolls.length} payrolls marked as paid`
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to mark payrolls as paid",
          variant: "destructive"
        });
      }
    }
  };

  const handlePrintSheet = (payrollList: Payroll[]) => {
    setSelectedSheet(payrollList);
    setShowPrintView(true);
  };

  const handleExportCSV = (payrollList: Payroll[]) => {
    const csvContent = [
      ['Employee', 'Role', 'Hours', 'Rate', 'Gross Pay', 'Deductions', 'Net Pay', 'Status'],
      ...payrollList.map(p => [
        p.profiles?.full_name || 'N/A',
        p.profiles?.role || 'N/A',
        p.total_hours.toString(),
        p.hourly_rate.toString(),
        p.gross_pay.toString(),
        p.deductions.toString(),
        p.net_pay.toString(),
        p.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-sheet-${selectedPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Salary sheet exported successfully"
    });
  };

  const updatePayrollStatus = async (payrollId: string, status: 'pending' | 'approved' | 'paid', bankAccountId?: string) => {
    try {
      const payroll = payrolls.find(p => p.id === payrollId);
      if (!payroll) throw new Error('Payroll not found');

      // If changing to paid status, check bank balance and create withdrawal
      if (status === 'paid' && payroll.status !== 'paid') {
        const bankId = bankAccountId || selectedBankAccount;
        if (bankId) {
          // Check bank balance
          const { data: bankAccount, error: bankError } = await supabase
            .from('bank_accounts')
            .select('opening_balance')
            .eq('id', bankId)
            .single();

          if (bankError) throw bankError;

          // Get current balance by calculating all transactions
          const { data: transactions, error: transError } = await supabase
            .from('bank_transactions')
            .select('amount, type')
            .eq('bank_account_id', bankId);

          if (transError) throw transError;

          const currentBalance = bankAccount.opening_balance + 
            transactions.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0);

          if (currentBalance < payroll.net_pay) {
            toast({
              title: "Insufficient Balance",
              description: "Bank account does not have sufficient balance for this payment",
              variant: "destructive"
            });
            return;
          }

          // Create withdrawal transaction
          const { error: transactionError } = await supabase
            .from('bank_transactions')
            .insert({
              description: `Salary payment for ${payroll.profiles?.full_name} (${payroll.pay_period_start} - ${payroll.pay_period_end})`,
              amount: payroll.net_pay,
              type: 'withdrawal',
              category: 'salary',
              date: new Date().toISOString().split('T')[0],
              profile_id: payroll.profile_id,
              bank_account_id: bankId
            });

          if (transactionError) throw transactionError;

          // Update payroll with bank account
          await supabase
            .from('payroll')
            .update({ bank_account_id: bankId })
            .eq('id', payrollId);
        }

        // Send notification for payment
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            title: 'Salary Payment Processed',
            message: `Your salary for period ${payroll.pay_period_start} to ${payroll.pay_period_end} has been paid. Amount: $${payroll.net_pay.toFixed(2)}`,
            type: 'salary_paid',
            recipient_profile_id: payroll.profile_id,
            related_id: payroll.id,
            action_type: 'none',
            priority: 'high'
          });

        if (notificationError) console.error('Failed to send notification:', notificationError);
      }

      // Update payroll status in database
      const { error } = await supabase
        .from('payroll')
        .update({ status })
        .eq('id', payrollId);

      if (error) throw error;
      
      // Update local state without full refresh
      setPayrolls(prevPayrolls => 
        prevPayrolls.map(p => 
          p.id === payrollId ? { ...p, status } : p
        )
      );
      
    } catch (error: any) {
      console.error('Error updating payroll status:', error);
      throw error;
    }
  };

  const deletePayroll = async (payrollId: string) => {
    try {
      const payroll = payrolls.find(p => p.id === payrollId);
      if (!payroll) throw new Error('Payroll not found');

      if (payroll.status === 'paid') {
        toast({
          title: "Cannot Delete",
          description: "Cannot delete payroll that has already been paid",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', payrollId);

      if (error) throw error;

      // Update local state without full refresh
      setPayrolls(prevPayrolls => 
        prevPayrolls.filter(p => p.id !== payrollId)
      );

      toast({
        title: "Success",
        description: "Payroll deleted successfully"
      });

    } catch (error: any) {
      console.error('Error deleting payroll:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete payroll",
        variant: "destructive"
      });
    }
  };

  const handleViewPayroll = (payroll: Payroll) => {
    setSelectedPayrollForView(payroll);
    setShowPayrollDetails(true);
  };

  const getSelectedBankName = () => {
    const bank = bankAccounts.find(b => b.id === selectedBankAccount);
    return bank ? `${bank.bank_name} - ${bank.account_number}` : 'Select Bank Account';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Salary Sheet Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(groupedPayrolls).sort().reverse().map((period) => (
                    <SelectItem key={period} value={period}>
                      {period} ({groupedPayrolls[period].length} employees)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePrintSheet(searchFilteredPayrolls)}
                disabled={searchFilteredPayrolls.length === 0}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportCSV(searchFilteredPayrolls)}
                disabled={searchFilteredPayrolls.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {selectedPeriod && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Total Hours</div>
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Gross Pay</div>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">${totalGrossPay.toFixed(2)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Deductions</div>
                      <DollarSign className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">${totalDeductions.toFixed(2)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Net Pay</div>
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">${totalNetPay.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Bank Account Selection for Payments */}
              {bankAccounts.length > 0 && (
                <div className="mb-6">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Payment Bank Account:</span>
                        </div>
                        <Select value={selectedBankAccount} onValueChange={saveBankAccountSelection}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.bank_name} - {account.account_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedBankAccount && (
                        <div className="mt-2 text-xs text-gray-500">
                          Bank Balance: ${bankBalance.toFixed(2)} | Selected: {getSelectedBankName()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedPayrolls.length > 0 && (
                <div className="mb-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          {selectedPayrolls.length} payroll(s) selected
                          {selectedApprovablePayrolls.length > 0 && (
                            <span className="text-blue-600 ml-2">
                              ({selectedApprovablePayrolls.length} approvable)
                            </span>
                          )}
                          {selectedPayablePayrolls.length > 0 && (
                            <span className="text-green-600 ml-2">
                              ({selectedPayablePayrolls.length} payable - ${totalSelectedPayableAmount.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBulkAction('approve')}
                            disabled={isBulkApproveDisabled}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Bulk Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleBulkAction('pay')}
                            disabled={isBulkPaymentDisabled}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Bulk Mark as Paid
                          </Button>
                        </div>
                      </div>
                      {isBulkPaymentDisabled && selectedPayablePayrolls.length > 0 && bankBalance < totalSelectedPayableAmount && (
                        <div className="mt-2 text-xs text-red-500">
                          Insufficient bank balance for selected payments
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payroll Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <Checkbox
                          checked={selectedPayrolls.length === searchFilteredPayrolls.length && searchFilteredPayrolls.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchFilteredPayrolls.map((payroll) => (
                      <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedPayrolls.includes(payroll.id)}
                            onCheckedChange={(checked) => handleSelectPayroll(payroll.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{payroll.profiles?.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-600">{payroll.profiles?.role || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{payroll.total_hours.toFixed(1)}</td>
                        <td className="py-3 px-4">${payroll.hourly_rate.toFixed(2)}</td>
                        <td className="py-3 px-4">${payroll.gross_pay.toFixed(2)}</td>
                        <td className="py-3 px-4 text-red-600">${payroll.deductions.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-green-600">${payroll.net_pay.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payroll.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {payroll.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updatePayrollStatus(payroll.id, 'approved')}
                                >
                                  Mark as Approved
                                </Button>
                                <ActionDropdown
                                  items={[
                                    {
                                      label: "Delete",
                                      onClick: () => deletePayroll(payroll.id),
                                      icon: <Trash2 className="h-4 w-4" />,
                                      variant: "destructive"
                                    },
                                    {
                                      label: "View Details",
                                      onClick: () => handleViewPayroll(payroll),
                                      icon: <Eye className="h-4 w-4" />
                                    }
                                  ]}
                                />
                              </>
                            )}
                            {payroll.status === 'approved' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updatePayrollStatus(payroll.id, 'paid', selectedBankAccount)}
                                  disabled={!selectedBankAccount}
                                >
                                  Mark as Paid
                                </Button>
                                <ActionDropdown
                                  items={[
                                    {
                                      label: "Delete",
                                      onClick: () => deletePayroll(payroll.id),
                                      icon: <Trash2 className="h-4 w-4" />,
                                      variant: "destructive"
                                    },
                                    {
                                      label: "View Details",
                                      onClick: () => handleViewPayroll(payroll),
                                      icon: <Eye className="h-4 w-4" />
                                    }
                                  ]}
                                />
                              </>
                            )}
                            {payroll.status === 'paid' && (
                              <ActionDropdown
                                items={[
                                  {
                                    label: "View Details",
                                    onClick: () => handleViewPayroll(payroll),
                                    icon: <Eye className="h-4 w-4" />
                                  }
                                ]}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Print View Dialog */}
      <Dialog open={showPrintView} onOpenChange={setShowPrintView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Sheet - {selectedPeriod}</DialogTitle>
          </DialogHeader>
          {selectedSheet && (
            <SalarySheetPrintView payrolls={selectedSheet} period={selectedPeriod} />
          )}
        </DialogContent>
      </Dialog>

      {/* Payroll Details Dialog */}
      <PayrollDetailsDialog
        payroll={selectedPayrollForView}
        isOpen={showPayrollDetails}
        onClose={() => setShowPayrollDetails(false)}
      />
    </div>
  );
};
