
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Profile } from "@/types/database";

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  editingProfile: Profile | null;
  loading: boolean;
}

export const ProfileForm = ({ isOpen, onClose, onSubmit, editingProfile, loading }: ProfileFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "employee" as "admin" | "employee" | "accountant" | "operation" | "sales_manager",
    is_active: true,
    full_address: "",
    employment_type: "full-time" as "full-time" | "part-time" | "casual",
    hourly_rate: 0,
    salary: 0,
    tax_file_number: "",
    start_date: ""
  });

  useEffect(() => {
    if (editingProfile) {
      setFormData({
        full_name: editingProfile.full_name || "",
        email: editingProfile.email || "",
        phone: editingProfile.phone || "",
        role: editingProfile.role,
        is_active: editingProfile.is_active,
        full_address: editingProfile.full_address || "",
        employment_type: editingProfile.employment_type || "full-time",
        hourly_rate: editingProfile.hourly_rate || 0,
        salary: editingProfile.salary || 0,
        tax_file_number: editingProfile.tax_file_number || "",
        start_date: editingProfile.start_date || ""
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        role: "employee",
        is_active: true,
        full_address: "",
        employment_type: "full-time",
        hourly_rate: 0,
        salary: 0,
        tax_file_number: "",
        start_date: ""
      });
    }
  }, [editingProfile, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const roleOptions = [
    { value: "admin", label: "Administrator" },
    { value: "employee", label: "Employee" },
    { value: "accountant", label: "Accountant" },
    { value: "operation", label: "Operations" },
    { value: "sales_manager", label: "Sales Manager" }
  ];

  const employmentTypeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "casual", label: "Casual" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProfile ? "Edit Profile" : "Profile Information"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: "admin" | "employee" | "accountant" | "operation" | "sales_manager") => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select 
                value={formData.employment_type} 
                onValueChange={(value: "full-time" | "part-time" | "casual") => 
                  setFormData({ ...formData, employment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="is_active">Status</Label>
              <Select 
                value={formData.is_active ? "active" : "inactive"} 
                onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
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
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="salary">Annual Salary ($)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="tax_file_number">Tax File Number</Label>
              <Input
                id="tax_file_number"
                value={formData.tax_file_number}
                onChange={(e) => setFormData({ ...formData, tax_file_number: e.target.value })}
                placeholder="Enter TFN"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="full_address">Full Address</Label>
            <Textarea
              id="full_address"
              value={formData.full_address}
              onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
              placeholder="Enter complete address"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : editingProfile ? "Update Profile" : "Save Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
