
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Users, Clock, DollarSign, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";

export const Roster = () => {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<Roster | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_ids: [] as string[],
    client_id: "",
    project_id: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    notes: "",
    status: "pending",
    name: "",
    expected_profiles: 1,
    per_hour_rate: 0
  });

  const [editFormData, setEditFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    start_time: "",
    end_time: "",
    notes: "",
    status: "pending",
    name: "",
    expected_profiles: 1,
    per_hour_rate: 0,
    end_date: ""
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchRosters(),
        fetchProfiles(),
        fetchClients(),
        fetchProjects()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRosters = async () => {
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select(`
          *,
          profiles!rosters_profile_id_fkey (id, full_name, role, hourly_rate),
          clients!rosters_client_id_fkey (id, company),
          projects!rosters_project_id_fkey (id, name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      
      const rosterData = (data || []).map(roster => ({
        ...roster,
        profiles: Array.isArray(roster.profiles) ? roster.profiles[0] : roster.profiles,
        clients: Array.isArray(roster.clients) ? roster.clients[0] : roster.clients,
        projects: Array.isArray(roster.projects) ? roster.projects[0] : roster.projects
      }));
      
      setRosters(rosterData as Roster[]);
    } catch (error) {
      console.error('Error fetching rosters:', error);
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
        .order('name');

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const calculateTotalHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const generateDateRange = (startDate: string, endDate: string) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    while (start <= end) {
      dates.push(new Date(start).toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }
    
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      
      const rosterEntries = [];
      
      for (const profileId of formData.profile_ids) {
        rosterEntries.push({
          profile_id: profileId,
          client_id: formData.client_id,
          project_id: formData.project_id,
          date: formData.start_date,
          end_date: formData.end_date || formData.start_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_hours: totalHours,
          notes: formData.notes,
          status: formData.status,
          name: formData.name,
          expected_profiles: formData.expected_profiles,
          per_hour_rate: formData.per_hour_rate,
          is_locked: false,
          is_editable: true
        });
      }

      const { error } = await supabase
        .from('rosters')
        .insert(rosterEntries);

      if (error) throw error;
      
      toast({ title: "Success", description: "Roster entries created successfully with automatic working hours" });
      setIsDialogOpen(false);
      resetForm();
      fetchRosters();
    } catch (error) {
      console.error('Error creating roster entries:', error);
      toast({
        title: "Error",
        description: "Failed to create roster entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoster) return;
    
    // Check if roster is editable
    if (editingRoster.is_editable === false) {
      toast({
        title: "Cannot Edit",
        description: "This roster cannot be edited because working hours have been approved",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    try {
      const totalHours = calculateTotalHours(editFormData.start_time, editFormData.end_time);
      
      const { error } = await supabase
        .from('rosters')
        .update({
          profile_id: editFormData.profile_id,
          client_id: editFormData.client_id,
          project_id: editFormData.project_id,
          date: editFormData.date,
          end_date: editFormData.end_date || editFormData.date,
          start_time: editFormData.start_time,
          end_time: editFormData.end_time,
          total_hours: totalHours,
          notes: editFormData.notes,
          status: editFormData.status,
          name: editFormData.name,
          expected_profiles: editFormData.expected_profiles,
          per_hour_rate: editFormData.per_hour_rate
        })
        .eq('id', editingRoster.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Roster entry updated successfully" });
      setEditingRoster(null);
      fetchRosters();
    } catch (error) {
      console.error('Error updating roster entry:', error);
      toast({
        title: "Error",
        description: "Failed to update roster entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roster: Roster) => {
    if (roster.is_editable === false) {
      toast({
        title: "Cannot Edit",
        description: "This roster cannot be edited because working hours have been approved",
        variant: "destructive"
      });
      return;
    }
    
    setEditingRoster(roster);
    setEditFormData({
      profile_id: roster.profile_id,
      client_id: roster.client_id,
      project_id: roster.project_id,
      date: roster.date,
      start_time: roster.start_time,
      end_time: roster.end_time,
      notes: roster.notes || "",
      status: roster.status || "pending",
      name: roster.name || "",
      expected_profiles: roster.expected_profiles || 1,
      per_hour_rate: roster.per_hour_rate || 0,
      end_date: roster.end_date || ""
    });
  };

  const handleDelete = async (id: string) => {
    const roster = rosters.find(r => r.id === id);
    if (roster?.is_editable === false) {
      toast({
        title: "Cannot Delete",
        description: "This roster cannot be deleted because working hours have been approved",
        variant: "destructive"
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this roster entry?")) return;

    try {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Roster entry deleted successfully" });
      fetchRosters();
    } catch (error) {
      console.error('Error deleting roster entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete roster entry",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      profile_ids: [],
      client_id: "",
      project_id: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      notes: "",
      status: "pending",
      name: "",
      expected_profiles: 1,
      per_hour_rate: 0
    });
  };

  const groupedRosters = rosters.reduce((acc, roster) => {
    const key = `${roster.profile_id}-${roster.date}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(roster);
    return acc;
  }, {} as Record<string, Roster[]>);

  if (loading && rosters.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Roster Management</h1>
            <p className="text-gray-600">Schedule employees with automatic working hours generation</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={() => setEditingRoster(null)}>
              <Plus className="h-4 w-4" />
              Add Roster Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Enhanced Roster Entries</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Roster Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning Shift"
                  />
                </div>

                <div>
                  <Label htmlFor="expected_profiles">Expected Employees</Label>
                  <Input
                    id="expected_profiles"
                    type="number"
                    min="1"
                    value={formData.expected_profiles}
                    onChange={(e) => setFormData({ ...formData, expected_profiles: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <Label htmlFor="per_hour_rate">Per Hour Rate (Optional)</Label>
                  <Input
                    id="per_hour_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.per_hour_rate}
                    onChange={(e) => setFormData({ ...formData, per_hour_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="Use profile rate if empty"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Select Employees *</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                    {profiles.map((profile) => (
                      <div key={profile.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`profile-${profile.id}`}
                          checked={formData.profile_ids.includes(profile.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                profile_ids: [...formData.profile_ids, profile.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                profile_ids: formData.profile_ids.filter(id => id !== profile.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`profile-${profile.id}`} className="text-sm">
                          {profile.full_name} - {profile.role} (${profile.hourly_rate || 0}/hr)
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="client_id">Client *</Label>
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
                  <Label htmlFor="project_id">Project *</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.filter(p => p.client_id === formData.client_id).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
                    min={formData.start_date}
                  />
                </div>

                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Roster Entries"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{rosters.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Employees</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {new Set(rosters.map(r => r.profile_id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {rosters.reduce((sum, r) => sum + r.total_hours, 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Locked Rosters</CardTitle>
            <Lock className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {rosters.filter(r => r.is_editable === false).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {rosters.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roster Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Roster Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(groupedRosters).map(([key, entries]) => {
              const firstEntry = entries[0];
              const isLocked = firstEntry.is_editable === false;
              return (
                <div key={key} className={`border rounded-lg p-4 ${isLocked ? 'bg-gray-50 border-red-200' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{firstEntry.profiles?.full_name}</h3>
                        {isLocked && <Lock className="h-4 w-4 text-red-500" />}
                        {firstEntry.name && (
                          <Badge variant="outline">{firstEntry.name}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(firstEntry.date).toLocaleDateString()}
                        {firstEntry.end_date && firstEntry.end_date !== firstEntry.date && 
                          ` - ${new Date(firstEntry.end_date).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={firstEntry.status === 'confirmed' ? 'default' : 'outline'}>
                        {firstEntry.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(firstEntry)}
                        disabled={isLocked}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(firstEntry.id)}
                        disabled={isLocked}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Client:</span> {firstEntry.clients?.company}
                    </div>
                    <div>
                      <span className="font-medium">Project:</span> {firstEntry.projects?.name}
                    </div>
                    <div>
                      <span className="font-medium">Hours:</span> {firstEntry.start_time} - {firstEntry.end_time} ({firstEntry.total_hours}h)
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">Rate:</span> ${firstEntry.per_hour_rate || firstEntry.profiles?.hourly_rate || 0}/hr
                    </div>
                  </div>
                  {firstEntry.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {firstEntry.notes}
                    </div>
                  )}
                  {isLocked && (
                    <div className="mt-2 text-sm text-red-600 font-medium">
                      🔒 This roster is locked because working hours have been approved
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingRoster && (
        <Dialog open={!!editingRoster} onOpenChange={() => setEditingRoster(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Enhanced Roster Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Roster Name</Label>
                  <Input
                    id="edit_name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g., Morning Shift"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_expected_profiles">Expected Employees</Label>
                  <Input
                    id="edit_expected_profiles"
                    type="number"
                    min="1"
                    value={editFormData.expected_profiles}
                    onChange={(e) => setEditFormData({ ...editFormData, expected_profiles: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_per_hour_rate">Per Hour Rate (Optional)</Label>
                  <Input
                    id="edit_per_hour_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.per_hour_rate}
                    onChange={(e) => setEditFormData({ ...editFormData, per_hour_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="Use profile rate if empty"
                  />
                </div>

                <div>
                  <ProfileSelector
                    profiles={profiles}
                    selectedProfileId={editFormData.profile_id}
                    onProfileSelect={(profileId) => setEditFormData({ ...editFormData, profile_id: profileId })}
                    label="Employee"
                    placeholder="Select employee"
                    showRoleFilter={true}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_client_id">Client</Label>
                  <Select value={editFormData.client_id} onValueChange={(value) => setEditFormData({ ...editFormData, client_id: value })}>
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
                  <Label htmlFor="edit_project_id">Project</Label>
                  <Select value={editFormData.project_id} onValueChange={(value) => setEditFormData({ ...editFormData, project_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.filter(p => p.client_id === editFormData.client_id).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit_date">Start Date</Label>
                  <Input
                    id="edit_date"
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit_end_date">End Date (Optional)</Label>
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={editFormData.end_date}
                    onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                    min={editFormData.date}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_start_time">Start Time</Label>
                  <Input
                    id="edit_start_time"
                    type="time"
                    value={editFormData.start_time}
                    onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit_end_time">End Time</Label>
                  <Input
                    id="edit_end_time"
                    type="time"
                    value={editFormData.end_time}
                    onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingRoster(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Updating..." : "Update Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
