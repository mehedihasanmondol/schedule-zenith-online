import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  Shield,
  User,
  Calculator,
  ChevronLeft
} from "lucide-react";

interface FloatingNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasPermission: (permission: string) => boolean;
}

export const FloatingNavigation = ({ activeTab, onTabChange, hasPermission }: FloatingNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
      permission: null
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

  const visibleMenuItems = menuItems.filter(item => 
    item.permission === null || hasPermission(item.permission)
  );

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
        {/* Trigger Tab - Always visible on right edge */}
        <DrawerTrigger asChild>
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30">
            <Button
              variant="default"
              className="h-16 w-8 rounded-l-lg rounded-r-none shadow-lg flex items-center justify-center"
              onClick={() => setIsOpen(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </DrawerTrigger>

        {/* Drawer Content */}
        <DrawerContent className="h-full w-80 fixed right-0 top-0 rounded-none border-l">
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {visibleMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg transition-colors text-xs min-h-[80px]",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};