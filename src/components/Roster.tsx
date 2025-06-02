import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Calendar, Clock, Users, DollarSign, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster as RosterType, Profile, Client, Project, RosterProfile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { MultipleProfileSelector } from "@/components/common/MultipleProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Roster = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar"); // Changed default to calendar
  const { toast } = useToast();

  const generateDefaultRosterName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `Roster ${dateStr} at ${timeStr}`;
  };

  const [formData, setFormData] = useState({
    profile_ids: [] as string[],
    client_id: "",
    project_id: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    notes: "",
    status: "pending",
    name: generateDefaultRosterName(),
    expected_profiles: 1,
    per_hour_rate: 0
  });

  useEffect(() => {
    fetchRosters();
    fetchProfiles();
    fetchClients();
    fetchProjects();
  }, []);

  const fetchRosters = async () => {
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
            profiles!roster_profiles_profile_id_fkey (id, full_name, role)
          )
        `)
        .order('created_at', { ascending: false });

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

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company');

      if (error) throw error;
      setClients(data as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const calculateTotalHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.max(0, diffHours);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.profile_ids.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one profile",
          variant: "destructive"
        });
        return;
      }

      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      const selectedClient = clients.find(c => c.id === formData.client_id);
      const selectedProject = projects.find(p => p.id === formData.project_id);
      
      const defaultName = selectedClient && selectedProject 
        ? `${selectedClient.company} - ${selectedProject.name} (${new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
        : "";
      const finalName = formData.name.trim() || defaultName || generateDefaultRosterName();
      
      // Create roster with first profile as primary
      const { data: roster, error: rosterError } = await supabase
        .from('rosters')
        .insert([{
          profile_id: formData.profile_ids[0], // Use first selected profile as primary
          client_id: formData.client_id,
          project_id: formData.project_id,
          date: formData.date,
          end_date: formData.end_date || null,
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_hours: totalHours,
          notes: formData.notes,
          status: formData.status,
          name: finalName,
          expected_profiles: formData.expected_profiles,
          per_hour_rate: formData.per_hour_rate
        }])
        .select()
        .single();

      if (rosterError) throw rosterError;

      // Create roster_profiles entries for all selected profiles
      const rosterProfilesData = formData.profile_ids.map(profileId => ({
        roster_id: roster.id,
        profile_id: profileId
      }));

      const { error: profilesError } = await supabase
        .from('roster_profiles')
        .insert(rosterProfilesData);

      if (profilesError) throw profilesError;

      toast({ title: "Success", description: "Roster created successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_ids: [],
        client_id: "",
        project_id: "",
        date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        notes: "",
        status: "pending",
        name: generateDefaultRosterName(),
        expected_profiles: 1,
        per_hour_rate: 0
      });
      fetchRosters();
    } catch (error) {
      console.error('Error saving roster:', error);
      toast({
        title: "Error",
        description: "Failed to save roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('rosters')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Roster ${status} successfully` 
      });
      fetchRosters();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const deleteRoster = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roster? This will also delete all associated working hours.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: "Roster deleted successfully" 
      });
      fetchRosters();
    } catch (error) {
      console.error('Error deleting roster:', error);
      toast({
        title: "Error",
        description: "Failed to delete roster",
        variant: "destructive"
      });
    }
  };

  const filteredRosters = rosters.filter(roster =>
    (roster.roster_profiles?.some(rp => 
      rp.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || false) ||
    (roster.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roster.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calendar view helper function
  const getCalendarRosters = () => {
    const rostersByDate: { [key: string]: RosterType[] } = {};
    filteredRosters.forEach(roster => {
      const dateKey = roster.date;
      if (!rostersByDate[dateKey]) {
        rostersByDate[dateKey] = [];
      }
      rostersByDate[dateKey].push(roster);
    });
    return rostersByDate;
  };

  const calendarRosters = getCalendarRosters();

  if (loading && rosters.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Roster Management</h1>
            <p className="text-gray-600">Schedule and manage team assignments with advanced features</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Roster
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Enhanced Roster</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Roster Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Auto-generated if left empty"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default: {generateDefaultRosterName()}
                </p>
              </div>

              <MultipleProfileSelector
                profiles={profiles}
                selectedProfileIds={formData.profile_ids}
                onProfileSelect={(profileIds) => setFormData({ ...formData, profile_ids: profileIds })}
                label="Select Team Members"
                placeholder="Choose team members"
                showRoleFilter={true}
                className="border rounded-lg p-3 bg-gray-50"
              />
              
              <div>
                <Label htmlFor="client_id">Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project_id">Project</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => !formData.client_id || p.client_id === formData.client_id).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Start Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.date}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected_profiles">Expected Team Members</Label>
                  <Input
                    id="expected_profiles"
                    type="number"
                    min="1"
                    value={formData.expected_profiles}
                    onChange={(e) => setFormData({ ...formData, expected_profiles: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="per_hour_rate">Hourly Rate (Optional)</Label>
                  <Input
                    id="per_hour_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.per_hour_rate}
                    onChange={(e) => setFormData({ ...formData, per_hour_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes for this roster..."
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Roster"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Rosters</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredRosters.length}</div>
            <p className="text-xs text-muted-foreground">All scheduled rosters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredRosters.filter(r => r.status === 'confirmed').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filteredRosters.reduce((sum, r) => sum + r.total_hours, 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expected Value</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${filteredRosters.reduce((sum, r) => sum + (r.total_hours * (r.per_hour_rate || 0)), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Estimated revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Roster Views</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(calendarRosters).map(([date, dateRosters]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3 border-b pb-2">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </h3>
                      <Badge variant="outline">{dateRosters.length}</Badge>
                    </div>
                    {dateRosters.map((roster) => (
                      <Card key={roster.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm">{roster.name || 'Unnamed Roster'}</h4>
                              <Badge variant={
                                roster.status === "confirmed" ? "default" : 
                                roster.status === "pending" ? "secondary" : "outline"
                              } className="text-xs">
                                {roster.status}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {roster.start_time} - {roster.end_time}
                              </div>
                            </div>
                            
                            <div className="text-xs">
                              <div className="font-medium">{roster.projects?.name}</div>
                              <div className="text-gray-600">{roster.clients?.company}</div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {roster.roster_profiles?.slice(0, 3).map((rp) => (
                                <Badge key={rp.id} variant="secondary" className="text-xs">
                                  {rp.profiles?.full_name}
                                </Badge>
                              ))}
                              {(roster.roster_profiles?.length || 0) > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(roster.roster_profiles?.length || 0) - 3} more
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-blue-600" />
                                <span>{roster.roster_profiles?.length || 0} assigned</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-purple-600" />
                                <span>{roster.total_hours}h</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
              
              {Object.keys(calendarRosters).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No rosters found for the selected criteria
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Roster Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Team Members</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date Range</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRosters.map((roster) => (
                      <tr key={roster.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{roster.name || 'Unnamed Roster'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {roster.roster_profiles?.map((rp) => (
                              <Badge key={rp.id} variant="secondary" className="text-xs">
                                {rp.profiles?.full_name}
                              </Badge>
                            )) || <span className="text-gray-500">No profiles assigned</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{roster.projects?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-600">{roster.clients?.company || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="text-sm">
                            {new Date(roster.date).toLocaleDateString()}
                            {roster.end_date && roster.end_date !== roster.date && (
                              <div className="text-xs text-gray-500">
                                to {new Date(roster.end_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="text-sm">
                            {roster.start_time} - {roster.end_time}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            roster.status === "confirmed" ? "default" : 
                            roster.status === "pending" ? "secondary" : "outline"
                          }>
                            {roster.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {roster.status === "pending" && roster.is_editable && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateStatus(roster.id, "confirmed")}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Confirm
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateStatus(roster.id, "cancelled")}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteRoster(roster.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
