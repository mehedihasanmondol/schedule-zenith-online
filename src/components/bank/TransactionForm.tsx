
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BankTransaction, BankAccount, Profile, Client, Project } from "@/types/database";

interface TransactionFormProps {
  formData: {
    client_id: string;
    project_id: string;
    profile_id: string;
    bank_account_id: string;
    amount: number;
    category: "income" | "expense" | "transfer" | "salary" | "equipment" | "materials" | "travel" | "office" | "utilities" | "marketing" | "other";
    description: string;
    type: "deposit" | "withdrawal";
    date: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  bankAccounts: BankAccount[];
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
  loading: boolean;
  editingTransaction: BankTransaction | null;
}

export const TransactionForm = ({
  formData,
  setFormData,
  onSubmit,
  bankAccounts,
  profiles,
  clients,
  projects,
  loading,
  editingTransaction
}: TransactionFormProps) => {
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
    { value: "other", label: "Other" }
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_id">Client</Label>
          <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Client</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="project_id">Project</Label>
          <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Project</SelectItem>
              {projects.filter(p => !formData.client_id || p.client_id === formData.client_id).map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="profile_id">Profile</Label>
          <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Profile</SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bank_account_id">Bank Account *</Label>
          <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
            <SelectTrigger>
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

        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as typeof formData.category })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as "deposit" | "withdrawal" })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter transaction description"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : editingTransaction ? "Update Transaction" : "Add Transaction"}
      </Button>
    </form>
  );
};
