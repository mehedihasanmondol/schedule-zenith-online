
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BankTransaction, BankAccount, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { BankBalanceStats } from "@/components/bank/BankBalanceStats";
import { TransactionForm } from "@/components/bank/TransactionForm";
import { TransactionTable } from "@/components/bank/TransactionTable";

export const BankBalance = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: "",
    project_id: "",
    profile_id: "",
    bank_account_id: "",
    amount: 0,
    category: "other" as "income" | "expense" | "transfer" | "salary" | "equipment" | "materials" | "travel" | "office" | "utilities" | "marketing" | "other",
    description: "",
    type: "deposit" as "deposit" | "withdrawal",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
    fetchBankAccounts();
    fetchProfiles();
    fetchClients();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        client_id: editingTransaction.client_id || "",
        project_id: editingTransaction.project_id || "",
        profile_id: editingTransaction.profile_id || "",
        bank_account_id: editingTransaction.bank_account_id || "",
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        description: editingTransaction.description,
        type: editingTransaction.type,
        date: editingTransaction.date
      });
    } else {
      setFormData({
        client_id: "",
        project_id: "",
        profile_id: "",
        bank_account_id: "",
        amount: 0,
        category: "other",
        description: "",
        type: "deposit",
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [editingTransaction, isDialogOpen]);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as BankTransaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
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
        .order('bank_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
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
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company');

      if (error) throw error;
      setClients((data || []) as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transactionData = {
        ...formData,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        profile_id: formData.profile_id || null
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('bank_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);

        if (error) throw error;
        toast({ title: "Success", description: "Transaction updated successfully" });
      } else {
        const { error } = await supabase
          .from('bank_transactions')
          .insert([transactionData]);

        if (error) throw error;
        toast({ title: "Success", description: "Transaction added successfully" });
      }

      setIsDialogOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: BankTransaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Transaction deleted successfully" });
      fetchTransactions();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = transactions.reduce((sum, transaction) => {
    return transaction.type === 'deposit' ? sum + transaction.amount : sum - transaction.amount;
  }, 0);

  const totalIncome = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);

  if (loading && transactions.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bank Balance</h1>
            <p className="text-gray-600">Track income and expenses</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTransaction(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
            </DialogHeader>
            <TransactionForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              bankAccounts={bankAccounts}
              profiles={profiles}
              clients={clients}
              projects={projects}
              loading={loading}
              editingTransaction={editingTransaction}
            />
          </DialogContent>
        </Dialog>
      </div>

      <BankBalanceStats
        totalBalance={totalBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={filteredTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
};
