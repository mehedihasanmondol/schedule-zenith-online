
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EditWorkingHoursDialog } from "./EditWorkingHoursDialog";
import { WorkingHoursActions } from "./working-hours/WorkingHoursActions";

export const WorkingHoursComponent = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<WorkingHour | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [hoursRes, profilesRes, clientsRes, projectsRes] = await Promise.all([
        supabase.from('working_hours').select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, email, role),
          clients!working_hours_client_id_fkey (id, name, company),
          projects!working_hours_project_id_fkey (id, name)
        `).order('date', { ascending: false }),
        
        supabase.from('profiles').select('*').eq('is_active', true).order('full_name'),
        supabase.from('clients').select('*').eq('status', 'active').order('name'),
        supabase.from('projects').select('*').eq('status', 'active').order('name')
      ]);

      if (hoursRes.error) throw hoursRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setWorkingHours(hoursRes.data as WorkingHour[]);
      setProfiles(profilesRes.data as Profile[]);
      setClients(clientsRes.data as Client[]);
      setProjects(projectsRes.data as Project[]);
    } catch (error: any) {
      console.error('Error fetching working hours data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch working hours data",
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
        .from('working_hours')
        .upsert(formattedEntries);

      if (error) throw error;
      
      toast({ title: "Success", description: `${entries.length} working hour entries added successfully` });
      fetchData();
    } catch (error: any) {
      console.error('Error adding bulk working hours:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add working hours",
        variant: "destructive"
      });
    }
  };

  const totalHours = workingHours.reduce((sum, hour) => sum + hour.total_hours, 0);
  const approvedHours = workingHours.filter(h => h.status === 'approved').reduce((sum, hour) => sum + hour.total_hours, 0);
  const pendingHours = workingHours.filter(h => h.status === 'pending').reduce((sum, hour) => sum + hour.total_hours, 0);
  const totalPayable = workingHours.reduce((sum, hour) => sum + (hour.payable_amount || 0), 0);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading working hours...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Working Hours Management</h1>
            <p className="text-gray-600">Track and manage employee working hours</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Hours
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">All recorded hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved Hours</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Ready for payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Hours</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payable</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${totalPayable.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total amount due</p>
          </CardContent>
        </Card>
      </div>

      <WorkingHoursActions 
        workingHours={workingHours}
        profiles={profiles}
        clients={clients}
        projects={projects}
        onRefresh={fetchData}
        onBulkAdd={handleBulkAdd}
        onEdit={(hour) => {
          setEditingHour(hour);
          setIsFormOpen(true);
        }}
      />

      <EditWorkingHoursDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHour(null);
        }}
        editingHour={editingHour}
        onRefresh={fetchData}
      />
    </div>
  );
};
