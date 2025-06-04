
import { EnhancedTransactionTable } from "./EnhancedTransactionTable";
import { BankTransaction } from "@/types/database";

interface TransactionTableProps {
  transactions: BankTransaction[];
  onEdit: (transaction: BankTransaction) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const TransactionTable = ({ transactions, onEdit, onDelete, loading }: TransactionTableProps) => {
  return (
    <EnhancedTransactionTable 
      transactions={transactions}
      onEdit={onEdit}
      onDelete={onDelete}
      loading={loading}
    />
  );
};
