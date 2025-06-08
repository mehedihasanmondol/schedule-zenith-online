
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  User,
  Calculator
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasPermission: (permission: string) => boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const Sidebar = ({ activeTab, onTabChange, hasPermission, onCollapsedChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if device is mobile/tablet and set initial collapsed state
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // 768px is md breakpoint
      setIsCollapsed(isMobile);
      onCollapsedChange?.(isMobile);
    };

    // Check on initial load
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [onCollapsedChange]);

  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    // Auto-collapse on mobile after navigation
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
      onCollapsedChange?.(true);
    }
  };

  const menuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
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
      id: "salary", 
      label: "Salary Management", 
      icon: Calculator,
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
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        {!isCollapsed && (
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Schedule & Payroll
          </h2>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      <ScrollArea className="flex-1 mt-8">
        <nav className="px-2">
          <ul className="space-y-2">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors text-sm md:text-base",
                      isActive
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
    </div>
  );
};
