
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RosterEntry, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EnhancedRosterCalendarView } from "./roster/EnhancedRosterCalendarView";

export const RosterComponent = () => {
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [rosterRes, profilesRes, clientsRes, projectsRes] = await Promise.all([
        supabase.from('roster').select(`
          *,
          profiles!roster_profile_id_fkey (id, full_name, email, role),
          clients!roster_client_id_fkey (id, name, company),
          projects!roster_project_id_fkey (id, name)
        `).order('date', { ascending: false }),
        
        supabase.from('profiles').select('*').eq('is_active', true).order('full_name'),
        supabase.from('clients').select('*').eq('status', 'active').order('name'),
        supabase.from('projects').select('*').eq('status', 'active').order('name')
      ]);

      if (rosterRes.error) throw rosterRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setRosterEntries(rosterRes.data as RosterEntry[]);
      setProfiles(profilesRes.data as Profile[]);
      setClients(clientsRes.data as Client[]);
      setProjects(projectsRes.data as Project[]);
    } catch (error: any) {
      console.error('Error fetching roster data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roster data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async (entries: any[]) => {
    try {
      // Fix the status type to match the expected enum
      const formattedEntries = entries.map(entry => ({
        ...entry,
        status: 'pending' as const // Ensure status matches the enum type
      }));

      // Use upsert for bulk operations to handle conflicts better
      const { error } = await supabase
        .from('roster')
        .upsert(formattedEntries);

      if (error) throw error;
      
      toast({ title: "Success", description: `${entries.length} roster entries added successfully` });
      fetchData();
    } catch (error: any) {
      console.error('Error adding bulk roster entries:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add roster entries",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading roster...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roster Management</h1>
            <p className="text-gray-600">Schedule and manage work assignments</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{rosterEntries.length}</div>
            <p className="text-xs text-muted-foreground">Active roster entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Profiles</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Available team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {rosterEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                const now = new Date();
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                return entryDate >= weekStart && entryDate <= weekEnd;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled entries</p>
          </CardContent>
        </Card>
      </div>

      <EnhancedRosterCalendarView 
        rosterEntries={rosterEntries}
        profiles={profiles}
        clients={clients}
        projects={projects}
        onRefresh={fetchData}
        onBulkAdd={handleBulkAdd}
      />
    </div>
  );
};
