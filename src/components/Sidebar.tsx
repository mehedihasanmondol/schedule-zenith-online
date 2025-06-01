
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FolderOpen, 
  Clock, 
  Calendar,
  FileText, 
  Wallet,
  Bell,
  DollarSign,
  Menu,
  Shield,
  User
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasPermission: (permission: string) => boolean;
}

export const Sidebar = ({ activeTab, onTabChange, hasPermission }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { 
      id: "dashboard", 
      label: "Default Dashboard", 
      icon: LayoutDashboard,
      permission: "dashboard_view"
    },
    { 
      id: "personal-dashboard", 
      label: "My Dashboard", 
      icon: User,
      permission: null // Always available to authenticated users
    },
    { 
      id: "profiles", 
      label: "Profiles", 
      icon: Users,
      permission: "employees_view"
    },
    { 
      id: "clients", 
      label: "Clients", 
      icon: Building2,
      permission: "clients_view"
    },
    { 
      id: "projects", 
      label: "Projects", 
      icon: FolderOpen,
      permission: "projects_view"
    },
    { 
      id: "working-hours", 
      label: "Working Hours", 
      icon: Clock,
      permission: "working_hours_view"
    },
    { 
      id: "roster", 
      label: "Roster", 
      icon: Calendar,
      permission: "roster_view"
    },
    { 
      id: "payroll", 
      label: "Payroll", 
      icon: DollarSign,
      permission: "payroll_view"
    },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: Bell,
      permission: "notifications_view"
    },
    { 
      id: "reports", 
      label: "Reports", 
      icon: FileText,
      permission: "reports_view"
    },
    { 
      id: "bank-balance", 
      label: "Bank Balance", 
      icon: Wallet,
      permission: "bank_balance_view"
    },
    { 
      id: "permissions", 
      label: "Permissions", 
      icon: Shield,
      permission: "employees_manage"
    },
  ];

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => 
    item.permission === null || hasPermission(item.permission)
  );

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-gray-900">
            Schedule & Payroll
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      <nav className="mt-8">
        <ul className="space-y-2 px-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
