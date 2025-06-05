import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Roster, Profile, Client, Project } from '@/types/database';
import { EnhancedRosterCalendarView } from './roster/EnhancedRosterCalendarView';
import { RosterWeeklyFilter } from './roster/RosterWeeklyFilter';
import { RosterActions } from './roster/RosterActions';

const RosterManagement = () => {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<Omit<Roster, 'id' | 'created_at' | 'updated_at'>[]>([
    {
      profile_id: '',
      client_id: '',
      project_id: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00',
      total_hours: 8,
      status: 'pending',
      notes: '',
      is_locked: false,
      name: '',
      expected_profiles: 1,
      per_hour_rate: 0,
      is_editable: true,
      end_date: new Date().toISOString().split('T')[0],
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [editingRoster, setEditingRoster] = useState<Roster | null>(null);
  const { toast } = useToast();
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [weekFilter, setWeekFilter] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rostersData, error: rostersError } = await supabase
        .from('rosters')
        .select(`
          *,
          profiles!rosters_profile_id_fkey (id, full_name, email, role, avatar_url, is_active, created_at, updated_at),
          clients!rosters_client_id_fkey (id, name, company, email, status, created_at, updated_at),
          projects!rosters_project_id_fkey (id, name, client_id, status, start_date, budget, created_at, updated_at)
        `);
      if (rostersError) throw rostersError;
      setRosters(rostersData || []);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [name]: value };
    setFormData(newFormData);
  };

  const handleSelectChange = (index: number, name: string, value: string) => {
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [name]: value };
    setFormData(newFormData);
  };

  const handleDateTimeChange = (index: number, name: string, value: string) => {
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [name]: value };
    setFormData(newFormData);

    // Auto-calculate total_hours when start_time and end_time change
    if (name === 'start_time' || name === 'end_time') {
      const startTime = newFormData[index].start_time;
      const endTime = newFormData[index].end_time;

      if (startTime && endTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        let diffMinutes = endTotalMinutes - startTotalMinutes;
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60; // Account for crossing midnight
        }

        const totalHours = diffMinutes / 60;
        newFormData[index] = { ...newFormData[index], total_hours: parseFloat(totalHours.toFixed(2)) };
        setFormData(newFormData);
      }
    }
  };

  const handleAddRoster = () => {
    setFormData([
      ...formData,
      {
        profile_id: '',
        client_id: '',
        project_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        total_hours: 8,
        status: 'pending',
        notes: '',
        is_locked: false,
        name: '',
        expected_profiles: 1,
        per_hour_rate: 0,
        is_editable: true,
        end_date: new Date().toISOString().split('T')[0],
      }
    ]);
  };

  const handleRemoveRoster = (index: number) => {
    const newFormData = [...formData];
    newFormData.splice(index, 1);
    setFormData(newFormData);
  };

  const handleEditRoster = (rosterId: string) => {
    const roster = rosters.find(r => r.id === rosterId);
    if (roster) {
      setEditingRoster(roster);
      setFormData([{
        profile_id: roster.profile_id,
        client_id: roster.client_id,
        project_id: roster.project_id,
        date: roster.date,
        start_time: roster.start_time,
        end_time: roster.end_time,
        total_hours: roster.total_hours,
        status: roster.status,
        notes: roster.notes || '',
        is_locked: roster.is_locked,
        name: roster.name || '',
        expected_profiles: roster.expected_profiles || 1,
        per_hour_rate: roster.per_hour_rate || 0,
        is_editable: roster.is_editable || true,
        end_date: roster.end_date || new Date().toISOString().split('T')[0],
      }]);
    }
  };

  const handleDeleteRoster = async (rosterId: string) => {
    if (window.confirm("Are you sure you want to delete this roster?")) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('rosters')
          .delete()
          .eq('id', rosterId);
        if (error) throw error;
        toast({ title: "Success", description: "Roster deleted successfully" });
        fetchData();
      } catch (error) {
        console.error('Error deleting roster:', error);
        toast({
          title: "Error",
          description: "Failed to delete roster",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewRoster = (rosterId: string) => {
    const roster = rosters.find(r => r.id === rosterId);
    if (roster) {
      // For now, just edit - could be expanded to a view-only dialog
      handleEditRoster(rosterId);
    }
  };

  const handleWeekChange = (startDate: string, endDate: string) => {
    setWeekFilter({ start: startDate, end: endDate });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedData = formData.map(data => ({
        ...data,
        status: data.status as 'pending' | 'confirmed' | 'cancelled'
      }));

      if (editingRoster) {
        const { error } = await supabase
          .from('rosters')
          .update(formattedData[0])
          .eq('id', editingRoster.id);
        if (error) throw error;
        toast({ title: "Success", description: "Roster updated successfully" });
      } else {
        const { error } = await supabase
          .from('rosters')
          .insert(formattedData);
        if (error) throw error;
        toast({ title: "Success", description: "Roster(s) created successfully" });
      }

      setFormData([
        {
          profile_id: '',
          client_id: '',
          project_id: '',
          date: new Date().toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '17:00',
          total_hours: 8,
          status: 'pending',
          notes: '',
          is_locked: false,
          name: '',
          expected_profiles: 1,
          per_hour_rate: 0,
          is_editable: true,
          end_date: new Date().toISOString().split('T')[0],
        }
      ]);
      setEditingRoster(null);
      fetchData();
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

  // Filter rosters by week if filter is set
  const filteredRosters = weekFilter.start && weekFilter.end 
    ? rosters.filter(roster => {
        const rosterDate = new Date(roster.date);
        const startDate = new Date(weekFilter.start);
        const endDate = new Date(weekFilter.end);
        return rosterDate >= startDate && rosterDate <= endDate;
      })
    : rosters;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Roster Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <Button onClick={() => setIsCalendarView(!isCalendarView)}>
              {isCalendarView ? 'Show Form View' : 'Show Calendar View'}
            </Button>
            {!isCalendarView && (
              <RosterWeeklyFilter onWeekChange={handleWeekChange} />
            )}
          </div>

          {isCalendarView ? (
            <EnhancedRosterCalendarView rosters={rosters} />
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formData.map((data, index) => (
                  <div key={index} className="border p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`profile_id-${index}`}>Profile</Label>
                        <Select
                          value={data.profile_id}
                          onValueChange={(value) => handleSelectChange(index, 'profile_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map(profile => (
                              <SelectItem key={profile.id} value={profile.id}>{profile.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`client_id-${index}`}>Client</Label>
                        <Select
                          value={data.client_id}
                          onValueChange={(value) => handleSelectChange(index, 'client_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.company}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`project_id-${index}`}>Project</Label>
                        <Select
                          value={data.project_id}
                          onValueChange={(value) => handleSelectChange(index, 'project_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`status-${index}`}>Status</Label>
                        <Select
                          value={data.status}
                          onValueChange={(value) => handleSelectChange(index, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`date-${index}`}>Date</Label>
                        <Input
                          type="date"
                          name="date"
                          value={data.date}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end_date-${index}`}>End Date</Label>
                        <Input
                          type="date"
                          name="end_date"
                          value={data.end_date}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`start_time-${index}`}>Start Time</Label>
                        <Input
                          type="time"
                          name="start_time"
                          value={data.start_time}
                          onChange={(e) => handleDateTimeChange(index, 'start_time', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end_time-${index}`}>End Time</Label>
                        <Input
                          type="time"
                          name="end_time"
                          value={data.end_time}
                          onChange={(e) => handleDateTimeChange(index, 'end_time', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`total_hours-${index}`}>Total Hours</Label>
                        <Input
                          type="number"
                          name="total_hours"
                          value={data.total_hours}
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor={`expected_profiles-${index}`}>Expected Profiles</Label>
                        <Input
                          type="number"
                          name="expected_profiles"
                          value={data.expected_profiles}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`per_hour_rate-${index}`}>Per Hour Rate</Label>
                        <Input
                          type="number"
                          name="per_hour_rate"
                          value={data.per_hour_rate}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`name-${index}`}>Name</Label>
                        <Input
                          type="text"
                          name="name"
                          value={data.name}
                          onChange={(e) => handleInputChange(index, e)}
                        />
                      </div>
                    </div>
                    <Label htmlFor={`notes-${index}`}>Notes</Label>
                    <Textarea
                      name="notes"
                      value={data.notes}
                      onChange={(e) => handleInputChange(index, e)}
                    />
                    <div className="flex justify-end mt-2">
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveRoster(index)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="secondary" onClick={handleAddRoster} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Roster
                </Button>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : editingRoster ? "Update Roster" : "Create Roster(s)"}
                </Button>
              </form>

              {filteredRosters.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {weekFilter.start ? 'Filtered Rosters' : 'Existing Rosters'} ({filteredRosters.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profile
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRosters.map((roster) => (
                          <tr key={roster.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {roster.profiles?.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {roster.clients?.company}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {roster.projects?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(roster.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {roster.status}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <RosterActions
                                roster={roster}
                                onEdit={handleEditRoster}
                                onDelete={handleDeleteRoster}
                                onView={handleViewRoster}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RosterManagement;
