
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Profile } from "@/types/database";

interface ProfileStatsProps {
  profiles: Profile[];
}

export const ProfileStats = ({ profiles }: ProfileStatsProps) => {
  const activeProfiles = profiles.filter(profile => profile.is_active);
  const inactiveProfiles = profiles.filter(profile => !profile.is_active);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Profiles
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{profiles.length}</div>
          <p className="text-xs text-muted-foreground">All team members</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Active Profiles
          </CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeProfiles.length}</div>
          <p className="text-xs text-muted-foreground">Currently active</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Inactive Profiles
          </CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{inactiveProfiles.length}</div>
          <p className="text-xs text-muted-foreground">Deactivated members</p>
        </CardContent>
      </Card>
    </div>
  );
};
