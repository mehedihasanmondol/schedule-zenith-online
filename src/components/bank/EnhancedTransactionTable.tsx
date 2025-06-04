
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { BankTransaction } from "@/types/database";

interface EnhancedTransactionTableProps {
  transactions: BankTransaction[];
  onEdit: (transaction: BankTransaction) => void;
  onDelete: (id: string) => void;
  onView?: (transaction: BankTransaction) => void;
  loading?: boolean;
}

type SortField = 'date' | 'amount' | 'description' | 'type';
type SortDirection = 'asc' | 'desc';

export const EnhancedTransactionTable = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  onView,
  loading = false 
}: EnhancedTransactionTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get unique values for filters
  const uniqueCategories = useMemo(() => 
    [...new Set(transactions.map(t => t.category))].filter(Boolean),
    [transactions]
  );

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = !searchTerm || 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
      
      const matchesDateRange = (() => {
        if (dateRange === "all") return true;
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        
        switch (dateRange) {
          case "today":
            return transactionDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return transactionDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesType && matchesCategory && matchesDateRange;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, categoryFilter, dateRange, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Client/Project', 'Profile'],
      ...filteredAndSortedTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category,
        t.type,
        t.amount.toString(),
        t.clients?.company || 'N/A',
        t.profiles?.full_name || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDeposits = filteredAndSortedTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalWithdrawals = filteredAndSortedTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            Global Transactions
            <Badge variant="outline" className="ml-2">
              {filteredAndSortedTransactions.length} of {transactions.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Filters Bar */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600">
              Viewing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="border-b bg-blue-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-600">Total Deposits: </span>
                <span className="font-semibold text-green-600">+${totalDeposits.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Withdrawals: </span>
                <span className="font-semibold text-red-600">-${totalWithdrawals.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Net: </span>
                <span className={`font-semibold ${totalDeposits - totalWithdrawals >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(totalDeposits - totalWithdrawals).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50">
                <TableHead className="py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('date')}
                    className="h-auto p-0 font-medium text-gray-600 hover:text-gray-900"
                  >
                    Date {getSortIcon('date')}
                  </Button>
                </TableHead>
                <TableHead className="py-3 px-4">Doc type</TableHead>
                <TableHead className="py-3 px-4">Number</TableHead>
                <TableHead className="py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('description')}
                    className="h-auto p-0 font-medium text-gray-600 hover:text-gray-900"
                  >
                    Description {getSortIcon('description')}
                  </Button>
                </TableHead>
                <TableHead className="py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('amount')}
                    className="h-auto p-0 font-medium text-gray-600 hover:text-gray-900"
                  >
                    Final amount {getSortIcon('amount')}
                  </Button>
                </TableHead>
                <TableHead className="py-3 px-4">Tax</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                <TableHead className="py-3 px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading transactions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No transactions found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="py-3 px-4 text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant="outline" className="capitalize">
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-600">
                      #{transaction.id.slice(-6)}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{transaction.description}</div>
                        {transaction.category && (
                          <div className="text-sm text-gray-500">{transaction.category}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`font-medium ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)} €
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-600">
                      0.00
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge 
                        variant={transaction.type === 'deposit' ? 'default' : 'secondary'}
                        className={`${
                          transaction.type === 'deposit' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <ActionDropdown
                        items={[
                          {
                            label: "Edit",
                            onClick: () => onEdit(transaction),
                            icon: <Edit className="h-4 w-4" />
                          },
                          {
                            label: "Export", 
                            onClick: () => {},
                            icon: <Download className="h-4 w-4" />
                          },
                          ...(onView ? [{
                            label: "View",
                            onClick: () => onView(transaction),
                            icon: <Eye className="h-4 w-4" />
                          }] : []),
                          {
                            label: "Delete",
                            onClick: () => onDelete(transaction.id),
                            icon: <Trash2 className="h-4 w-4" />,
                            variant: "destructive" as const
                          }
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Viewing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length}
              </span>
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
