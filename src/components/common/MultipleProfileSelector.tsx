
import { useState, useMemo } from "react";
import { Search, User, Eye, EyeOff, Check, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/types/database";

interface MultipleProfileSelectorProps {
  profiles: Profile[];
  selectedProfileIds: string[];
  onProfileSelect: (profileIds: string[]) => void;
  label?: string;
  placeholder?: string;
  showRoleFilter?: boolean;
  className?: string;
}

export const MultipleProfileSelector = ({
  profiles,
  selectedProfileIds,
  onProfileSelect,
  label = "Profiles",
  placeholder = "Select profiles",
  showRoleFilter = true,
  className = ""
}: MultipleProfileSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const availableRoles = useMemo(() => {
    const roles = [...new Set(profiles.map(p => p.role))];
    return roles.sort();
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = profile.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) || false;
      
      const matchesRole = selectedRole === "all" || profile.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchTerm, selectedRole]);

  const selectedProfiles = profiles.filter(p => selectedProfileIds.includes(p.id));

  const handleProfileToggle = (profileId: string) => {
    const isSelected = selectedProfileIds.includes(profileId);
    if (isSelected) {
      onProfileSelect(selectedProfileIds.filter(id => id !== profileId));
    } else {
      onProfileSelect([...selectedProfileIds, profileId]);
    }
  };

  const selectAll = () => {
    onProfileSelect(filteredProfiles.map(p => p.id));
  };

  const clearAll = () => {
    onProfileSelect([]);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <Label>{label}</Label>}
      
      {/* Selection and View Controls */}
      <div className="flex gap-2">
        <Collapsible open={isSelectionOpen} onOpenChange={setIsSelectionOpen} className="flex-1">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Select Profiles ({selectedProfileIds.length})</span>
              </div>
              {isSelectionOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
              {/* Search and Role Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {showRoleFilter && (
                  <div className="sm:w-48">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAll}>
                  Select All ({filteredProfiles.length})
                </Button>
                <Button size="sm" variant="outline" onClick={clearAll}>
                  Clear Selection
                </Button>
              </div>

              {/* Profile List with Checkboxes */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center space-x-3 p-2 rounded border bg-white hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedProfileIds.includes(profile.id)}
                      onCheckedChange={() => handleProfileToggle(profile.id)}
                    />
                    <User className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium">{profile.full_name}</div>
                      <div className="text-sm text-gray-500">{profile.role} • ${profile.hourly_rate || 0}/hr</div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProfiles.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No profiles found
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* View Selected Profiles with List Icon */}
        <div className="relative">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsViewOpen(!isViewOpen)}
          >
            <List className="h-4 w-4" />
          </Button>
          
          {/* Absolute positioned dropdown for selected profiles */}
          {isViewOpen && selectedProfiles.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-80 max-w-sm border rounded-lg p-3 bg-white shadow-lg z-50">
              <h4 className="font-medium text-blue-900 mb-2">
                Selected Employees ({selectedProfiles.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{profile.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {profile.role} • ${profile.hourly_rate || 0}/hr
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{profile.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary */}
      {selectedProfileIds.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedProfileIds.length} profile{selectedProfileIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};
