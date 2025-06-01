
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

interface RoleDashboardRouterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const RoleDashboardRouter = ({ activeTab, setActiveTab }: RoleDashboardRouterProps) => {
  const { profile, hasPermission, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (loading || hasRedirected || !profile) return;

    // Only redirect if user is on dashboard and hasn't been redirected yet
    if (activeTab === "dashboard") {
      let defaultTab = "dashboard";

      // Determine the best default tab based on user role and permissions
      if (hasPermission("employees_manage")) {
        defaultTab = "profiles";
      } else if (hasPermission("clients_manage")) {
        defaultTab = "clients";
      } else if (hasPermission("projects_manage")) {
        defaultTab = "projects";
      } else if (hasPermission("working_hours_manage")) {
        defaultTab = "working-hours";
      } else if (hasPermission("roster_manage")) {
        defaultTab = "roster";
      } else if (hasPermission("payroll_manage")) {
        defaultTab = "payroll";
      } else if (hasPermission("bank_balance_manage")) {
        defaultTab = "bank-balance";
      } else if (hasPermission("reports_generate")) {
        defaultTab = "reports";
      }

      // Only redirect if the determined tab is different from current and user has permission
      if (defaultTab !== "dashboard" && hasPermission(defaultTab.replace("-", "_") + "_view")) {
        console.log(`Redirecting ${profile.role} user to ${defaultTab}`);
        setActiveTab(defaultTab);
        setHasRedirected(true);
      }
    }
  }, [profile, hasPermission, loading, activeTab, setActiveTab, hasRedirected]);

  return null; // This component doesn't render anything
};
