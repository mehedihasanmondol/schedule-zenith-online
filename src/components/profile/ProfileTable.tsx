
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CreditCard } from "lucide-react";
import { Profile } from "@/types/database";

interface ProfileTableProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  onManageBank?: (profile: Profile) => void;
}

export const ProfileTable = ({ profiles, onEdit, onDelete, onManageBank }: ProfileTableProps) => {
  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      employee: 'Employee',
      accountant: 'Accountant',
      operation: 'Operations',
      sales_manager: 'Sales Manager'
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Hourly Rate</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{profile.full_name || 'Unnamed User'}</td>
              <td className="py-3 px-4 text-gray-600">{profile.email}</td>
              <td className="py-3 px-4 text-gray-600">{profile.phone || 'N/A'}</td>
              <td className="py-3 px-4 text-gray-600">{getRoleLabel(profile.role)}</td>
              <td className="py-3 px-4 text-gray-600">
                <span className="font-medium text-green-600">
                  ${(profile.hourly_rate || 0).toFixed(2)}/hr
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge variant={profile.is_active ? "default" : "secondary"}>
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="py-3 px-4 text-gray-600">{new Date(profile.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(profile)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {onManageBank && (
                    <Button variant="ghost" size="sm" onClick={() => onManageBank(profile)}>
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDelete(profile.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
