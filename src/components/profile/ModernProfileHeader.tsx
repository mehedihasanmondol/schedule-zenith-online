
import { Users, Plus, Filter, Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ModernProfileHeaderProps {
  totalProfiles: number;
  activeProfiles: number;
  onAddProfile: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const ModernProfileHeader = ({ 
  totalProfiles, 
  activeProfiles, 
  onAddProfile, 
  onRefresh,
  loading = false 
}: ModernProfileHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Profile Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your team with server-side pagination and exports
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {totalProfiles} Total
              </Badge>
              <Badge variant="default" className="bg-green-100 text-green-700">
                {activeProfiles} Active
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="hover:bg-blue-50 border-blue-200"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={onAddProfile}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
