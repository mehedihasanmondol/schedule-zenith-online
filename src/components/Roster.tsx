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
import { EnhancedRosterCalendarView } from "@/components/roster/EnhancedRosterCalendarView";
import { RosterWeeklyFilter } from "@/components/roster/RosterWeeklyFilter";
import { RosterActions } from "@/components/roster/RosterActions";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { RosterEditDialog } from "@/components/roster/RosterEditDialog";
import { RosterViewDialog } from "@/components/roster/RosterViewDialog";

export const RosterComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentWeek, setCurrentWeek] = useState(new Date());
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

  const [editingRoster, setEditingRoster] = useState<RosterType | null>(null);
  const [viewingRoster, setViewingRoster] = useState<RosterType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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
        .insert({
          profile_id: formData.profile_ids[0], // Use first selected profile as primary
          client_id: formData.client_id,
          project_id: formData.project_id,
          date: formData.date,
          end_date: formData.end_date || null,
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_hours: totalHours,
          notes: formData.notes,
          status: formData.status as 'pending' | 'confirmed' | 'cancelled',
          name: finalName,
          expected_profiles: formData.expected_profiles,
          per_hour_rate: formData.per_hour_rate
        })
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

  const handleEditRoster = (roster: RosterType) => {
    setEditingRoster(roster);
    setIsEditDialogOpen(true);
  };

  const handleViewRoster = (roster: RosterType) => {
    setViewingRoster(roster);
    setIsViewDialogOpen(true);
  };

  const handleEditSave = () => {
    fetchRosters();
    setEditingRoster(null);
  };

  // Filter rosters based on search term
  const filteredRosters = rosters.filter(roster =>
    (roster.roster_profiles?.some(rp => 
      rp.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || false) ||
    (roster.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roster.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter rosters for current week (for list view)
  const getWeekFilteredRosters = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    
    return filteredRosters.filter(roster => {
      const rosterStartDate = parseISO(roster.date);
      const rosterEndDate = roster.end_date ? parseISO(roster.end_date) : rosterStartDate;
      
      return isWithinInterval(rosterStartDate, { start: weekStart, end: weekEnd }) ||
             isWithinInterval(rosterEndDate, { start: weekStart, end: weekEnd }) ||
             (rosterStartDate <= weekStart && rosterEndDate >= weekEnd);
    });
  };

  const weekFilteredRosters = getWeekFilteredRosters();

  // Updated calendar view helper function
  const getCalendarRosters = () => {
    return filteredRosters;
  };

  const calendarRosters = getCalendarRosters();

  if (loading && rosters.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Mobile-friendly header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Enhanced Roster Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Schedule and manage team assignments with advanced features</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Create Roster</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md lg:max-w-3xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Create Enhanced Roster</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Roster Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Auto-generated if left empty"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: {generateDefaultRosterName()}
                </p>
              </div>

              <div className="space-y-3">
                <MultipleProfileSelector
                  profiles={profiles}
                  selectedProfileIds={formData.profile_ids}
                  onProfileSelect={(profileIds) => setFormData({ ...formData, profile_ids: profileIds })}
                  label="Select Team Members"
                  placeholder="Choose team members"
                  showRoleFilter={true}
                  className="border rounded-lg p-3 bg-gray-50"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id" className="text-sm font-medium">Client</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="project_id" className="text-sm font-medium">Project</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                    <SelectTrigger className="mt-1">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date" className="text-sm font-medium">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.date}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time" className="text-sm font-medium">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end_time" className="text-sm font-medium">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected_profiles" className="text-sm font-medium">Expected Team Members</Label>
                  <Input
                    id="expected_profiles"
                    type="number"
                    min="1"
                    value={formData.expected_profiles}
                    onChange={(e) => setFormData({ ...formData, expected_profiles: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="per_hour_rate" className="text-sm font-medium">Hourly Rate (Optional)</Label>
                  <Input
                    id="per_hour_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.per_hour_rate}
                    onChange={(e) => setFormData({ ...formData, per_hour_rate: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes for this roster..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Roster"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile-friendly stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Rosters</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{filteredRosters.length}</div>
            <p className="text-xs text-muted-foreground">All scheduled rosters</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Confirmed</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              {filteredRosters.filter(r => r.status === 'confirmed').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to work</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
              {filteredRosters.reduce((sum, r) => sum + r.total_hours, 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled hours</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Expected Value</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
              ${filteredRosters.reduce((sum, r) => sum + (r.total_hours * (r.per_hour_rate || 0)), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Estimated revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg sm:text-xl">Roster Views</CardTitle>
            <div className="relative w-full sm:w-64">
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
        <CardContent className="p-4 sm:p-6 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="calendar" className="text-sm">Calendar View</TabsTrigger>
              <TabsTrigger value="list" className="text-sm">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-4 sm:mt-6">
              <EnhancedRosterCalendarView 
                rosters={calendarRosters} 
                onEdit={handleEditRoster}
                onDelete={deleteRoster}
                onView={handleViewRoster}
              />
            </TabsContent>
            
            <TabsContent value="list" className="mt-4 sm:mt-6 space-y-4">
              <RosterWeeklyFilter 
                currentWeek={currentWeek}
                onWeekChange={setCurrentWeek}
              />
              
              {/* Mobile-friendly table */}
              <div className="space-y-4 sm:space-y-0">
                {/* Mobile cards for smaller screens */}
                <div className="block sm:hidden space-y-4">
                  {weekFilteredRosters.map((roster) => (
                    <Card key={roster.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {roster.name || 'Unnamed Roster'}
                            </h3>
                            <div className="mt-1">
                              <div className="text-sm text-gray-600">
                                {roster.projects?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {roster.clients?.company || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant={
                              roster.status === "confirmed" ? "default" : 
                              roster.status === "pending" ? "secondary" : "outline"
                            } className="text-xs">
                              {roster.status}
                            </Badge>
                            <RosterActions
                              roster={roster}
                              onEdit={handleEditRoster}
                              onDelete={deleteRoster}
                              onView={handleViewRoster}
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {roster.roster_profiles?.map((rp) => (
                            <Badge key={rp.id} variant="secondary" className="text-xs">
                              {rp.profiles?.full_name}
                            </Badge>
                          )) || <span className="text-xs text-gray-500">No profiles assigned</span>}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>
                            {new Date(roster.date).toLocaleDateString()}
                            {roster.end_date && roster.end_date !== roster.date && (
                              <span className="text-gray-500">
                                {' '}to {new Date(roster.end_date).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                          <span>{roster.start_time} - {roster.end_time}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop table for larger screens */}
                <div className="hidden sm:block overflow-x-auto">
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
                      {weekFilteredRosters.map((roster) => (
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
                            <RosterActions
                              roster={roster}
                              onEdit={handleEditRoster}
                              onDelete={deleteRoster}
                              onView={handleViewRoster}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {weekFilteredRosters.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No rosters found for this week</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <RosterEditDialog
        roster={editingRoster}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingRoster(null);
        }}
        onSave={handleEditSave}
        profiles={profiles}
        clients={clients}
        projects={projects}
      />

      <RosterViewDialog
        roster={viewingRoster}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setViewingRoster(null);
        }}
      />
    </div>
  );
};
