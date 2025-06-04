
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Edit, 
  Trash2, 
  CreditCard, 
  Search, 
  Settings, 
  Download, 
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter
} from "lucide-react";
import { Profile } from "@/types/database";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface EnhancedProfileTableProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onManageBank?: (profile: Profile) => void;
  loading?: boolean;
}

interface ColumnConfig {
  key: keyof Profile | 'actions';
  label: string;
  visible: boolean;
  searchable: boolean;
  sortable: boolean;
}

const defaultColumns: ColumnConfig[] = [
  { key: 'full_name', label: 'Name', visible: true, searchable: true, sortable: true },
  { key: 'email', label: 'Email', visible: true, searchable: true, sortable: true },
  { key: 'phone', label: 'Phone', visible: true, searchable: true, sortable: true },
  { key: 'role', label: 'Role', visible: true, searchable: true, sortable: true },
  { key: 'hourly_rate', label: 'Hourly Rate', visible: true, searchable: false, sortable: true },
  { key: 'is_active', label: 'Status', visible: true, searchable: true, sortable: true },
  { key: 'created_at', label: 'Created', visible: true, searchable: false, sortable: true },
  { key: 'actions', label: 'Actions', visible: true, searchable: false, sortable: false },
];

export const EnhancedProfileTable = ({ 
  profiles, 
  onEdit, 
  onDelete, 
  onManageBank, 
  loading = false 
}: EnhancedProfileTableProps) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [globalSearch, setGlobalSearch] = useState("");
  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      employee: 'Employee',
      accountant: 'Accountant',
      operation: 'Operations',
      sales_manager: 'Sales Manager'
    };
    return roleLabels[role] || role;
  };

  const filteredProfiles = useMemo(() => {
    let filtered = [...profiles];

    // Global search
    if (globalSearch) {
      filtered = filtered.filter(profile => 
        Object.values(profile).some(value => 
          String(value).toLowerCase().includes(globalSearch.toLowerCase())
        )
      );
    }

    // Column-specific searches
    Object.entries(columnSearches).forEach(([column, search]) => {
      if (search) {
        filtered = filtered.filter(profile => {
          const value = profile[column as keyof Profile];
          return String(value).toLowerCase().includes(search.toLowerCase());
        });
      }
    });

    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Profile];
        const bVal = b[sortConfig.key as keyof Profile];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [profiles, globalSearch, columnSearches, sortConfig]);

  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(startIndex, startIndex + pageSize);
  }, [filteredProfiles, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProfiles.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === columnKey ? { ...col, visible } : col
      )
    );
  };

  const handleColumnSearch = (column: string, value: string) => {
    setColumnSearches(prev => ({ ...prev, [column]: value }));
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const visibleColumns = columns.filter(col => col.visible && col.key !== 'actions');
    const headers = visibleColumns.map(col => col.label);
    
    const data = filteredProfiles.map(profile => 
      visibleColumns.map(col => {
        if (col.key === 'is_active') return profile.is_active ? 'Active' : 'Inactive';
        if (col.key === 'role') return getRoleLabel(profile.role);
        if (col.key === 'hourly_rate') return `$${(profile.hourly_rate || 0).toFixed(2)}/hr`;
        if (col.key === 'created_at') return new Date(profile.created_at).toLocaleDateString();
        return profile[col.key as keyof Profile] || 'N/A';
      })
    );

    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profiles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const visibleColumns = columns.filter(col => col.visible && col.key !== 'actions');
    const headers = visibleColumns.map(col => col.label);
    
    const data = filteredProfiles.map(profile => 
      visibleColumns.reduce((row, col) => {
        let value: any = profile[col.key as keyof Profile];
        
        if (col.key === 'is_active') value = profile.is_active ? 'Active' : 'Inactive';
        else if (col.key === 'role') value = getRoleLabel(profile.role);
        else if (col.key === 'hourly_rate') value = `$${(profile.hourly_rate || 0).toFixed(2)}/hr`;
        else if (col.key === 'created_at') value = new Date(profile.created_at).toLocaleDateString();
        
        row[col.label] = value || 'N/A';
        return row;
      }, {} as Record<string, any>)
    );

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profiles');
    XLSX.writeFile(wb, `profiles-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const visibleColumns = columns.filter(col => col.visible && col.key !== 'actions');
    
    const headers = visibleColumns.map(col => col.label);
    const data = filteredProfiles.map(profile => 
      visibleColumns.map(col => {
        if (col.key === 'is_active') return profile.is_active ? 'Active' : 'Inactive';
        if (col.key === 'role') return getRoleLabel(profile.role);
        if (col.key === 'hourly_rate') return `$${(profile.hourly_rate || 0).toFixed(2)}/hr`;
        if (col.key === 'created_at') return new Date(profile.created_at).toLocaleDateString();
        return String(profile[col.key as keyof Profile] || 'N/A');
      })
    );

    (doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`profiles-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const printTable = () => {
    const visibleColumns = columns.filter(col => col.visible && col.key !== 'actions');
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      const tableHTML = `
        <html>
          <head>
            <title>Profiles Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .header { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Profiles Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Total Records: ${filteredProfiles.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  ${visibleColumns.map(col => `<th>${col.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${filteredProfiles.map(profile => `
                  <tr>
                    ${visibleColumns.map(col => {
                      let value = profile[col.key as keyof Profile];
                      if (col.key === 'is_active') value = profile.is_active ? 'Active' : 'Inactive';
                      else if (col.key === 'role') value = getRoleLabel(profile.role);
                      else if (col.key === 'hourly_rate') value = `$${(profile.hourly_rate || 0).toFixed(2)}/hr`;
                      else if (col.key === 'created_at') value = new Date(profile.created_at).toLocaleDateString();
                      return `<td>${value || 'N/A'}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      printWindow.document.write(tableHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search all columns..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {/* Column Visibility */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium">Toggle Columns</h4>
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={column.visible}
                      onCheckedChange={(checked) => 
                        handleColumnVisibilityChange(column.key, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={column.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printTable}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {columns.filter(col => col.visible).map((column) => (
                  <TableHead key={column.key} className="font-semibold">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {column.sortable ? (
                          <button
                            onClick={() => handleSort(column.key)}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            {column.label}
                            {sortConfig?.key === column.key && (
                              <span className="text-xs">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        ) : (
                          column.label
                        )}
                      </div>
                      {column.searchable && (
                        <Input
                          placeholder={`Search ${column.label.toLowerCase()}...`}
                          value={columnSearches[column.key] || ''}
                          onChange={(e) => handleColumnSearch(column.key, e.target.value)}
                          className="h-8 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProfiles.length > 0 ? (
                paginatedProfiles.map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-gray-50">
                    {columns.filter(col => col.visible).map((column) => (
                      <TableCell key={column.key} className="py-4">
                        {column.key === 'full_name' && (
                          <div className="font-medium">{profile.full_name || 'Unnamed User'}</div>
                        )}
                        {column.key === 'email' && (
                          <div className="text-gray-600">{profile.email}</div>
                        )}
                        {column.key === 'phone' && (
                          <div className="text-gray-600">{profile.phone || 'N/A'}</div>
                        )}
                        {column.key === 'role' && (
                          <div className="text-gray-600">{getRoleLabel(profile.role)}</div>
                        )}
                        {column.key === 'hourly_rate' && (
                          <div className="font-medium text-green-600">
                            ${(profile.hourly_rate || 0).toFixed(2)}/hr
                          </div>
                        )}
                        {column.key === 'is_active' && (
                          <Badge variant={profile.is_active ? "default" : "secondary"}>
                            {profile.is_active ? "Active" : "Inactive"}
                          </Badge>
                        )}
                        {column.key === 'created_at' && (
                          <div className="text-gray-600">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </div>
                        )}
                        {column.key === 'actions' && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(profile)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {onManageBank && (
                              <Button variant="ghost" size="sm" onClick={() => onManageBank(profile)}>
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700" 
                              onClick={() => onDelete(profile.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={columns.filter(col => col.visible).length} 
                    className="text-center py-8 text-gray-500"
                  >
                    No profiles found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredProfiles.length)} of {filteredProfiles.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
