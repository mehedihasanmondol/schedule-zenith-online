
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, DollarSign } from "lucide-react";
import type { BankAccount, Payroll } from "@/types/database";

interface BankSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bankAccountId: string) => void;
  payroll: Payroll | null;
  bankAccounts: BankAccount[];
  loading: boolean;
}

export const BankSelectionDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  payroll, 
  bankAccounts, 
  loading 
}: BankSelectionDialogProps) => {
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");

  const handleConfirm = () => {
    if (selectedBankAccount) {
      onConfirm(selectedBankAccount);
    }
  };

  if (!payroll) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Mark Payroll as Paid
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Employee:</span>
              <span>{payroll.profiles?.full_name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Period:</span>
              <span className="text-sm">
                {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Net Pay:</span>
              <span className="text-lg font-bold text-green-600">${payroll.net_pay.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="bank-account">Select Bank Account for Payment</Label>
            <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{account.bank_name}</span>
                      <span className="text-sm text-gray-600">
                        {account.account_number} - {account.account_holder_name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {bankAccounts.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                No bank accounts available. Please add a bank account first.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              This will create a withdrawal transaction and send a notification to the employee.
            </span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedBankAccount || loading || bankAccounts.length === 0}
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
