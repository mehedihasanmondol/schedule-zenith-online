
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { BankTransaction } from "@/types/database";

interface TransactionTableProps {
  transactions: BankTransaction[];
  onEdit: (transaction: BankTransaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable = ({ transactions, onEdit, onDelete }: TransactionTableProps) => {
  return (
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
          {transactions.map((transaction) => (
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
                    onClick={() => onEdit(transaction)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(transaction.id)}
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
  );
};
