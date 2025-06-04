
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileForm } from "./profile/ProfileForm";
import { ProfileStats } from "./profile/ProfileStats";
import { BankAccountManagement } from "./bank/BankAccountManagement";
import { ServerSideProfileTable } from "./profile/ServerSideProfileTable";

export const ProfileManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedProfileForBank, setSelectedProfileForBank] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfilesForStats();
  }, []);

  const fetchProfilesForStats = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles for stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profile statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Profile deleted successfully" });
      fetchProfilesForStats(); // Refresh stats
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', editingProfile.id);

        if (error) throw error;
        toast({ title: "Success", description: "Profile updated successfully" });
      }
      // Note: Profile creation is handled in ProfileForm component
      
      setIsFormOpen(false);
      setEditingProfile(null);
      fetchProfilesForStats(); // Refresh stats
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading profiles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
            <p className="text-gray-600">Manage user profiles with server-side pagination and exports</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Profile
        </Button>
      </div>

      <ProfileStats profiles={profiles} />

      <Card>
        <CardHeader>
          <CardTitle>All Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerSideProfileTable 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onManageBank={(profile) => setSelectedProfileForBank(profile)}
          />
        </CardContent>
      </Card>

      <ProfileForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProfile(null);
        }}
        onSubmit={handleSubmit}
        editingProfile={editingProfile}
        loading={formLoading}
      />

      <BankAccountManagement
        profileId={selectedProfileForBank?.id || ""}
        profileName={selectedProfileForBank?.full_name || ""}
        isOpen={!!selectedProfileForBank}
        onClose={() => setSelectedProfileForBank(null)}
      />
    </div>
  );
};
