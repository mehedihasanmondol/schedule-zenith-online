
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw } from "lucide-react";

type Role = 'admin' | 'employee' | 'accountant' | 'operation' | 'sales_manager';
type Permission = 'dashboard_view' | 'employees_view' | 'employees_manage' | 'clients_view' | 'clients_manage' | 'projects_view' | 'projects_manage' | 'working_hours_view' | 'working_hours_manage' | 'working_hours_approve' | 'roster_view' | 'roster_manage' | 'payroll_view' | 'payroll_manage' | 'payroll_process' | 'bank_balance_view' | 'bank_balance_manage' | 'reports_view' | 'reports_generate' | 'notifications_view';

interface RolePermission {
  role: Role;
  permission: Permission;
}

export const RolePermissionsManager = () => {
  const [rolePermissions, setRolePermissions] = useState<Record<Role, Permission[]>>({
    admin: [],
    employee: [],
    accountant: [],
    operation: [],
    sales_manager: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const roles: Role[] = ['admin', 'employee', 'accountant', 'operation', 'sales_manager'];
  
  const allPermissions: Permission[] = [
    'dashboard_view',
    'employees_view', 
    'employees_manage',
    'clients_view',
    'clients_manage',
    'projects_view',
    'projects_manage',
    'working_hours_view',
    'working_hours_manage',
    'working_hours_approve',
    'roster_view',
    'roster_manage',
    'payroll_view',
    'payroll_manage',
    'payroll_process',
    'bank_balance_view',
    'bank_balance_manage',
    'reports_view',
    'reports_generate',
    'notifications_view'
  ];

  const permissionLabels: Record<Permission, string> = {
    dashboard_view: "View Dashboard",
    employees_view: "View Employees",
    employees_manage: "Manage Employees",
    clients_view: "View Clients",
    clients_manage: "Manage Clients",
    projects_view: "View Projects",
    projects_manage: "Manage Projects",
    working_hours_view: "View Working Hours",
    working_hours_manage: "Manage Working Hours",
    working_hours_approve: "Approve Working Hours",
    roster_view: "View Roster",
    roster_manage: "Manage Roster",
    payroll_view: "View Payroll",
    payroll_manage: "Manage Payroll",
    payroll_process: "Process Payroll",
    bank_balance_view: "View Bank Balance",
    bank_balance_manage: "Manage Bank Balance",
    reports_view: "View Reports",
    reports_generate: "Generate Reports",
    notifications_view: "View Notifications"
  };

  const roleLabels: Record<Role, string> = {
    admin: "Administrator",
    employee: "Employee",
    accountant: "Accountant",
    operation: "Operations",
    sales_manager: "Sales Manager"
  };

  useEffect(() => {
    fetchRolePermissions();
  }, []);

  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permission');

      if (error) throw error;

      const permissionsByRole: Record<Role, Permission[]> = {
        admin: [],
        employee: [],
        accountant: [],
        operation: [],
        sales_manager: []
      };

      data?.forEach((item) => {
        const role = item.role as Role;
        const permission = item.permission as Permission;
        if (permissionsByRole[role]) {
          permissionsByRole[role].push(permission);
        }
      });

      setRolePermissions(permissionsByRole);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load role permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (role: Role, permission: Permission, checked: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: checked 
        ? [...prev[role], permission]
        : prev[role].filter(p => p !== permission)
    }));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // Delete all existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (deleteError) throw deleteError;

      // Insert new permissions
      const permissionsToInsert: RolePermission[] = [];
      
      Object.entries(rolePermissions).forEach(([role, permissions]) => {
        permissions.forEach(permission => {
          permissionsToInsert.push({
            role: role as Role,
            permission: permission as Permission
          });
        });
      });

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Role permissions updated successfully"
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Failed to save permissions",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Role Permissions</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={fetchRolePermissions}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={savePermissions}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map(role => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {roleLabels[role]}
                <Badge variant="secondary">
                  {rolePermissions[role].length} permissions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allPermissions.map(permission => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${role}-${permission}`}
                      checked={rolePermissions[role].includes(permission)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(role, permission, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`${role}-${permission}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permissionLabels[permission]}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
