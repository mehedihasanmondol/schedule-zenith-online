
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface NotificationCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId: string;
}

export const NotificationCreateForm = ({ isOpen, onClose, onSuccess, currentUserId }: NotificationCreateFormProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "custom",
    recipient_profile_ids: [] as string[],
    action_type: "none" as "approve" | "confirm" | "grant" | "cancel" | "reject" | "none",
    priority: "medium" as "low" | "medium" | "high"
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        message: "",
        type: "custom",
        recipient_profile_ids: [],
        action_type: "none",
        priority: "medium"
      });
      setIsBulk(false);
    }
  }, [isOpen]);

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
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
    }
  };

  const handleProfileSelection = (profileId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        recipient_profile_ids: [...formData.recipient_profile_ids, profileId]
      });
    } else {
      setFormData({
        ...formData,
        recipient_profile_ids: formData.recipient_profile_ids.filter(id => id !== profileId)
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        recipient_profile_ids: profiles.map(p => p.id)
      });
    } else {
      setFormData({
        ...formData,
        recipient_profile_ids: []
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.recipient_profile_ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const notifications = formData.recipient_profile_ids.map(recipientId => ({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        recipient_profile_id: recipientId,
        sender_profile_id: currentUserId,
        action_type: formData.action_type,
        priority: formData.priority
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${notifications.length} notification(s) created successfully`
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating notifications:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Notification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter notification title"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter notification message"
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="action_type">Action Type</Label>
              <Select value={formData.action_type} onValueChange={(value: "approve" | "confirm" | "grant" | "cancel" | "reject" | "none") => setFormData({ ...formData, action_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="confirm">Confirm</SelectItem>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="bulk"
                checked={isBulk}
                onCheckedChange={(checked) => setIsBulk(checked === true)}
              />
              <Label htmlFor="bulk">Bulk notification (send to multiple recipients)</Label>
            </div>

            <Label>Recipients *</Label>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {isBulk && (
                <div className="flex items-center space-x-2 mb-3 pb-3 border-b">
                  <Checkbox
                    id="select-all"
                    checked={formData.recipient_profile_ids.length === profiles.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">Select All</Label>
                </div>
              )}
              
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={profile.id}
                      checked={formData.recipient_profile_ids.includes(profile.id)}
                      onCheckedChange={(checked) => handleProfileSelection(profile.id, checked === true)}
                    />
                    <Label htmlFor={profile.id} className="flex-1">
                      {profile.full_name} ({profile.role})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Notification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
