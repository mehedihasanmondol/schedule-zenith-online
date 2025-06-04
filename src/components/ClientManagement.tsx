
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EnhancedClientTable } from "./client/EnhancedClientTable";
import { ClientForm } from "./client/ClientForm";
import { ClientStats } from "./client/ClientStats";

export const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchProjectCounts();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients((data || []) as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('client_id');

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(project => {
        counts[project.client_id] = (counts[project.client_id] || 0) + 1;
      });
      setProjectCounts(counts);
    } catch (error) {
      console.error('Error fetching project counts:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? This will also delete all associated projects.")) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Client deleted successfully" });
      fetchClients();
      fetchProjectCounts();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    setFormLoading(true);
    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast({ title: "Success", description: "Client updated successfully" });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Success", description: "Client added successfully" });
      }

      setIsFormOpen(false);
      setEditingClient(null);
      fetchClients();
      fetchProjectCounts();
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save client",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const totalProjects = Object.values(projectCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600">Manage clients with advanced search, filtering, and export features</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <ClientStats clients={clients} totalProjects={totalProjects} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">All Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EnhancedClientTable 
            clients={clients} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            projectCounts={projectCounts}
            loading={loading}
          />
        </CardContent>
      </Card>

      <ClientForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClient(null);
        }}
        onSubmit={handleSubmit}
        editingClient={editingClient}
        loading={formLoading}
      />
    </div>
  );
};
