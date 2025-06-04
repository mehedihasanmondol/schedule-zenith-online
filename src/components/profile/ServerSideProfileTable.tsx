
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Building2, Search, Download, FileText } from "lucide-react";
import { Profile } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServerSideProfileTableProps {
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onManageBank: (profile: Profile) => void;
}

interface PaginatedResponse {
  data: Profile[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const ServerSideProfileTable = ({ onEdit, onDelete, onManageBank }: ServerSideProfileTableProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const { toast } = useToast();

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('profile-operations', {
        body: {
          operation: 'paginate',
          page: currentPage,
          pageSize,
          search,
          sortBy,
          sortOrder
        }
      });

      if (error) throw error;

      const response = data as PaginatedResponse;
      setProfiles(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('profile-operations', {
        body: {
          operation: 'export',
          search,
          sortBy,
          sortOrder,
          format
        }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([format === 'csv' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profiles-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Profiles exported as ${format.toUpperCase()}`
      });
    } catch (error: any) {
      console.error('Error exporting profiles:', error);
      toast({
        title: "Error",
        description: "Failed to export profiles",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [currentPage, pageSize, search, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      employee: "bg-blue-100 text-blue-800",
      accountant: "bg-green-100 text-green-800",
      operation: "bg-purple-100 text-purple-800",
      sales_manager: "bg-orange-100 text-orange-800"
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading profiles...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search profiles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('full_name')}>
                Name {sortBy === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Employment</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('hourly_rate')}>
                Rate {sortBy === 'hourly_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('is_active')}>
                Status {sortBy === 'is_active' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback>
                        {profile.full_name?.charAt(0) || profile.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{profile.phone || "-"}</TableCell>
                <TableCell>
                  <Badge className={getRoleColor(profile.role)}>
                    {profile.role}
                  </Badge>
                </TableCell>
                <TableCell>{profile.employment_type || "-"}</TableCell>
                <TableCell>
                  {profile.hourly_rate ? `$${profile.hourly_rate}/hr` : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={profile.is_active ? "default" : "secondary"}>
                    {profile.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(profile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManageBank(profile)}
                    >
                      <Building2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
        </div>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(Math.min(pagination.totalPages, currentPage + 1))}
                className={currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
