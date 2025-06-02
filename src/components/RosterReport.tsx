
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, DollarSign, Building2, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster as RosterType, Profile, Client, Project, WorkingHour } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const RosterReport = () => {
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRostersForDate();
    fetchWorkingHours();
  }, [selectedDate]);

  const fetchRostersForDate = async () => {
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select(`
          *,
          clients!rosters_client_id_fkey (id, company),
          projects!rosters_project_id_fkey (id, name),
          roster_profiles!roster_profiles_roster_id_fkey (
            id,
            profile_id,
            profiles!roster_profiles_profile_id_fkey (id, full_name, role, hourly_rate)
          )
        `)
        .eq('date', selectedDate)
        .order('start_time');

      if (error) throw error;
      
      const rostersData = (data || []).map(roster => ({
        ...roster,
        clients: Array.isArray(roster.clients) ? roster.clients[0] : roster.clients,
        projects: Array.isArray(roster.projects) ? roster.projects[0] : roster.projects,
        roster_profiles: roster.roster_profiles || []
      }));
      
      setRosters(rostersData as RosterType[]);
    } catch (error) {
      console.error('Error fetching rosters:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rosters",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, hourly_rate)
        `)
        .eq('date', selectedDate);

      if (error) throw error;
      setWorkingHours(data as WorkingHour[]);
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  const getRosterStats = (roster: RosterType) => {
    const rosterWorkingHours = workingHours.filter(wh => wh.roster_id === roster.id);
    const assignedProfiles = roster.roster_profiles?.length || 0;
    const pendingProfiles = rosterWorkingHours.filter(wh => wh.status === 'pending').length;
    const totalHours = rosterWorkingHours.reduce((sum, wh) => sum + (wh.actual_hours || wh.total_hours), 0);
    const totalPayable = rosterWorkingHours.reduce((sum, wh) => sum + (wh.payable_amount || 0), 0);

    return { assignedProfiles, pendingProfiles, totalHours, totalPayable };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading roster report...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roster Calendar Report</h1>
            <p className="text-gray-600">Daily roster overview with detailed insights</p>
          </div>
        </div>
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {formatDate(selectedDate)} - {rosters.length} Roster{rosters.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rosters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rosters scheduled for this date
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rosters.map((roster) => {
                const stats = getRosterStats(roster);
                return (
                  <Card key={roster.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {roster.name || 'Unnamed Roster'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {roster.start_time} - {roster.end_time}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          roster.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : roster.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {roster.status}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{roster.clients?.company}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{roster.projects?.name}</span>
                      </div>

                      {/* Team Members */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">Team Members:</div>
                        <div className="flex flex-wrap gap-1">
                          {roster.roster_profiles?.slice(0, 3).map((rp) => (
                            <span key={rp.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {rp.profiles?.full_name}
                            </span>
                          ))}
                          {(roster.roster_profiles?.length || 0) > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{(roster.roster_profiles?.length || 0) - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-lg font-bold text-blue-600">
                              {stats.assignedProfiles}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Assigned</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-lg font-bold text-orange-600">
                              {stats.pendingProfiles}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-lg font-bold text-purple-600">
                              {stats.totalHours.toFixed(1)}h
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Total Hours</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-lg font-bold text-green-600">
                              ${stats.totalPayable.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Payable</p>
                        </div>
                      </div>

                      {roster.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600 italic">"{roster.notes}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
