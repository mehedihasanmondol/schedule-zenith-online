import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, TrendingDown, Building, DollarSign, Minus, Edit, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BankAccount, BankTransaction, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";

export const BankBalance = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [orphanBankAccounts, setOrphanBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<BankTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const { toast } = useToast();

  const categoryOptions = [
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
    { value: "transfer", label: "Transfer" },
    { value: "salary", label: "Salary" },
    { value: "equipment", label: "Equipment" },
    { value: "materials", label: "Materials" },
    { value: "travel", label: "Travel" },
    { value: "office", label: "Office" },
    { value: "utilities", label: "Utilities" },
    { value: "marketing", label: "Marketing" },
    { value: "opening_balance", label: "Opening Balance" },
    { value: "other", label: "Other" }
  ];

  const [quickTransactionData, setQuickTransactionData] = useState({
    bank_account_id: "",
    description: "",
    amount: 0,
    category: "" as "" | "income" | "expense" | "transfer" | "salary" | "equipment" | "materials" | "travel" | "office" | "utilities" | "marketing" | "opening_balance" | "other",
    date: new Date().toISOString().split('T')[0],
    profile_id: "",
    client_id: "",
    project_id: ""
  });

  const [bankFormData, setBankFormData] = useState({
    bank_name: "",
    account_number: "",
    bsb_code: "",
    swift_code: "",
    account_holder_name: "",
    opening_balance: 0,
    is_primary: false
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, transactions]);

  const filterTransactions = () => {
    if (!searchTerm) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredTransactions(filtered);
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchBankAccounts(),
        fetchTransactions(),
        fetchProfiles(),
        fetchClients(),
        fetchProjects()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allAccounts = data as BankAccount[];
      setBankAccounts(allAccounts);
      
      // Filter orphan accounts (accounts without profile_id)
      const orphanAccounts = allAccounts.filter(account => !account.profile_id);
      setOrphanBankAccounts(orphanAccounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select(`
          *,
          clients (id, company),
          projects (id, name),
          profiles (id, full_name),
          bank_accounts (id, bank_name, account_number)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      console.log('Fetched transactions:', data);
      setTransactions((data || []) as BankTransaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('company');

      if (error) throw error;
      setClients(data as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleQuickTransaction = async (type: 'deposit' | 'withdrawal') => {
    setLoading(true);

    try {
      const transactionData = {
        ...quickTransactionData,
        type,
        category: quickTransactionData.category || "other" as "other",
        profile_id: quickTransactionData.profile_id || null,
        client_id: quickTransactionData.client_id === "no-client" ? null : quickTransactionData.client_id || null,
        project_id: quickTransactionData.project_id === "no-project" ? null : quickTransactionData.project_id || null
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('bank_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);

        if (error) throw error;
        toast({ title: "Success", description: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} updated successfully` });
      } else {
        const { error } = await supabase
          .from('bank_transactions')
          .insert([transactionData]);

        if (error) throw error;
        toast({ title: "Success", description: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} added successfully` });
      }
      
      if (type === 'deposit') {
        setIsDepositDialogOpen(false);
      } else {
        setIsWithdrawDialogOpen(false);
      }
      
      resetQuickTransactionForm();
      fetchTransactions();
    } catch (error) {
      console.error('Error adding quick transaction:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingTransaction ? 'update' : 'add'} ${type}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bankAccountData = {
        bank_name: bankFormData.bank_name,
        account_number: bankFormData.account_number,
        bsb_code: bankFormData.bsb_code,
        swift_code: bankFormData.swift_code,
        account_holder_name: bankFormData.account_holder_name,
        opening_balance: 0, // Always set to 0, we'll create a transaction instead
        is_primary: bankFormData.is_primary
      };

      if (editingBankAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(bankAccountData)
          .eq('id', editingBankAccount.id);

        if (error) throw error;
        toast({ title: "Success", description: "Bank account updated successfully" });
      } else {
        const { data: newAccount, error } = await supabase
          .from('bank_accounts')
          .insert([bankAccountData])
          .select()
          .single();

        if (error) throw error;

        // Create opening balance transaction if amount is greater than 0
        if (bankFormData.opening_balance > 0) {
          const { error: transactionError } = await supabase
            .from('bank_transactions')
            .insert([{
              bank_account_id: newAccount.id,
              description: "Opening Balance",
              amount: bankFormData.opening_balance,
              type: "deposit" as const,
              category: "opening_balance" as const,
              date: new Date().toISOString().split('T')[0]
            }]);

          if (transactionError) {
            console.error('Error creating opening balance transaction:', transactionError);
            toast({
              title: "Warning",
              description: "Bank account created but opening balance transaction failed",
              variant: "destructive"
            });
          }
        }

        toast({ title: "Success", description: "Bank account added successfully" });
      }
      
      setIsBankDialogOpen(false);
      resetBankForm();
      fetchBankAccounts();
      fetchTransactions(); // Refresh transactions to show the opening balance
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast({
        title: "Error",
        description: "Failed to save bank account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBankAccount = (account: BankAccount) => {
    setEditingBankAccount(account);
    setBankFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      bsb_code: account.bsb_code || "",
      swift_code: account.swift_code || "",
      account_holder_name: account.account_holder_name,
      opening_balance: account.opening_balance,
      is_primary: account.is_primary
    });
    setIsBankDialogOpen(true);
  };

  const handleDeleteBankAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account? This will also delete all associated transactions.')) return;

    try {
      // First delete all transactions for this bank account
      await supabase
        .from('bank_transactions')
        .delete()
        .eq('bank_account_id', accountId);

      // Then delete the bank account
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Bank account deleted successfully" });
      fetchBankAccounts();
      fetchTransactions();
    } catch (error: any) {
      console.error('Error deleting bank account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank account",
        variant: "destructive"
      });
    }
  };

  const handleEditTransaction = (transaction: BankTransaction) => {
    setEditingTransaction(transaction);
    setQuickTransactionData({
      bank_account_id: transaction.bank_account_id || "",
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category as typeof quickTransactionData.category,
      date: transaction.date,
      profile_id: transaction.profile_id || "",
      client_id: transaction.client_id || "",
      project_id: transaction.project_id || ""
    });
    
    if (transaction.type === 'deposit') {
      setIsDepositDialogOpen(true);
    } else {
      setIsWithdrawDialogOpen(true);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Transaction deleted successfully" });
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  const resetQuickTransactionForm = () => {
    setQuickTransactionData({
      bank_account_id: "",
      description: "",
      amount: 0,
      category: "",
      date: new Date().toISOString().split('T')[0],
      profile_id: "",
      client_id: "",
      project_id: ""
    });
    setEditingTransaction(null);
  };

  const resetBankForm = () => {
    setBankFormData({
      bank_name: "",
      account_number: "",
      bsb_code: "",
      swift_code: "",
      account_holder_name: "",
      opening_balance: 0,
      is_primary: false
    });
    setEditingBankAccount(null);
  };

  const calculateBankBalance = (bankAccountId: string) => {
    const bankAccount = orphanBankAccounts.find(ba => ba.id === bankAccountId);
    const openingBalance = bankAccount?.opening_balance || 0;
    
    const bankTransactions = transactions.filter(t => t.bank_account_id === bankAccountId);
    const transactionsTotal = bankTransactions.reduce((sum, t) => {
      return sum + (t.type === 'deposit' ? t.amount : -t.amount);
    }, 0);
    
    return openingBalance + transactionsTotal;
  };

  const totalBalance = orphanBankAccounts.reduce((sum, account) => sum + calculateBankBalance(account.id), 0);
  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);

  if (loading && orphanBankAccounts.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bank Balance</h1>
            <p className="text-gray-600">Manage bank accounts and transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDepositDialogOpen} onOpenChange={(open) => { setIsDepositDialogOpen(open); if (!open) resetQuickTransactionForm(); }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Deposit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Edit Deposit' : 'Quick Deposit'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleQuickTransaction('deposit'); }} className="space-y-4">
                <div>
                  <Label htmlFor="deposit_bank_account">Bank Account</Label>
                  <Select value={quickTransactionData.bank_account_id} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, bank_account_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {orphanBankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deposit_client">Client</Label>
                  <Select value={quickTransactionData.client_id} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, client_id: value, project_id: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-client">No Client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deposit_project">Project</Label>
                  <Select value={quickTransactionData.project_id} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, project_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-project">No Project</SelectItem>
                      {projects.filter(p => !quickTransactionData.client_id || quickTransactionData.client_id === "no-client" || p.client_id === quickTransactionData.client_id).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ProfileSelector
                  profiles={profiles}
                  selectedProfileId={quickTransactionData.profile_id}
                  onProfileSelect={(profileId) => setQuickTransactionData({ ...quickTransactionData, profile_id: profileId })}
                  label="Employee (Optional)"
                  placeholder="Select employee"
                  showRoleFilter={true}
                />

                <div>
                  <Label htmlFor="deposit_description">Description</Label>
                  <Input
                    id="deposit_description"
                    value={quickTransactionData.description}
                    onChange={(e) => setQuickTransactionData({ ...quickTransactionData, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="deposit_amount">Amount</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    step="0.01"
                    value={quickTransactionData.amount}
                    onChange={(e) => setQuickTransactionData({ ...quickTransactionData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="deposit_category">Category (Optional)</Label>
                  <Select value={quickTransactionData.category} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, category: value as typeof quickTransactionData.category })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-category">No Category</SelectItem>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                  {loading ? "Adding..." : editingTransaction ? "Update Deposit" : "Add Deposit"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isWithdrawDialogOpen} onOpenChange={(open) => { setIsWithdrawDialogOpen(open); if (!open) resetQuickTransactionForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50">
                <Minus className="h-4 w-4" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Edit Withdrawal' : 'Quick Withdrawal'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleQuickTransaction('withdrawal'); }} className="space-y-4">
                <div>
                  <Label htmlFor="withdraw_bank_account">Bank Account</Label>
                  <Select value={quickTransactionData.bank_account_id} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, bank_account_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {orphanBankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="withdraw_client">Client</Label>
                  <Select value={quickTransactionData.client_id} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, client_id: value, project_id: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-client">No Client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="withdraw_project">Project</Label>
                  <Select value={quickTransactionData.project_id} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, project_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-project">No Project</SelectItem>
                      {projects.filter(p => !quickTransactionData.client_id || quickTransactionData.client_id === "no-client" || p.client_id === quickTransactionData.client_id).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ProfileSelector
                  profiles={profiles}
                  selectedProfileId={quickTransactionData.profile_id}
                  onProfileSelect={(profileId) => setQuickTransactionData({ ...quickTransactionData, profile_id: profileId })}
                  label="Employee (Optional)"
                  placeholder="Select employee"
                  showRoleFilter={true}
                />

                <div>
                  <Label htmlFor="withdraw_description">Description</Label>
                  <Input
                    id="withdraw_description"
                    value={quickTransactionData.description}
                    onChange={(e) => setQuickTransactionData({ ...quickTransactionData, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="withdraw_amount">Amount</Label>
                  <Input
                    id="withdraw_amount"
                    type="number"
                    step="0.01"
                    value={quickTransactionData.amount}
                    onChange={(e) => setQuickTransactionData({ ...quickTransactionData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="withdraw_category">Category (Optional)</Label>
                  <Select value={quickTransactionData.category} onValueChange={(value) => setQuickTransactionData({ ...quickTransactionData, category: value as typeof quickTransactionData.category })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-category">No Category</SelectItem>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                  {loading ? "Adding..." : editingTransaction ? "Update Withdrawal" : "Add Withdrawal"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isBankDialogOpen} onOpenChange={(open) => { setIsBankDialogOpen(open); if (!open) resetBankForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Bank
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBankSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={bankFormData.bank_name}
                    onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="account_holder_name">Account Holder Name</Label>
                  <Input
                    id="account_holder_name"
                    value={bankFormData.account_holder_name}
                    onChange={(e) => setBankFormData({ ...bankFormData, account_holder_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={bankFormData.account_number}
                    onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bsb_code">BSB Code</Label>
                    <Input
                      id="bsb_code"
                      value={bankFormData.bsb_code}
                      onChange={(e) => setBankFormData({ ...bankFormData, bsb_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="swift_code">SWIFT Code</Label>
                    <Input
                      id="swift_code"
                      value={bankFormData.swift_code}
                      onChange={(e) => setBankFormData({ ...bankFormData, swift_code: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="opening_balance">Opening Balance</Label>
                  <Input
                    id="opening_balance"
                    type="number"
                    step="0.01"
                    value={bankFormData.opening_balance}
                    onChange={(e) => setBankFormData({ ...bankFormData, opening_balance: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will create a deposit transaction with "Opening Balance" category
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : editingBankAccount ? "Update Bank Account" : "Add Bank Account"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {orphanBankAccounts.length} account{orphanBankAccounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Deposits</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalDeposits.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === 'deposit').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalWithdrawals.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === 'withdrawal').length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Orphan Bank Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Orphan Bank Accounts ({orphanBankAccounts.length})</CardTitle>
            <p className="text-sm text-gray-600">Bank accounts not linked to any profile</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orphanBankAccounts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orphan bank accounts found</p>
              ) : (
                orphanBankAccounts.map((account) => {
                  const accountTransactions = transactions.filter(t => t.bank_account_id === account.id);
                  const currentBalance = accountTransactions.reduce((sum, transaction) => {
                    return transaction.type === 'deposit' 
                      ? sum + transaction.amount 
                      : sum - transaction.amount;
                  }, account.opening_balance);

                  return (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{account.bank_name}</h3>
                          <p className="text-sm text-gray-600">
                            {account.account_holder_name} • ****{account.account_number.slice(-4)}
                          </p>
                          {account.bsb_code && (
                            <p className="text-xs text-gray-500">BSB: {account.bsb_code}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xl font-bold">
                              ${currentBalance.toFixed(2)}
                            </div>
                            {account.is_primary && (
                              <Badge variant="default" className="mt-1">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditBankAccount(account)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteBankAccount(account.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Transactions ({transactions.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {searchTerm ? "No transactions match your search." : "No transactions found. Add your first transaction above."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Client/Project</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Profile</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-900">{transaction.description}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{transaction.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {transaction.clients?.company && (
                            <div>
                              <div className="font-medium">{transaction.clients.company}</div>
                              {transaction.projects?.name && (
                                <div className="text-sm text-gray-500">{transaction.projects.name}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {transaction.profiles?.full_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={transaction.type === 'deposit' ? 'default' : 'destructive'}>
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditTransaction(transaction)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
