
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileForm } from "./profile/ProfileForm";
import { BankAccountManagement } from "./bank/BankAccountManagement";
import { ServerSideProfileTable } from "./profile/ServerSideProfileTable";
import { ModernProfileHeader } from "./profile/ModernProfileHeader";
import { ModernProfileStats } from "./profile/ModernProfileStats";

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
      setLoading(true);
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
      fetchProfilesForStats();
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
      
      setIsFormOpen(false);
      setEditingProfile(null);
      fetchProfilesForStats();
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

  const activeProfiles = profiles.filter(p => p.is_active).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <ModernProfileHeader
        totalProfiles={profiles.length}
        activeProfiles={activeProfiles}
        onAddProfile={() => setIsFormOpen(true)}
        onRefresh={fetchProfilesForStats}
        loading={loading}
      />

      <ModernProfileStats profiles={profiles} />

      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            All Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
