
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Roster as RosterType, Profile, Client, Project } from "@/types/database";
import { MultipleProfileSelector } from "@/components/common/MultipleProfileSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RosterEditDialogProps {
  roster: RosterType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
}

export const RosterEditDialog = ({ 
  roster, 
  isOpen, 
  onClose, 
  onSave, 
  profiles, 
  clients, 
  projects 
}: RosterEditDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    profile_ids: [] as string[],
    client_id: '',
    project_id: '',
    date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'pending' as 'pending' | 'confirmed' | 'cancelled',
    expected_profiles: 1,
    per_hour_rate: 0
  });

  useEffect(() => {
    if (roster && isOpen) {
      setFormData({
        name: roster.name || '',
        profile_ids: roster.roster_profiles?.map(rp => rp.profile_id) || [],
        client_id: roster.client_id || '',
        project_id: roster.project_id || '',
        date: roster.date || '',
        end_date: roster.end_date || '',
        start_time: roster.start_time || '',
        end_time: roster.end_time || '',
        notes: roster.notes || '',
        status: roster.status || 'pending',
        expected_profiles: roster.expected_profiles || 1,
        per_hour_rate: roster.per_hour_rate || 0
      });
    }
  }, [roster, isOpen]);

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
    if (!roster) return;
    
    setLoading(true);

    try {
      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      
      // Update roster
      const { error: rosterError } = await supabase
        .from('rosters')
        .update({
          name: formData.name,
          client_id: formData.client_id,
          project_id: formData.project_id,
          date: formData.date,
          end_date: formData.end_date || null,
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_hours: totalHours,
          notes: formData.notes,
          status: formData.status,
          expected_profiles: formData.expected_profiles,
          per_hour_rate: formData.per_hour_rate
        })
        .eq('id', roster.id);

      if (rosterError) throw rosterError;

      // Update roster profiles
      await supabase
        .from('roster_profiles')
        .delete()
        .eq('roster_id', roster.id);

      if (formData.profile_ids.length > 0) {
        const rosterProfilesData = formData.profile_ids.map(profileId => ({
          roster_id: roster.id,
          profile_id: profileId
        }));

        const { error: profilesError } = await supabase
          .from('roster_profiles')
          .insert(rosterProfilesData);

        if (profilesError) throw profilesError;
      }

      toast({ title: "Success", description: "Roster updated successfully" });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating roster:', error);
      toast({
        title: "Error",
        description: "Failed to update roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!roster) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md lg:max-w-3xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Roster</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Roster Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter roster name"
              className="mt-1"
            />
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
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'pending' | 'confirmed' | 'cancelled') => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="mt-1">
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
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for this roster..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Updating..." : "Update Roster"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
