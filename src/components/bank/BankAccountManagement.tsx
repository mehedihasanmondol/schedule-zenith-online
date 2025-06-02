
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CreditCard, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BankAccount } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { BankAccountForm } from "./BankAccountForm";

interface BankAccountManagementProps {
  profileId: string;
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BankAccountManagement = ({ profileId, profileName, isOpen, onClose }: BankAccountManagementProps) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && profileId) {
      fetchBankAccounts();
    }
  }, [profileId, isOpen]);

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bank accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      // If setting as primary, remove primary status from other accounts
      if (formData.is_primary) {
        await supabase
          .from('bank_accounts')
          .update({ is_primary: false })
          .eq('profile_id', profileId);
      }

      if (editingAccount) {
        const { error } = await supabase
          .from('bank_accounts')
          .update(formData)
          .eq('id', editingAccount.id);

        if (error) throw error;
        toast({ title: "Success", description: "Bank account updated successfully" });
      } else {
        const { error } = await supabase
          .from('bank_accounts')
          .insert(formData);

        if (error) throw error;
        toast({ title: "Success", description: "Bank account added successfully" });
      }

      setIsFormOpen(false);
      setEditingAccount(null);
      fetchBankAccounts();
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save bank account",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Bank account deleted successfully" });
      fetchBankAccounts();
    } catch (error: any) {
      console.error('Error deleting bank account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank account",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Accounts - {profileName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Manage bank accounts for this profile</p>
            <Button onClick={() => setIsFormOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">Loading bank accounts...</div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bank accounts found</p>
              <p className="text-sm">Add a bank account to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{account.bank_name}</h3>
                        {account.is_primary && (
                          <Badge variant="default">Primary</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Account:</strong> {account.account_number}</p>
                        <p><strong>Holder:</strong> {account.account_holder_name}</p>
                        {account.bsb_code && <p><strong>BSB:</strong> {account.bsb_code}</p>}
                        {account.swift_code && <p><strong>SWIFT:</strong> {account.swift_code}</p>}
                        <p><strong>Balance:</strong> ${(account.opening_balance || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <BankAccountForm
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingAccount(null);
            }}
            onSubmit={handleSubmit}
            editingAccount={editingAccount}
            loading={formLoading}
            profileId={profileId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
