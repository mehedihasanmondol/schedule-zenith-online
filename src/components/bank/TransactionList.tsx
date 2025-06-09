
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Calendar, User, Building2, FolderOpen, DollarSign, Tag } from "lucide-react";
import { BankTransaction } from "@/types/database";

interface TransactionListProps {
  transactions: BankTransaction[];
  onEdit: (transaction: BankTransaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionList = ({ transactions, onEdit, onDelete }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found. Add your first transaction above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm leading-tight">
                  {transaction.description}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className={`font-semibold text-sm ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                  <Badge 
                    variant={transaction.type === 'deposit' ? 'default' : 'destructive'} 
                    className="text-xs mt-1"
                  >
                    {transaction.type}
                  </Badge>
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(transaction)}
                    className="text-blue-600 hover:text-blue-700 h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-xs">
              {/* Category */}
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-gray-400" />
                <Badge variant="outline" className="text-xs">
                  {transaction.category}
                </Badge>
              </div>
              
              {/* Client/Project */}
              {transaction.clients?.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium">
                      {transaction.clients.company}
                    </span>
                    {transaction.projects?.name && (
                      <div className="flex items-center gap-1 mt-1">
                        <FolderOpen className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-500">
                          {transaction.projects.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Profile */}
              {transaction.profiles?.full_name && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">
                    {transaction.profiles.full_name}
                  </span>
                </div>
              )}
              
              {/* Bank Account */}
              {transaction.bank_accounts && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">
                    {transaction.bank_accounts.bank_name} - ****{transaction.bank_accounts.account_number?.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
