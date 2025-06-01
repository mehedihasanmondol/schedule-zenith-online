
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Clock, DollarSign, Building, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProfiles: 0,
    activeProjects: 0,
    pendingHours: 0,
    totalRevenue: 0,
    bankAccounts: 0,
    completedProjects: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profiles count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Fetch projects count
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, status');

      if (projectsError) throw projectsError;

      // Fetch pending working hours
      const { data: workingHours, error: workingHoursError } = await supabase
        .from('working_hours')
        .select(`
          total_hours,
          status,
          profiles!working_hours_profile_id_fkey (id, full_name)
        `)
        .eq('status', 'pending');

      if (workingHoursError) throw workingHoursError;

      // Fetch bank transactions for revenue
      const { data: transactions, error: transactionsError } = await supabase
        .from('bank_transactions')
        .select('amount, type')
        .eq('type', 'deposit');

      if (transactionsError) throw transactionsError;

      // Fetch bank accounts count
      const { data: bankAccounts, error: bankAccountsError } = await supabase
        .from('bank_accounts')
        .select('id');

      if (bankAccountsError) throw bankAccountsError;

      // Fetch recent working hours with profiles for activities
      const { data: recentHours, error: recentHoursError } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentHoursError) throw recentHoursError;

      // Calculate stats
      const totalProfiles = profiles?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
      
      // Handle working hours data safely
      const pendingHours = (workingHours || []).reduce((sum, wh) => sum + wh.total_hours, 0);
      
      const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalBankAccounts = bankAccounts?.length || 0;

      // Format recent activities with safe data handling
      const activities = (recentHours || []).map(wh => {
        const profileName = wh.profiles?.full_name || 'Unknown User';
        const projectName = wh.projects?.name || 'Unknown Project';
        
        return {
          type: 'hours',
          description: `${profileName} logged ${wh.total_hours}h for ${projectName}`,
          time: new Date(wh.created_at).toLocaleDateString(),
          status: wh.status
        };
      });

      setStats({
        totalProfiles,
        activeProjects,
        pendingHours,
        totalRevenue,
        bankAccounts: totalBankAccounts,
        completedProjects
      });

      setRecentActivities(activities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    { 
      title: "Total Profiles", 
      value: stats.totalProfiles.toString(), 
      icon: Users, 
      color: "text-blue-600" 
    },
    { 
      title: "Active Projects", 
      value: stats.activeProjects.toString(), 
      icon: Briefcase, 
      color: "text-green-600" 
    },
    { 
      title: "Pending Hours", 
      value: `${stats.pendingHours}h`, 
      icon: Clock, 
      color: "text-orange-600" 
    },
    { 
      title: "Total Revenue", 
      value: `$${stats.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-emerald-600" 
    },
    { 
      title: "Bank Accounts", 
      value: stats.bankAccounts.toString(), 
      icon: Building, 
      color: "text-purple-600" 
    },
    { 
      title: "Completed Projects", 
      value: stats.completedProjects.toString(), 
      icon: FileText, 
      color: "text-gray-600" 
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your business management overview</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <span className="text-sm">{activity.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
