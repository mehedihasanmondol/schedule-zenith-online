import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Printer, Download, Eye, Calendar, DollarSign, Trash2, CreditCard, Check, Edit, Search, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Payroll, Profile, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { SalarySheetPrintView } from "./SalarySheetPrintView";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { PayrollDetailsDialog } from "./PayrollDetailsDialog";
import { PayrollEditDialog } from "@/components/payroll/PayrollEditDialog";

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
  const [selectedPayrollForEdit, setSelectedPayrollForEdit] = useState<Payroll | null>(null);
  const [showPayrollDetails, setShowPayrollDetails] = useState(false);
  const [showPayrollEdit, setShowPayrollEdit] = useState(false);
  const [bankBalance, setBankBalance] = useState<number>(0);
  
  // Date filter states
  const [dateShortcut, setDateShortcut] = useState("current-week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { toast } = useToast();

  // Update local payrolls when prop changes
  useEffect(() => {
    setPayrolls(initialPayrolls);
  }, [initialPayrolls]);

  // Set default dates to current week
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    
    setStartDate(mondayDate.toISOString().split('T')[0]);
    setEndDate(sundayDate.toISOString().split('T')[0]);
  }, []);

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

  const handleDateShortcut = (shortcut: string) => {
    setDateShortcut(shortcut);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    let start: Date, end: Date;
    
    switch (shortcut) {
      case "last-week":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 6);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        start = lastWeekStart;
        end = lastWeekEnd;
        break;
        
      case "current-week":
        const currentDay = today.getDay();
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);
        start = mondayDate;
        end = sundayDate;
        break;
        
      case "last-month":
        start = new Date(currentYear, currentMonth - 1, 1);
        end = new Date(currentYear, currentMonth, 0);
        break;
        
      case "this-year":
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31);
        break;
        
      default:
        const monthNames = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const monthIndex = monthNames.indexOf(shortcut.toLowerCase());
        if (monthIndex !== -1) {
          start = new Date(currentYear, monthIndex, 1);
          end = new Date(currentYear, monthIndex + 1, 0);
        } else {
          return;
        }
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const generateShortcutOptions = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const options = [
      { value: "last-week", label: "Last Week" },
      { value: "current-week", label: "Current Week" },
      { value: "last-month", label: "Last Month" },
    ];
    
    for (let i = currentMonth; i >= 0; i--) {
      options.push({
        value: monthNames[i].toLowerCase(),
        label: monthNames[i]
      });
    }
    
    options.push({ value: "this-year", label: "This Year" });
    
    return options;
  };

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

  // Apply filters to payrolls
  const getFilteredPayrolls = () => {
    let filtered = payrolls;

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter(payroll => {
        const payrollStart = new Date(payroll.pay_period_start);
        const payrollEnd = new Date(payroll.pay_period_end);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        return (payrollStart >= filterStart && payrollStart <= filterEnd) ||
               (payrollEnd >= filterStart && payrollEnd <= filterEnd) ||
               (payrollStart <= filterStart && payrollEnd >= filterEnd);
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(payroll => payroll.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payroll =>
        payroll.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredPayrolls = getFilteredPayrolls();

  // Group filtered payrolls by period
  const groupFilteredPayrollsByPeriod = () => {
    const grouped: Record<string, Payroll[]> = {};
    
    filteredPayrolls.forEach(payroll => {
      const periodKey = `${payroll.pay_period_start} - ${payroll.pay_period_end}`;
      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(payroll);
    });

    return grouped;
  };

  const filteredGroupedPayrolls = groupFilteredPayrollsByPeriod();
  const currentPeriodPayrolls = selectedPeriod ? (filteredGroupedPayrolls[selectedPeriod] || []) : [];

  const totalGrossPay = currentPeriodPayrolls.reduce((sum, p) => sum + p.gross_pay, 0);
  const totalDeductions = currentPeriodPayrolls.reduce((sum, p) => sum + p.deductions, 0);
  const totalNetPay = currentPeriodPayrolls.reduce((sum, p) => sum + p.net_pay, 0);
  const totalHours = currentPeriodPayrolls.reduce((sum, p) => sum + p.total_hours, 0);

  // Get payrolls that can be approved (pending status)
  const approvablePayrolls = currentPeriodPayrolls.filter(p => p.status === 'pending');
  const selectedApprovablePayrolls = selectedPayrolls.filter(id => 
    approvablePayrolls.some(p => p.id === id)
  );

  // Get payrolls that can be paid (approved status)
  const payablePayrolls = currentPeriodPayrolls.filter(p => p.status === 'approved');
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
      setSelectedPayrolls(currentPeriodPayrolls.map(p => p.id));
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

  const handleEditPayroll = (payroll: Payroll) => {
    setSelectedPayrollForEdit(payroll);
    setShowPayrollEdit(true);
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
          {/* Desktop filters - side by side layout */}
          <div className="hidden lg:flex flex-wrap items-center gap-4 mb-6">
            <Select value={dateShortcut} onValueChange={handleDateShortcut}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {generateShortcutOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
                placeholder="Start Date"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
                placeholder="End Date"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Filters</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Mobile-optimized filters */}
          <div className="lg:hidden space-y-3 sm:space-y-4 mb-6">
            {/* Date filters row */}
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:gap-4">
              <Select value={dateShortcut} onValueChange={handleDateShortcut}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {generateShortcutOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="Start"
                />
                <span className="text-gray-500 text-xs shrink-0">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="End"
                />
              </div>
            </div>
            
            {/* Search and filters row */}
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500 shrink-0" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 text-sm"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Filters</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Mobile-friendly Period Selection */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(filteredGroupedPayrolls).sort().reverse().map((period) => (
                    <SelectItem key={period} value={period}>
                      {period} ({filteredGroupedPayrolls[period].length} employees)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePrintSheet(currentPeriodPayrolls)}
                disabled={currentPeriodPayrolls.length === 0}
                className="w-full sm:w-auto"
              >
                <Printer className="h-4 w-4 mr-1" />
                <span className="sm:hidden">Print</span>
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportCSV(currentPeriodPayrolls)}
                disabled={currentPeriodPayrolls.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="sm:hidden">Export</span>
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {selectedPeriod && (
            <>
              {/* Mobile-friendly Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

              {/* Mobile-friendly Payroll List */}
              <>
                {/* Desktop table view */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          <Checkbox
                            checked={selectedPayrolls.length === currentPeriodPayrolls.length && currentPeriodPayrolls.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPeriodPayrolls.map((payroll) => (
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
                                    Approve
                                  </Button>
                                  <ActionDropdown
                                    items={[
                                      {
                                        label: "Edit",
                                        onClick: () => handleEditPayroll(payroll),
                                        icon: <Edit className="h-4 w-4" />
                                      },
                                      {
                                        label: "Delete",
                                        onClick: () => deletePayroll(payroll.id),
                                        icon: <Trash2 className="h-4 w-4" />,
                                        destructive: true
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
                                        label: "Edit",
                                        onClick: () => handleEditPayroll(payroll),
                                        icon: <Edit className="h-4 w-4" />
                                      },
                                      {
                                        label: "Delete",
                                        onClick: () => deletePayroll(payroll.id),
                                        icon: <Trash2 className="h-4 w-4" />,
                                        destructive: true
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

                {/* Mobile card view */}
                <div className="lg:hidden space-y-4">
                  {/* Select all checkbox for mobile */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      checked={selectedPayrolls.length === currentPeriodPayrolls.length && currentPeriodPayrolls.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({currentPeriodPayrolls.length} employees)
                    </span>
                  </div>

                  {currentPeriodPayrolls.map((payroll) => (
                    <Card key={payroll.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header with checkbox, employee info and status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Checkbox
                                checked={selectedPayrolls.includes(payroll.id)}
                                onCheckedChange={(checked) => handleSelectPayroll(payroll.id, checked as boolean)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base text-gray-900 truncate">
                                  {payroll.profiles?.full_name || 'N/A'}
                                </h4>
                                <p className="text-sm text-gray-600 truncate">
                                  {payroll.profiles?.role || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                                payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payroll.status}
                              </span>
                            </div>
                          </div>

                          {/* Financial details grid */}
                          <div className="grid grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-xs text-blue-600 font-medium">Hours</div>
                              <div className="font-semibold text-blue-700">{payroll.total_hours.toFixed(1)}</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <div className="text-xs text-purple-600 font-medium">Rate</div>
                              <div className="font-semibold text-purple-700">${payroll.hourly_rate.toFixed(2)}</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="text-xs text-orange-600 font-medium">Gross</div>
                              <div className="font-semibold text-orange-700">${payroll.gross_pay.toFixed(2)}</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="text-xs text-green-600 font-medium">Net Pay</div>
                              <div className="font-semibold text-green-700">${payroll.net_pay.toFixed(2)}</div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            {payroll.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updatePayrollStatus(payroll.id, 'approved')}
                                  className="flex-1"
                                >
                                  Approve
                                </Button>
                                <ActionDropdown
                                  items={[
                                    {
                                      label: "Edit",
                                      onClick: () => handleEditPayroll(payroll),
                                      icon: <Edit className="h-4 w-4" />
                                    },
                                    {
                                      label: "Delete",
                                      onClick: () => deletePayroll(payroll.id),
                                      icon: <Trash2 className="h-4 w-4" />,
                                      destructive: true
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
                                  onClick={() => updatePayrollStatus(payroll.id, 'paid', selectedBankAccount)}
                                  disabled={!selectedBankAccount}
                                  className="flex-1"
                                >
                                  Mark as Paid
                                </Button>
                                <ActionDropdown
                                  items={[
                                    {
                                      label: "Edit",
                                      onClick: () => handleEditPayroll(payroll),
                                      icon: <Edit className="h-4 w-4" />
                                    },
                                    {
                                      label: "Delete",
                                      onClick: () => deletePayroll(payroll.id),
                                      icon: <Trash2 className="h-4 w-4" />,
                                      destructive: true
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {currentPeriodPayrolls.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-lg font-medium mb-2">No payroll records found</div>
                      <p className="text-sm">Try adjusting your filters or date range</p>
                    </div>
                  )}
                </div>
              </>
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

      {/* Payroll Edit Dialog */}
      <PayrollEditDialog
        payroll={selectedPayrollForEdit}
        isOpen={showPayrollEdit}
        onClose={() => setShowPayrollEdit(false)}
        onSuccess={() => {
          onRefresh();
          setShowPayrollEdit(false);
        }}
      />
    </div>
  );
};
