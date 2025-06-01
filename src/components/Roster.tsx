
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Calendar, Clock, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster as RosterType, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";

export const Roster = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    notes: "",
    status: "pending",
    name: "",
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
          profiles!rosters_profile_id_fkey (id, full_name, role),
          clients!rosters_client_id_fkey (id, company),
          projects!rosters_project_id_fkey (id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Handle the data safely with proper type checking
      const rostersData = (data || []).map(roster => ({
        ...roster,
        profiles: Array.isArray(roster.profiles) ? roster.profiles[0] : roster.profiles,
        clients: Array.isArray(roster.clients) ? roster.clients[0] : roster.clients,
        projects: Array.isArray(roster.projects) ? roster.projects[0] : roster.projects
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

  const generateDefaultName = (client: Client | undefined, project: Project | undefined, date: string) => {
    if (!client || !project || !date) return "";
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${client.company} - ${project.name} (${formattedDate})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      const selectedClient = clients.find(c => c.id === formData.client_id);
      const selectedProject = projects.find(p => p.id === formData.project_id);
      
      const defaultName = generateDefaultName(selectedClient, selectedProject, formData.date);
      const finalName = formData.name.trim() || defaultName;
      
      const { error } = await supabase
        .from('rosters')
        .insert([{
          ...formData,
          total_hours: totalHours,
          name: finalName
        }]);

      if (error) throw error;
      toast({ title: "Success", description: "Roster created successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        client_id: "",
        project_id: "",
        date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        notes: "",
        status: "pending",
        name: "",
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
    (roster.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roster.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roster.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Enhanced Roster</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProfileSelector
                profiles={profiles}
                selectedProfileId={formData.profile_id}
                onProfileSelect={(profileId) => setFormData({ ...formData, profile_id: profileId })}
                label="Select Profile"
                placeholder="Choose a team member"
                showRoleFilter={true}
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

              <div>
                <Label htmlFor="name">Roster Name (Optional)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Leave empty for auto-generated name"
                />
                {formData.client_id && formData.project_id && formData.date && (
                  <p className="text-sm text-gray-500 mt-1">
                    Auto-generated: {generateDefaultName(
                      clients.find(c => c.id === formData.client_id),
                      projects.find(p => p.id === formData.project_id),
                      formData.date
                    )}
                  </p>
                )}
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
            <CardTitle>Enhanced Roster Schedule ({filteredRosters.length})</CardTitle>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Roster Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Profile</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date Range</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRosters.map((roster) => (
                  <tr key={roster.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{roster.name || 'Unnamed Roster'}</div>
                      {roster.expected_profiles > 1 && (
                        <div className="text-sm text-gray-600">
                          Expected: {roster.expected_profiles} members
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{roster.profiles?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{roster.profiles?.role || 'N/A'}</div>
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
                    <td className="py-3 px-4 text-gray-600">
                      <div className="font-medium">{roster.total_hours}h</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="text-sm">
                        {roster.per_hour_rate > 0 ? `$${roster.per_hour_rate}/hr` : 'Profile rate'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        roster.status === "confirmed" ? "default" : 
                        roster.status === "pending" ? "secondary" : "outline"
                      }>
                        {roster.status}
                      </Badge>
                      {roster.is_locked && (
                        <div className="text-xs text-orange-600 mt-1">🔒 Locked</div>
                      )}
                      {!roster.is_editable && (
                        <div className="text-xs text-red-600 mt-1">✏️ Non-editable</div>
                      )}
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
        </CardContent>
      </Card>
    </div>
  );
};
