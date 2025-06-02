
import { useState, useEffect, useMemo } from "react";
import { Search, User, Filter, CheckCircle2, Circle, Users, Building2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Profile, WorkingHour } from "@/types/database";

interface EnhancedProfileSelectorProps {
  profiles: Profile[];
  workingHours?: WorkingHour[];
  selectedProfileIds: string[];
  onProfileSelect: (profileIds: string[]) => void;
  mode?: 'single' | 'multiple';
  label?: string;
  placeholder?: string;
  showFilters?: boolean;
  showStats?: boolean;
  className?: string;
}

export const EnhancedProfileSelector = ({
  profiles,
  workingHours = [],
  selectedProfileIds,
  onProfileSelect,
  mode = 'multiple',
  label = "Select Profiles",
  placeholder = "Search and select profiles",
  showFilters = true,
  showStats = true,
  className = ""
}: EnhancedProfileSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get unique roles and employment types
  const availableRoles = useMemo(() => {
    const roles = [...new Set(profiles.map(p => p.role))];
    return roles.sort();
  }, [profiles]);

  const availableEmploymentTypes = useMemo(() => {
    const types = [...new Set(profiles.map(p => p.employment_type).filter(Boolean))];
    return types.sort();
  }, [profiles]);

  // Calculate working hours stats for each profile
  const profileStats = useMemo(() => {
    const stats: Record<string, { totalHours: number; unpaidHours: number; avgHourlyRate: number }> = {};
    
    profiles.forEach(profile => {
      const profileHours = workingHours.filter(wh => wh.profile_id === profile.id);
      const totalHours = profileHours.reduce((sum, wh) => sum + wh.total_hours, 0);
      const unpaidHours = profileHours.filter(wh => wh.status === 'approved').reduce((sum, wh) => sum + wh.total_hours, 0);
      const avgHourlyRate = profile.hourly_rate || 0;
      
      stats[profile.id] = { totalHours, unpaidHours, avgHourlyRate };
    });
    
    return stats;
  }, [profiles, workingHours]);

  // Filter and sort profiles
  const filteredProfiles = useMemo(() => {
    let filtered = profiles.filter(profile => {
      const matchesSearch = profile.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) || false;
      
      const matchesRole = selectedRole === "all" || profile.role === selectedRole;
      const matchesEmploymentType = selectedEmploymentType === "all" || profile.employment_type === selectedEmploymentType;
      
      return matchesSearch && matchesRole && matchesEmploymentType;
    });

    // Sort profiles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'role':
          return a.role.localeCompare(b.role);
        case 'hours':
          return (profileStats[b.id]?.unpaidHours || 0) - (profileStats[a.id]?.unpaidHours || 0);
        case 'rate':
          return (b.hourly_rate || 0) - (a.hourly_rate || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [profiles, searchTerm, selectedRole, selectedEmploymentType, sortBy, profileStats]);

  const handleProfileToggle = (profileId: string) => {
    if (mode === 'single') {
      onProfileSelect([profileId]);
    } else {
      const newSelection = selectedProfileIds.includes(profileId)
        ? selectedProfileIds.filter(id => id !== profileId)
        : [...selectedProfileIds, profileId];
      onProfileSelect(newSelection);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredProfiles.map(p => p.id);
    onProfileSelect(allFilteredIds);
  };

  const handleClearAll = () => {
    onProfileSelect([]);
  };

  const selectedProfiles = profiles.filter(p => selectedProfileIds.includes(p.id));

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label className="text-base font-semibold">{label}</Label>}
      
      {/* Search and Quick Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-40">
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="hours">Unpaid Hours</SelectItem>
                <SelectItem value="rate">Hourly Rate</SelectItem>
              </SelectContent>
            </Select>

            {mode === 'multiple' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All ({filteredProfiles.length})
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Advanced
            </Button>
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Employment Type</Label>
                  <Select value={selectedEmploymentType} onValueChange={setSelectedEmploymentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {availableEmploymentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type?.charAt(0).toUpperCase() + type?.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selection Summary */}
      {mode === 'multiple' && selectedProfileIds.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{selectedProfileIds.length} profiles selected</span>
              </div>
              {showStats && (
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Total Hours: {selectedProfiles.reduce((sum, p) => sum + (profileStats[p.id]?.unpaidHours || 0), 0).toFixed(1)}</span>
                  <span>Avg Rate: ${(selectedProfiles.reduce((sum, p) => sum + (p.hourly_rate || 0), 0) / selectedProfiles.length).toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile List */}
      <Card className="max-h-96 overflow-y-auto">
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredProfiles.map((profile) => {
              const isSelected = selectedProfileIds.includes(profile.id);
              const stats = profileStats[profile.id];
              
              return (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleProfileToggle(profile.id)}
                >
                  <div className="flex items-center gap-3">
                    {mode === 'multiple' ? (
                      <Checkbox checked={isSelected} onChange={() => {}} />
                    ) : (
                      isSelected ? <CheckCircle2 className="h-5 w-5 text-blue-600" /> : <Circle className="h-5 w-5 text-gray-300" />
                    )}
                    
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback>
                        {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{profile.full_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {profile.role}
                        </Badge>
                        {profile.employment_type && (
                          <Badge variant="outline" className="text-xs">
                            {profile.employment_type}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Rate: ${profile.hourly_rate || 0}/hr
                        {stats && showStats && (
                          <span className="ml-4">
                            Unpaid Hours: {stats.unpaidHours.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {showStats && stats && (
                    <div className="text-right text-sm">
                      <div className="font-medium text-green-600">
                        ${(stats.unpaidHours * (profile.hourly_rate || 0)).toFixed(2)}
                      </div>
                      <div className="text-gray-500">potential pay</div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No profiles found matching your criteria</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredProfiles.length} of {profiles.length} profiles
        {mode === 'multiple' && ` • ${selectedProfileIds.length} selected`}
      </div>
    </div>
  );
};
