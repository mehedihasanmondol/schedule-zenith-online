
import { useState, useEffect, useMemo } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Profile } from "@/types/database";

interface ProfileSelectorProps {
  profiles: Profile[];
  selectedProfileId: string;
  onProfileSelect: (profileId: string) => void;
  label?: string;
  placeholder?: string;
  showRoleFilter?: boolean;
  className?: string;
}

export const ProfileSelector = ({
  profiles,
  selectedProfileId,
  onProfileSelect,
  label = "Profile",
  placeholder = "Select profile",
  showRoleFilter = true,
  className = ""
}: ProfileSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Get unique roles from profiles
  const availableRoles = useMemo(() => {
    const roles = [...new Set(profiles.map(p => p.role))];
    return roles.sort();
  }, [profiles]);

  // Filter profiles based on search term and role
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = profile.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) || false;
      
      const matchesRole = selectedRole === "all" || profile.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchTerm, selectedRole]);

  // Reset search when profiles change
  useEffect(() => {
    setSearchTerm("");
    setSelectedRole("all");
  }, [profiles]);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      
      {/* Search and Role Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
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

      {/* Profile Selection Dropdown */}
      <div>
        <Select value={selectedProfileId} onValueChange={onProfileSelect}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder}>
              {selectedProfile && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{selectedProfile.full_name} - {selectedProfile.role}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{profile.full_name} - {profile.role}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-results" disabled>
                No profiles found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {(searchTerm || selectedRole !== "all") && (
        <div className="text-sm text-gray-500">
          {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
};
