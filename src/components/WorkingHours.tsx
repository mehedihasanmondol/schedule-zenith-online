import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, CheckCircle, XCircle, DollarSign, Timer, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";
import { EditWorkingHoursDialog } from "@/components/EditWorkingHoursDialog";
import { WorkingHoursFilter } from "@/components/working-hours/WorkingHoursFilter";
import { WorkingHoursActions } from "@/components/working-hours/WorkingHoursActions";
import { WorkingHoursViewDialog } from "@/components/working-hours/WorkingHoursViewDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const WorkingHoursComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateShortcut, setDateShortcut] = useState("current-week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWorkingHours, setSelectedWorkingHours] = useState<string[]>([]);
  
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<WorkingHour | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingWorkingHour, setViewingWorkingHour] = useState<WorkingHour | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: new Date().toISOString().split('T')[0],
    start_time: "",
    end_time: "",
    sign_in_time: "",
    sign_out_time: "",
    hourly_rate: 0,
    notes: "",
    status: "pending" as "pending" | "approved" | "rejected" | "paid"
  });

  // Set default dates to current week
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    
    setStartDate(mondayDate.toISOString().split('T')[0]);
    setEndDate(sundayDate.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchWorkingHours();
    fetchProfiles();
    fetchClients();
    fetchProjects();
  }, []);

  // Auto-fill today's date when dialog opens
  useEffect(() => {
    if (isDialogOpen && !editingWorkingHour) {
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [isDialogOpen, editingWorkingHour]);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role, hourly_rate),
          clients!working_hours_client_id_fkey (id, company),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const workingHoursData = (data || []).map(wh => ({
        ...wh,
        profiles: Array.isArray(wh.profiles) ? wh.profiles[0] : wh.profiles,
        clients: Array.isArray(wh.clients) ? wh.clients[0] : wh.clients,
        projects: Array.isArray(wh.projects) ? wh.projects[0] : wh.projects
      }));
      
      setWorkingHours(workingHoursData as WorkingHour[]);
    } catch (error) {
      console.error('Error fetching working hours:', error);
      toast({
        title: "Error",
        description: "Failed to fetch working hours",
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

  const calculateActualHours = (signInTime: string, signOutTime: string) => {
    if (!signInTime || !signOutTime) return 0;
    return calculateTotalHours(signInTime, signOutTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      const actualHours = calculateActualHours(formData.sign_in_time, formData.sign_out_time);
      const overtimeHours = Math.max(0, actualHours - totalHours);
      const payableAmount = (actualHours || totalHours) * formData.hourly_rate;
      
      const { error } = await supabase
        .from('working_hours')
        .insert({
          ...formData,
          total_hours: totalHours,
          actual_hours: actualHours || null,
          overtime_hours: overtimeHours,
          payable_amount: payableAmount,
          sign_in_time: formData.sign_in_time || null,
          sign_out_time: formData.sign_out_time || null
        });

      if (error) throw error;
      toast({ title: "Success", description: "Working hours logged successfully" });
      
      setIsDialogOpen(false);
      setFormData({
        profile_id: "",
        client_id: "",
        project_id: "",
        date: new Date().toISOString().split('T')[0],
        start_time: "",
        end_time: "",
        sign_in_time: "",
        sign_out_time: "",
        hourly_rate: 0,
        notes: "",
        status: "pending"
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast({
        title: "Error",
        description: "Failed to save working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('working_hours')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Working hours ${status} successfully` 
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const bulkApprove = async () => {
    if (selectedWorkingHours.length === 0) {
      toast({
        title: "No selection",
        description: "Please select working hours to approve",
        variant: "destructive"
      });
      return;
    }

    const idsToApprove = selectedWorkingHours.filter(id => {
      const wh = filteredWorkingHours.find(w => w.id === id);
      return wh?.status === 'pending';
    });
    
    if (idsToApprove.length === 0) {
      toast({
        title: "No pending hours",
        description: "Selected working hours are not pending approval",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('working_hours')
        .update({ status: 'approved' })
        .in('id', idsToApprove);

      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: `${idsToApprove.length} working hours approved successfully` 
      });
      setSelectedWorkingHours([]);
      fetchWorkingHours();
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast({
        title: "Error",
        description: "Failed to bulk approve working hours",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (id: string) => {
    const workingHour = workingHours.find(wh => wh.id === id);
    if (workingHour) {
      setEditingWorkingHour(workingHour);
      setIsEditDialogOpen(true);
    }
  };

  const handleView = (id: string) => {
    const workingHour = workingHours.find(wh => wh.id === id);
    if (workingHour) {
      setViewingWorkingHour(workingHour);
      setIsViewDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this working hour entry?')) {
      try {
        const { error } = await supabase
          .from('working_hours')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast({ title: "Success", description: "Working hours deleted successfully" });
        setSelectedWorkingHours(prev => prev.filter(selectedId => selectedId !== id));
        fetchWorkingHours();
      } catch (error) {
        console.error('Error deleting working hours:', error);
        toast({
          title: "Error",
          description: "Failed to delete working hours",
          variant: "destructive"
        });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredWorkingHours.map(wh => wh.id);
      setSelectedWorkingHours(allIds);
    } else {
      setSelectedWorkingHours([]);
    }
  };

  const handleSelectWorkingHour = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkingHours(prev => [...prev, id]);
    } else {
      setSelectedWorkingHours(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const filteredWorkingHours = workingHours.filter(wh => {
    const matchesSearch = (wh.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (wh.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (wh.clients?.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || wh.status === statusFilter;
    const matchesProfile = profileFilter === "all" || wh.profile_id === profileFilter;
    const matchesClient = clientFilter === "all" || wh.client_id === clientFilter;
    const matchesProject = projectFilter === "all" || wh.project_id === projectFilter;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const whDate = new Date(wh.date);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      matchesDate = whDate >= filterStart && whDate <= filterEnd;
    }
    
    return matchesSearch && matchesStatus && matchesProfile && matchesClient && matchesProject && matchesDate;
  });

  const pendingWorkingHours = filteredWorkingHours.filter(wh => wh.status === 'pending');
  const selectedPendingCount = selectedWorkingHours.filter(id => {
    const wh = filteredWorkingHours.find(w => w.id === id);
    return wh?.status === 'pending';
  }).length;

  const allSelected = filteredWorkingHours.length > 0 && selectedWorkingHours.length === filteredWorkingHours.length;
  const someSelected = selectedWorkingHours.length > 0;

  if (loading && workingHours.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Mobile-friendly header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Enhanced Working Hours</h1>
            <p className="text-sm sm:text-base text-gray-600">Track actual hours, overtime, and payroll calculations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Log Hours</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Log Enhanced Working Hours</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <ProfileSelector
                    profiles={profiles}
                    selectedProfileId={formData.profile_id}
                    onProfileSelect={(profileId) => {
                      const profile = profiles.find(p => p.id === profileId);
                      setFormData({ 
                        ...formData, 
                        profile_id: profileId,
                        hourly_rate: profile?.hourly_rate || 0
                      });
                    }}
                    label="Select Profile"
                    placeholder="Choose a team member"
                    showRoleFilter={true}
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

                <div>
                  <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Scheduled Hours</h4>
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
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Actual Hours (Optional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sign_in_time" className="text-sm font-medium">Sign In Time</Label>
                        <Input
                          id="sign_in_time"
                          type="time"
                          value={formData.sign_in_time}
                          onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                          placeholder="Optional"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sign_out_time" className="text-sm font-medium">Sign Out Time</Label>
                        <Input
                          id="sign_out_time"
                          type="time"
                          value={formData.sign_out_time}
                          onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                          placeholder="Optional"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hourly_rate" className="text-sm font-medium">Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about this work session..."
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Log Hours"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mobile-optimized stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Entries</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{filteredWorkingHours.length}</div>
            <p className="text-xs text-muted-foreground">All logged hours</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Timer className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              {filteredWorkingHours.reduce((sum, wh) => sum + (wh.actual_hours || wh.total_hours), 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Actual hours worked</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Overtime Hours</CardTitle>
            <Timer className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
              {filteredWorkingHours.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Extra hours worked</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Payable</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
              ${filteredWorkingHours.reduce((sum, wh) => sum + (wh.payable_amount || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total amount due</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <WorkingHoursFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        profileFilter={profileFilter}
        setProfileFilter={setProfileFilter}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        dateShortcut={dateShortcut}
        setDateShortcut={setDateShortcut}
        profiles={profiles}
        clients={clients}
        projects={projects}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-lg sm:text-xl">Enhanced Working Hours Log ({filteredWorkingHours.length})</CardTitle>
            <Button 
              onClick={bulkApprove}
              className="flex items-center gap-2 w-full sm:w-auto"
              variant="outline"
              size="sm"
              disabled={selectedPendingCount === 0}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="sm:inline">Bulk Approve {selectedPendingCount > 0 ? `(${selectedPendingCount})` : ''}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile-first responsive table */}
          <div className="block sm:hidden space-y-3">
            {/* Mobile cards view */}
            {filteredWorkingHours.map((wh) => (
              <Card key={wh.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedWorkingHours.includes(wh.id)}
                          onCheckedChange={(checked) => handleSelectWorkingHour(wh.id, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium text-sm text-gray-900">{wh.profiles?.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-600">{wh.profiles?.role || 'N/A'}</div>
                        </div>
                      </div>
                      <Badge variant={
                        wh.status === "approved" ? "default" : 
                        wh.status === "pending" ? "secondary" : "outline"
                      } className="text-xs">
                        {wh.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Project:</span>
                        <span className="font-medium">{wh.projects?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Client:</span>
                        <span>{wh.clients?.company || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Date:</span>
                        <span>{new Date(wh.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Scheduled:</span>
                        <span>{wh.start_time} - {wh.end_time} ({wh.total_hours}h)</span>
                      </div>
                      {wh.sign_in_time && wh.sign_out_time && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Actual:</span>
                          <span>{wh.sign_in_time} - {wh.sign_out_time} ({wh.actual_hours || 0}h)</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Overtime:</span>
                        <span className={`font-medium ${(wh.overtime_hours || 0) > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                          {(wh.overtime_hours || 0).toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payable:</span>
                        <span className="font-medium text-purple-600">${(wh.payable_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {wh.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(wh.id, "approved")}
                              className="text-green-600 hover:text-green-700 p-1 sm:p-2"
                            >
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(wh.id, "rejected")}
                              className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                            >
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      <WorkingHoursActions
                        workingHour={wh}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      className={someSelected && !allSelected ? "data-[state=checked]:bg-blue-600" : ""}
                    />
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Profile</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Project</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Date</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Scheduled</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Actual</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Overtime</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Payable</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkingHours.map((wh) => (
                  <tr key={wh.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 sm:px-4">
                      <Checkbox
                        checked={selectedWorkingHours.includes(wh.id)}
                        onCheckedChange={(checked) => handleSelectWorkingHour(wh.id, checked as boolean)}
                      />
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{wh.profiles?.full_name || 'N/A'}</div>
                        <div className="text-xs text-gray-600">{wh.profiles?.role || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{wh.projects?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-600">{wh.clients?.company || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 text-sm">
                      {new Date(wh.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600">
                      <div className="text-sm">
                        {wh.start_time} - {wh.end_time}
                        <div className="text-xs text-gray-500">{wh.total_hours}h</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600">
                      <div className="text-sm">
                        {wh.sign_in_time && wh.sign_out_time ? (
                          <>
                            {wh.sign_in_time} - {wh.sign_out_time}
                            <div className="text-xs text-gray-500">{wh.actual_hours || 0}h</div>
                          </>
                        ) : (
                          <span className="text-gray-400">Not recorded</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className={`text-sm font-medium ${(wh.overtime_hours || 0) > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {(wh.overtime_hours || 0).toFixed(1)}h
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="text-sm font-medium text-purple-600">
                        ${(wh.payable_amount || 0).toFixed(2)}
                        <div className="text-xs text-gray-500">${wh.hourly_rate || 0}/hr</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <Badge variant={
                        wh.status === "approved" ? "default" : 
                        wh.status === "pending" ? "secondary" : "outline"
                      } className="text-xs">
                        {wh.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {wh.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(wh.id, "approved")}
                              className="text-green-600 hover:text-green-700 p-1 sm:p-2"
                            >
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(wh.id, "rejected")}
                              className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                            >
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </>
                        )}
                        <WorkingHoursActions
                          workingHour={wh}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onView={handleView}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWorkingHours.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No working hours found</h3>
              <p className="text-sm">Try adjusting your filters or log new hours</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditWorkingHoursDialog
        workingHour={editingWorkingHour}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingWorkingHour(null);
        }}
        onUpdate={fetchWorkingHours}
        profiles={profiles}
        clients={clients}
        projects={projects}
      />

      <WorkingHoursViewDialog
        workingHour={viewingWorkingHour}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setViewingWorkingHour(null);
        }}
      />
    </div>
  );
};
