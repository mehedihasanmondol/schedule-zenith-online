import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, Calendar, FileText, Clock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Payroll as PayrollType, Profile, WorkingHour, BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { PayrollDetailsDialog } from "@/components/salary/PayrollDetailsDialog";
import { BankSelectionDialog } from "@/components/payroll/BankSelectionDialog";
import { PayrollListWithFilters } from "@/components/payroll/PayrollListWithFilters";
import { PayrollQuickGenerate } from "@/components/payroll/PayrollQuickGenerate";
import { PayrollEditDialog } from "@/components/payroll/PayrollEditDialog";

export const PayrollComponent = () => {
  const [payrolls, setPayrolls] = useState<PayrollType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [profilesWithHours, setProfilesWithHours] = useState<Profile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayrollForView, setSelectedPayrollForView] = useState<PayrollType | null>(null);
  const [selectedPayrollForEdit, setSelectedPayrollForEdit] = useState<PayrollType | null>(null);
  const [showPayrollDetails, setShowPayrollDetails] = useState(false);
  const [showPayrollEdit, setShowPayrollEdit] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [showBankSelectionDialog, setShowBankSelectionDialog] = useState(false);
  const [selectedPayrollForPayment, setSelectedPayrollForPayment] = useState<PayrollType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrolls();
    fetchProfiles();
    fetchWorkingHours();
    fetchBankAccounts();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          profiles!payroll_profile_id_fkey (id, full_name, role, hourly_rate)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const payrollData = (data || []).map(payroll => ({
        ...payroll,
        profiles: Array.isArray(payroll.profiles) ? payroll.profiles[0] : payroll.profiles
      }));
      
      setPayrolls(payrollData as PayrollType[]);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .is('profile_id', null)
        .order('bank_name');

      if (error) throw error;
      setBankAccounts(data || []);
      
      if (data && data.length > 0) {
        const primary = data.find(acc => acc.is_primary);
        setSelectedBankAccount(primary?.id || data[0].id);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role),
          clients!working_hours_client_id_fkey (id, name, company),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkingHours(data as WorkingHour[]);
      
      const profileIds = [...new Set(data.map(wh => wh.profile_id))];
      const profilesWithApprovedHours = profiles.filter(p => profileIds.includes(p.id));
      setProfilesWithHours(profilesWithApprovedHours);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  useEffect(() => {
    if (profiles.length > 0 && workingHours.length > 0) {
      const profileIds = [...new Set(workingHours.map(wh => wh.profile_id))];
      const profilesWithApprovedHours = profiles.filter(p => profileIds.includes(p.id));
      setProfilesWithHours(profilesWithApprovedHours);
    }
  }, [profiles, workingHours]);

  const handleMarkAsPaid = (payroll: PayrollType) => {
    setSelectedPayrollForPayment(payroll);
    setShowBankSelectionDialog(true);
  };

  const handleConfirmPayment = async (bankAccountId: string) => {
    if (!selectedPayrollForPayment) return;

    setLoading(true);
    try {
      const payroll = selectedPayrollForPayment;

      // Get bank account details
      const { data: bankAccount, error: bankError } = await supabase
        .from('bank_accounts')
        .select('opening_balance')
        .eq('id', bankAccountId)
        .single();

      if (bankError) throw bankError;

      // Get current balance by calculating all transactions
      const { data: transactions, error: transError } = await supabase
        .from('bank_transactions')
        .select('amount, type')
        .eq('bank_account_id', bankAccountId);

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
          bank_account_id: bankAccountId
        });

      if (transactionError) throw transactionError;

      // Update payroll status and bank account
      const { error } = await supabase
        .from('payroll')
        .update({ 
          status: 'paid',
          bank_account_id: bankAccountId 
        })
        .eq('id', payroll.id);

      if (error) throw error;

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

      toast({ 
        title: "Success", 
        description: "Payment processed successfully" 
      });
      
      setShowBankSelectionDialog(false);
      setSelectedPayrollForPayment(null);
      fetchPayrolls();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePayrollStatus = async (id: string, status: 'approved') => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Payroll ${status} successfully` 
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Error updating payroll status:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll status",
        variant: "destructive"
      });
    }
  };

  const handleViewPayroll = (payroll: PayrollType) => {
    setSelectedPayrollForView(payroll);
    setShowPayrollDetails(true);
  };

  const handleCreatePayroll = () => {
    // This will trigger the PayrollQuickGenerate dialog
    // We can pass this function to both tabs
  };

  const handleEditPayroll = (payroll: PayrollType) => {
    setSelectedPayrollForEdit(payroll);
    setShowPayrollEdit(true);
  };

  const handleDeletePayroll = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll record deleted successfully"
      });
      
      fetchPayrolls();
    } catch (error) {
      console.error('Error deleting payroll:', error);
      toast({
        title: "Error",
        description: "Failed to delete payroll record",
        variant: "destructive"
      });
    }
  };

  if (loading && payrolls.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
            <p className="text-gray-600">Manage employee payroll and payments</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payroll</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${payrolls.reduce((sum, p) => sum + p.gross_pay, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payrolls.filter(p => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payrolls.filter(p => p.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {payrolls.filter(p => p.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Payroll Management */}
      <Tabs defaultValue="payroll-records" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payroll-records">Payroll Records</TabsTrigger>
          <TabsTrigger value="quick-generator">Quick Payroll Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll-records">
          <PayrollListWithFilters
            payrolls={payrolls}
            onViewPayroll={handleViewPayroll}
            onMarkAsPaid={handleMarkAsPaid}
            onApprove={(id) => updatePayrollStatus(id, "approved")}
            onCreatePayroll={() => {}} // This will open the PayrollQuickGenerate dialog
            onEditPayroll={handleEditPayroll}
            onDeletePayroll={handleDeletePayroll}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="quick-generator">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Payroll Generator
                </CardTitle>
                <div className="text-sm text-gray-600">
                  {profilesWithHours.length} employees with approved hours available
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Quick Generate Feature</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Select an employee below to automatically generate their payroll with pre-filled data based on their approved working hours.
                  </p>
                </div>

                {profilesWithHours.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Hours Available</h3>
                    <p className="text-gray-600">
                      No employees have approved working hours available for payroll generation.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {profilesWithHours.map((profile) => {
                      const profileHours = workingHours.filter(wh => wh.profile_id === profile.id);
                      const totalHours = profileHours.reduce((sum, wh) => sum + wh.total_hours, 0);
                      const avgRate = profileHours.length > 0 
                        ? profileHours.reduce((sum, wh) => sum + (wh.hourly_rate || 0), 0) / profileHours.length
                        : profile.hourly_rate || 0;
                      const estimatedPay = totalHours * avgRate;
                      
                      // Get date range of available hours
                      const dates = profileHours.map(wh => new Date(wh.date)).sort((a, b) => a.getTime() - b.getTime());
                      const startDate = dates[0]?.toLocaleDateString();
                      const endDate = dates[dates.length - 1]?.toLocaleDateString();
                      
                      return (
                        <div key={profile.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="font-medium text-gray-700">
                                    {profile.full_name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{profile.full_name}</h3>
                                  <p className="text-sm text-gray-600">{profile.role}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Available Hours:</span>
                                  <div className="font-medium">{totalHours.toFixed(1)}h</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Avg Rate:</span>
                                  <div className="font-medium">${avgRate.toFixed(2)}/hr</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Period:</span>
                                  <div className="font-medium">{startDate} - {endDate}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Estimated Pay:</span>
                                  <div className="font-medium text-green-600">${estimatedPay.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                            
                            <PayrollQuickGenerate
                              profiles={profiles}
                              profilesWithHours={profilesWithHours}
                              workingHours={workingHours}
                              onRefresh={fetchPayrolls}
                              preSelectedProfile={profile}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
        onSuccess={fetchPayrolls}
      />

      {/* Bank Selection Dialog */}
      <BankSelectionDialog
        isOpen={showBankSelectionDialog}
        onClose={() => setShowBankSelectionDialog(false)}
        onConfirm={handleConfirmPayment}
        payroll={selectedPayrollForPayment}
        bankAccounts={bankAccounts}
        loading={loading}
      />
    </div>
  );
};
