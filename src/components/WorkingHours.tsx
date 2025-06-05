import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Calendar, DollarSign, Plus, Edit, Trash2, CheckCircle, XCircle, Eye, Search, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorkingHour, Profile, Client, Project } from '@/types/database';
import { EditWorkingHoursDialog } from './EditWorkingHoursDialog';
import { WorkingHoursActions } from './working-hours/WorkingHoursActions';
import { ProfileSelector } from './common/ProfileSelector';

const WorkingHours = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<WorkingHour | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
    status: "pending" as const
  });

  useEffect(() => {
    fetchWorkingHours();
    fetchProfiles();
    fetchClients();
    fetchProjects();
  }, []);

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
      
      const workingHourData = {
        ...formData,
        total_hours: totalHours,
        actual_hours: actualHours || null,
        overtime_hours: overtimeHours,
        payable_amount: payableAmount,
        sign_in_time: formData.sign_in_time || null,
        sign_out_time: formData.sign_out_time || null
      };

      const { error } = await supabase
        .from('working_hours')
        .insert([workingHourData]);

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
      setEditingWorkingHour(workingHour);
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this working hour record?")) {
      try {
        const { error } = await supabase
          .from('working_hours')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast({ title: "Success", description: "Working hour record deleted successfully" });
        fetchWorkingHours();
      } catch (error) {
        console.error('Error deleting working hour:', error);
        toast({
          title: "Error",
          description: "Failed to delete working hour record",
          variant: "destructive"
        });
      }
    }
  };

  const filteredWorkingHours = workingHours.filter(wh =>
    (wh.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wh.projects?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && workingHours.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Working Hours</h1>
            <p className="text-gray-600">Track actual hours, overtime, and payroll calculations</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Log Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Enhanced Working Hours</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Scheduled Hours</h4>
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
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Actual Hours (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sign_in_time">Sign In Time</Label>
                      <Input
                        id="sign_in_time"
                        type="time"
                        value={formData.sign_in_time}
                        onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sign_out_time">Sign Out Time</Label>
                      <Input
                        id="sign_out_time"
                        type="time"
                        value={formData.sign_out_time}
                        onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this work session..."
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

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredWorkingHours.length}</div>
            <p className="text-xs text-muted-foreground">All logged hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Timer className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredWorkingHours.reduce((sum, wh) => sum + (wh.actual_hours || wh.total_hours), 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Actual hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overtime Hours</CardTitle>
            <Timer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredWorkingHours.reduce((sum, wh) => sum + (wh.overtime_hours || 0), 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Extra hours worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payable</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${filteredWorkingHours.reduce((sum, wh) => sum + (wh.payable_amount || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total amount due</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enhanced Working Hours Log ({filteredWorkingHours.length})</CardTitle>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Profile</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Scheduled</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actual</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Overtime</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Payable</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkingHours.map((wh) => (
                  <tr key={wh.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{wh.profiles?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{wh.profiles?.role || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{wh.projects?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{wh.clients?.company || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(wh.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="text-sm">
                        {wh.start_time} - {wh.end_time}
                        <div className="text-xs text-gray-500">{wh.total_hours}h</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
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
                    <td className="py-3 px-4">
                      <div className={`text-sm font-medium ${(wh.overtime_hours || 0) > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {(wh.overtime_hours || 0).toFixed(1)}h
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-purple-600">
                        ${(wh.payable_amount || 0).toFixed(2)}
                        <div className="text-xs text-gray-500">${wh.hourly_rate || 0}/hr</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        wh.status === "approved" ? "default" : 
                        wh.status === "pending" ? "secondary" : "outline"
                      }>
                        {wh.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <WorkingHoursActions
                        workingHour={wh}
                        onApprove={(id) => updateStatus(id, "approved")}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
};

export default WorkingHours;
