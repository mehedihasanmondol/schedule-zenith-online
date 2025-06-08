import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
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
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasPermission } = useAuth();

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
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        hasPermission={hasPermission}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="flex justify-end p-2 md:p-4">
          <UserMenu />
        </div>
        <div className="p-2 md:p-6">
          <RoleDashboardRouter activeTab={activeTab} setActiveTab={setActiveTab} />
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
