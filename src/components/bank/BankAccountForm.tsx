
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BankAccount } from "@/types/database";

interface BankAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  editingAccount: BankAccount | null;
  loading: boolean;
  profileId: string;
}

export const BankAccountForm = ({ isOpen, onClose, onSubmit, editingAccount, loading, profileId }: BankAccountFormProps) => {
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    bsb_code: "",
    swift_code: "",
    account_holder_name: "",
    opening_balance: 0,
    is_primary: false
  });

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        bank_name: editingAccount.bank_name || "",
        account_number: editingAccount.account_number || "",
        bsb_code: editingAccount.bsb_code || "",
        swift_code: editingAccount.swift_code || "",
        account_holder_name: editingAccount.account_holder_name || "",
        opening_balance: editingAccount.opening_balance || 0,
        is_primary: editingAccount.is_primary || false
      });
    } else {
      setFormData({
        bank_name: "",
        account_number: "",
        bsb_code: "",
        swift_code: "",
        account_holder_name: "",
        opening_balance: 0,
        is_primary: false
      });
    }
  }, [editingAccount, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, profile_id: profileId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingAccount ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Enter bank name"
                required
              />
            </div>

            <div>
              <Label htmlFor="account_holder_name">Account Holder Name *</Label>
              <Input
                id="account_holder_name"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                placeholder="Enter account holder name"
                required
              />
            </div>

            <div>
              <Label htmlFor="account_number">Account Number *</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="Enter account number"
                required
              />
            </div>

            <div>
              <Label htmlFor="bsb_code">BSB Code</Label>
              <Input
                id="bsb_code"
                value={formData.bsb_code}
                onChange={(e) => setFormData({ ...formData, bsb_code: e.target.value })}
                placeholder="Enter BSB code"
              />
            </div>

            <div>
              <Label htmlFor="swift_code">SWIFT Code</Label>
              <Input
                id="swift_code"
                value={formData.swift_code}
                onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                placeholder="Enter SWIFT code"
              />
            </div>

            <div>
              <Label htmlFor="opening_balance">Opening Balance</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.01"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) => setFormData({ ...formData, is_primary: !!checked })}
            />
            <Label htmlFor="is_primary">Set as primary bank account</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : editingAccount ? "Update Account" : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
