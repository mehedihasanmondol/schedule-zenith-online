
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { ProfileForm } from "./profile/ProfileForm";
import { ProfileTable } from "./profile/ProfileTable";
import { ProfileStats } from "./profile/ProfileStats";

export const ProfileManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', editingProfile.id);

        if (error) throw error;
        toast({ title: "Success", description: "Profile updated successfully" });
      } else {
        toast({ 
          title: "Info", 
          description: "New profiles are created automatically when users sign up",
          variant: "default"
        });
      }

      setIsDialogOpen(false);
      setEditingProfile(null);
      fetchProfiles();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this profile?")) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Profile deactivated successfully" });
      fetchProfiles();
    } catch (error) {
      console.error('Error deactivating profile:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate profile",
        variant: "destructive"
      });
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    (profile.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && profiles.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Profiles</h1>
            <p className="text-gray-600">Manage your team members and their roles</p>
          </div>
        </div>
        <Button 
          className="flex items-center gap-2" 
          onClick={() => {
            setEditingProfile(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {/* Stats Cards */}
      <ProfileStats profiles={profiles} />

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Profiles ({filteredProfiles.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileTable 
            profiles={filteredProfiles}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Profile Form Dialog */}
      <ProfileForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        editingProfile={editingProfile}
        loading={loading}
      />
    </div>
  );
};
