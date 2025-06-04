import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Clock, Users, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour, Client, Project, Profile, WorkingHoursStatus } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { WorkingHoursActions } from "./working-hours/WorkingHoursActions";

export const WorkingHoursComponent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<WorkingHour | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    start_time: "",
    end_time: "",
    total_hours: 0,
    actual_hours: 0,
    overtime_hours: 0,
    hourly_rate: 0,
    payable_amount: 0,
    sign_in_time: "",
    sign_out_time: "",
    notes: "",
    status: "pending" as WorkingHoursStatus
  });

  useEffect(() => {
    fetchWorkingHours();
    fetchClients();
    fetchProjects();
    fetchProfiles();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles (
            id,
            full_name
          ),
          clients (
            id,
            name,
            company
          ),
          projects (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkingHours(data || []);
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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company');

      if (error) throw error;
      setClients(data || []);
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
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
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
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const workingHourData = {
        ...formData,
        status: formData.status as WorkingHoursStatus
      };

      if (editingWorkingHour) {
        const { error } = await supabase
          .from('working_hours')
          .update(workingHourData)
          .eq('id', editingWorkingHour.id);

        if (error) throw error;
        toast({ title: "Success", description: "Working hour updated successfully" });
      } else {
        const { error } = await supabase
          .from('working_hours')
          .insert([workingHourData]);

        if (error) throw error;
        toast({ title: "Success", description: "Working hour added successfully" });
      }

      setIsDialogOpen(false);
      setEditingWorkingHour(null);
      setFormData({
        profile_id: "",
        client_id: "",
        project_id: "",
        date: "",
        start_time: "",
        end_time: "",
        total_hours: 0,
        actual_hours: 0,
        overtime_hours: 0,
        hourly_rate: 0,
        payable_amount: 0,
        sign_in_time: "",
        sign_out_time: "",
        notes: "",
        status: "pending"
      });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error saving working hour:', error);
      toast({
        title: "Error",
        description: "Failed to save working hour",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workingHour: WorkingHour) => {
    setEditingWorkingHour(workingHour);
    setFormData({
      profile_id: workingHour.profile_id,
      client_id: workingHour.client_id,
      project_id: workingHour.project_id,
      date: workingHour.date,
      start_time: workingHour.start_time,
      end_time: workingHour.end_time,
      total_hours: workingHour.total_hours,
      actual_hours: workingHour.actual_hours || 0,
      overtime_hours: workingHour.overtime_hours || 0,
      hourly_rate: workingHour.hourly_rate || 0,
      payable_amount: workingHour.payable_amount || 0,
      sign_in_time: workingHour.sign_in_time || "",
      sign_out_time: workingHour.sign_out_time || "",
      notes: workingHour.notes || "",
      status: workingHour.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this working hour entry?")) return;

    try {
      const { error } = await supabase
        .from('working_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Working hour deleted successfully" });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error deleting working hour:', error);
      toast({
        title: "Error",
        description: "Failed to delete working hour",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('working_hours')
        .update({ status: 'approved' as WorkingHoursStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Working hour approved successfully" });
      fetchWorkingHours();
    } catch (error) {
      console.error('Error approving working hour:', error);
      toast({
        title: "Error",
        description: "Failed to approve working hour",
        variant: "destructive"
      });
    }
  };

  const handleView = (id: string) => {
    const workingHour = workingHours.find(wh => wh.id === id);
    if (workingHour) {
      handleEdit(workingHour);
    }
  };

  const filteredWorkingHours = workingHours.filter(workingHour =>
    workingHour.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workingHour.clients?.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workingHour.projects?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workingHour.date.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "paid":
        return "outline";
      default:
        return "secondary";
    }
  };

  const totalHours = filteredWorkingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
  const totalPayable = filteredWorkingHours.reduce((sum, wh) => sum + (wh.payable_amount || 0), 0);

  if (loading && workingHours.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Working Hours Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={() => {
              setEditingWorkingHour(null);
              setFormData({
                profile_id: "",
                client_id: "",
                project_id: "",
                date: "",
                start_time: "",
                end_time: "",
                total_hours: 0,
                actual_hours: 0,
                overtime_hours: 0,
                hourly_rate: 0,
                payable_amount: 0,
                sign_in_time: "",
                sign_out_time: "",
                notes: "",
                status: "pending"
              });
            }}>
              <Plus className="h-4 w-4" />
              Add Working Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWorkingHour ? "Edit Working Hours" : "Add New Working Hours"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="profile_id">Employee</Label>
                  <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_hours">Total Hours</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    step="0.5"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="payable_amount">Payable Amount</Label>
                  <Input
                    id="payable_amount"
                    type="number"
                    step="0.01"
                    value={formData.payable_amount}
                    onChange={(e) => setFormData({ ...formData, payable_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: WorkingHoursStatus) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingWorkingHour ? "Update Working Hours" : "Add Working Hours"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            <Clock className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {workingHours.filter(wh => wh.status === "approved").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {workingHours.filter(wh => wh.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payable</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${totalPayable.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Working Hours</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search working hours..."
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkingHours.map((workingHour) => (
                  <tr key={workingHour.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {workingHour.profiles?.full_name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{workingHour.clients?.company}</td>
                    <td className="py-3 px-4 text-gray-600">{workingHour.projects?.name}</td>
                    <td className="py-3 px-4 text-gray-600">{workingHour.date}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {workingHour.start_time} - {workingHour.end_time} ({workingHour.total_hours}h)
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ${(workingHour.payable_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(workingHour.status)}>
                        {workingHour.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <WorkingHoursActions
                        workingHour={workingHour}
                        onApprove={handleApprove}
                        onEdit={() => handleEdit(workingHour)}
                        onDelete={() => handleDelete(workingHour.id)}
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
    </div>
  );
};
