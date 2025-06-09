
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Bell, Maximize, Minimize } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { PersonalDashboard } from "@/components/PersonalDashboard";
import { ProfileManagement } from "@/components/ProfileManagement";
import { ClientManagement } from "@/components/ClientManagement";
import { ProjectManagement } from "@/components/ProjectManagement";
import { WorkingHoursComponent } from "@/components/WorkingHours";
import { RosterComponent } from "@/components/Roster";
import { PayrollComponent } from "@/components/Payroll";
import { Notifications } from "@/components/Notifications";
import { Reports } from "@/components/Reports";
import { BankBalance } from "@/components/BankBalance";
import { SalaryManagement } from "@/components/SalaryManagement";
import { RolePermissionsManager } from "@/components/RolePermissionsManager";
import { UserMenu } from "@/components/UserMenu";
import { RoleDashboardRouter } from "@/components/RoleDashboardRouter";
import { RosterReport } from "@/components/RosterReport";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { hasPermission, user } = useAuth();

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) return;
      
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_profile_id', user.id)
          .eq('is_read', false);

        if (error) throw error;
        setNotificationCount(count || 0);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `recipient_profile_id=eq.${user?.id}`
        }, 
        () => {
          fetchNotificationCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "personal-dashboard":
        return <PersonalDashboard />;
      case "profiles":
        return <ProfileManagement />;
      case "clients":
        return <ClientManagement />;
      case "projects":
        return <ProjectManagement />;
      case "working-hours":
        return <WorkingHoursComponent />;
      case "roster":
        return <RosterComponent />;
      case "roster-report":
        return <RosterReport />;
      case "payroll":
        return <PayrollComponent />;
      case "salary":
        return <SalaryManagement />;
      case "notifications":
        return <Notifications />;
      case "reports":
        return <Reports />;
      case "bank-balance":
        return <BankBalance />;
      case "permissions":
        return <RolePermissionsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          hasPermission={hasPermission}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 flex justify-between items-center p-2 md:p-4 bg-white border-b border-gray-200">
          {/* Left side - Navigation Toggle + App Name */}
          <div className="flex items-center flex-1">
            {/* Navigation Toggle */}
            <div className="mr-3 md:mr-4">
              

              {/* Mobile Navigation Sheet */}
              <div className="md:hidden">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <Sidebar 
                      activeTab={activeTab} 
                      onTabChange={(tab) => {
                        setActiveTab(tab);
                        setMobileNavOpen(false);
                      }} 
                      hasPermission={hasPermission}
                      onCollapsedChange={() => {}}
                      isMobile={true}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* App Name - Always visible on mobile, visible on desktop when sidebar collapsed */}
            <div className={`flex-1 ${sidebarCollapsed ? 'md:block' : 'md:hidden'} block`}>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Schedule & Payroll
              </h1>
            </div>
          </div>

          {/* Right side - Fullscreen + Notifications + User Menu */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="relative"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>

            {/* Notification Bell */}
            {hasPermission('notifications_view') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab('notifications')}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Page Content */}
        <div className="p-2 md:p-6">
          <RoleDashboardRouter activeTab={activeTab} setActiveTab={setActiveTab} />
          {renderContent()}
        </div>
      </div>

      {/* Floating Navigation for Mobile */}
      <FloatingNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasPermission={hasPermission}
      />
    </div>
  );
};

export default Index;
