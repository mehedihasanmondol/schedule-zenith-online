
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, FileText, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SalaryTemplate, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface SalaryTemplateManagementProps {
  templates: SalaryTemplate[];
  profiles: Profile[];
  onRefresh: () => void;
}

export const SalaryTemplateManagement = ({ templates, profiles, onRefresh }: SalaryTemplateManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SalaryTemplate | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    profile_id: "",
    base_hourly_rate: "",
    overtime_multiplier: "1.5",
    deduction_percentage: "0.1",
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        profile_id: formData.profile_id || null,
        base_hourly_rate: parseFloat(formData.base_hourly_rate),
        overtime_multiplier: parseFloat(formData.overtime_multiplier),
        deduction_percentage: parseFloat(formData.deduction_percentage),
        is_active: formData.is_active
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('salary_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        const { error } = await supabase
          .from('salary_templates')
          .insert([templateData]);
        if (error) throw error;
        toast({ title: "Success", description: "Template created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      profile_id: "",
      base_hourly_rate: "",
      overtime_multiplier: "1.5",
      deduction_percentage: "0.1",
      is_active: true
    });
    setEditingTemplate(null);
  };

  const editTemplate = (template: SalaryTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      profile_id: template.profile_id || "",
      base_hourly_rate: template.base_hourly_rate.toString(),
      overtime_multiplier: template.overtime_multiplier.toString(),
      deduction_percentage: template.deduction_percentage.toString(),
      is_active: template.is_active
    });
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('salary_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Template deleted successfully" });
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Salary Templates</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Salary Template" : "Create Salary Template"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Standard Employee Rate"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="profile_id">Specific Employee (Optional)</Label>
                    <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific employee</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="base_hourly_rate">Base Hourly Rate *</Label>
                    <Input
                      id="base_hourly_rate"
                      type="number"
                      step="0.01"
                      value={formData.base_hourly_rate}
                      onChange={(e) => setFormData({ ...formData, base_hourly_rate: e.target.value })}
                      placeholder="25.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="overtime_multiplier">Overtime Multiplier</Label>
                    <Input
                      id="overtime_multiplier"
                      type="number"
                      step="0.1"
                      value={formData.overtime_multiplier}
                      onChange={(e) => setFormData({ ...formData, overtime_multiplier: e.target.value })}
                      placeholder="1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deduction_percentage">Deduction Percentage</Label>
                    <Input
                      id="deduction_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.deduction_percentage}
                      onChange={(e) => setFormData({ ...formData, deduction_percentage: e.target.value })}
                      placeholder="0.1 (10%)"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active Template</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description for this template"
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <FileText className="h-6 w-6 text-orange-600" />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Hourly Rate:</span>
                    <span className="font-medium">${template.base_hourly_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime:</span>
                    <span className="font-medium">{template.overtime_multiplier}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deductions:</span>
                    <span className="font-medium">{(template.deduction_percentage * 100).toFixed(1)}%</span>
                  </div>
                  {template.profiles && (
                    <div className="flex justify-between">
                      <span>Employee:</span>
                      <span className="font-medium text-blue-600">{template.profiles.full_name}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No salary templates found</p>
              <p className="text-sm">Create a template to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
