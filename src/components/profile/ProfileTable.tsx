
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CreditCard } from "lucide-react";
import { Profile } from "@/types/database";
import { ActionDropdown, ActionItem } from "@/components/ui/action-dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const getActionItems = (profile: Profile): ActionItem[] => {
    const items: ActionItem[] = [
      {
        label: "Edit",
        onClick: () => onEdit(profile),
        icon: <Edit className="h-4 w-4" />
      }
    ];

    if (onManageBank) {
      items.push({
        label: "Manage Bank",
        onClick: () => onManageBank(profile),
        icon: <CreditCard className="h-4 w-4" />
      });
    }

    items.push({
      label: "Delete",
      onClick: () => onDelete(profile.id),
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true
    });

    return items;
  };

  return (
    <div className="w-full">
      {/* Mobile/Tablet Card Layout */}
      <div className="block lg:hidden space-y-3">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {profile.full_name || 'Unnamed User'}
                </h3>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                {profile.phone && (
                  <p className="text-xs text-gray-500">{profile.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={profile.is_active ? "default" : "secondary"} className="text-xs">
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
                <ActionDropdown items={getActionItems(profile)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Role:</span>
                <p className="font-medium">{getRoleLabel(profile.role)}</p>
              </div>
              <div>
                <span className="text-gray-500">Rate:</span>
                <p className="font-medium text-green-600">
                  ${(profile.hourly_rate || 0).toFixed(2)}/hr
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Created:</span>
                <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[120px]">Role</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  {profile.full_name || 'Unnamed User'}
                </TableCell>
                <TableCell className="text-sm">{profile.email}</TableCell>
                <TableCell className="text-sm">{profile.phone || 'N/A'}</TableCell>
                <TableCell className="text-sm">
                  {getRoleLabel(profile.role)}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium text-green-600">
                    ${(profile.hourly_rate || 0).toFixed(2)}/hr
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={profile.is_active ? "default" : "secondary"} className="text-xs">
                    {profile.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(profile.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ActionDropdown items={getActionItems(profile)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
