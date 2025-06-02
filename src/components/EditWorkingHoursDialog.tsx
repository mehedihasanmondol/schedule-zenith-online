
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour, Profile, Client, Project } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelector } from "@/components/common/ProfileSelector";

interface EditWorkingHoursDialogProps {
  workingHour: WorkingHour | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
}

export const EditWorkingHoursDialog = ({
  workingHour,
  isOpen,
  onClose,
  onUpdate,
  profiles,
  clients,
  projects
}: EditWorkingHoursDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    start_time: "",
    end_time: "",
    sign_in_time: "",
    sign_out_time: "",
    hourly_rate: 0,
    notes: "",
    status: "pending"
  });

  useEffect(() => {
    if (workingHour) {
      setFormData({
        profile_id: workingHour.profile_id,
        client_id: workingHour.client_id,
        project_id: workingHour.project_id,
        date: workingHour.date,
        start_time: workingHour.start_time,
        end_time: workingHour.end_time,
        sign_in_time: "", // Always start with empty sign in time
        sign_out_time: "", // Always start with empty sign out time
        hourly_rate: workingHour.hourly_rate || 0,
        notes: workingHour.notes || "",
        status: workingHour.status
      });
    }
  }, [workingHour]);

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
    if (!workingHour) return;

    setLoading(true);

    try {
      const totalHours = calculateTotalHours(formData.start_time, formData.end_time);
      const actualHours = calculateActualHours(formData.sign_in_time, formData.sign_out_time);
      const overtimeHours = Math.max(0, actualHours - totalHours);
      const payableAmount = actualHours * formData.hourly_rate;
      
      const updateData: any = {
        ...formData,
        total_hours: totalHours,
        actual_hours: actualHours,
        overtime_hours: overtimeHours,
        payable_amount: payableAmount,
        // Set sign in/out times to null if empty
        sign_in_time: formData.sign_in_time || null,
        sign_out_time: formData.sign_out_time || null
      };
      
      const { error } = await supabase
        .from('working_hours')
        .update(updateData)
        .eq('id', workingHour.id);

      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: "Working hours updated successfully" 
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating working hours:', error);
      toast({
        title: "Error",
        description: "Failed to update working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!workingHour) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Working Hours</DialogTitle>
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
                    placeholder="Leave empty if not available"
                  />
                </div>
                <div>
                  <Label htmlFor="sign_out_time">Sign Out Time</Label>
                  <Input
                    id="sign_out_time"
                    type="time"
                    value={formData.sign_out_time}
                    onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                    placeholder="Leave empty if not available"
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Hours"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
