
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, DollarSign, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const PersonalDashboard = () => {
  const { profile } = useAuth();
  const [personalStats, setPersonalStats] = useState({
    hoursThisWeek: 0,
    hoursThisMonth: 0,
    pendingHours: 0,
    approvedHours: 0,
    totalEarnings: 0,
    scheduledToday: 0,
    completedTasks: 0,
    avgHoursPerDay: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchPersonalStats();
      fetchRecentActivity();
      fetchUpcomingSchedule();
    }
  }, [profile?.id]);

  const fetchPersonalStats = async () => {
    if (!profile?.id) return;

    try {
      // Get current week dates
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      
      // Get current month dates
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch working hours for this week
      const { data: weeklyHours } = await supabase
        .from('working_hours')
        .select('total_hours, status')
        .eq('profile_id', profile.id)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0]);

      // Fetch working hours for this month
      const { data: monthlyHours } = await supabase
        .from('working_hours')
        .select('total_hours')
        .eq('profile_id', profile.id)
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0])
        .eq('status', 'approved');

      // Fetch today's schedule
      const todayString = new Date().toISOString().split('T')[0];
      const { data: todaySchedule } = await supabase
        .from('working_hours')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('date', todayString);

      // Use profile hourly rate or default
      const hourlyRate = (profile as any).hourly_rate || 25;

      // Calculate stats
      const hoursThisWeek = weeklyHours?.reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const hoursThisMonth = monthlyHours?.reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const pendingHours = weeklyHours?.filter(h => h.status === 'pending').reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const approvedHours = weeklyHours?.filter(h => h.status === 'approved').reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const totalEarnings = hoursThisMonth * hourlyRate;
      const avgHoursPerDay = hoursThisWeek / 7;

      setPersonalStats({
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
        pendingHours: Math.round(pendingHours * 10) / 10,
        approvedHours: Math.round(approvedHours * 10) / 10,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        scheduledToday: todaySchedule?.length || 0,
        completedTasks: approvedHours > 0 ? 1 : 0,
        avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching personal stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!profile?.id) return;

    try {
      const { data: recentHours } = await supabase
        .from('working_hours')
        .select(`
          *,
          clients!working_hours_client_id_fkey(company),
          projects!working_hours_project_id_fkey(name)
        `)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = recentHours?.map(h => ({
        type: 'hours',
        description: `Logged ${h.total_hours}h for ${h.projects?.name || 'Unknown Project'}`,
        time: new Date(h.created_at).toLocaleDateString(),
        status: h.status,
        color: h.status === 'approved' ? 'bg-green-500' : 
               h.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
      })) || [];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchUpcomingSchedule = async () => {
    if (!profile?.id) return;

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: upcomingHours } = await supabase
        .from('working_hours')
        .select(`
          *,
          projects!working_hours_project_id_fkey(name),
          clients!working_hours_client_id_fkey(company)
        `)
        .eq('profile_id', profile.id)
        .gte('date', tomorrow.toISOString().split('T')[0])
        .lte('date', nextWeek.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(5);

      setUpcomingSchedule(upcomingHours || []);
    } catch (error) {
      console.error('Error fetching upcoming schedule:', error);
    }
  };

  const personalDashboardStats = [
    { 
      title: "Hours This Week", 
      value: `${personalStats.hoursThisWeek}h`, 
      icon: Clock, 
      color: "text-blue-600",
      subtitle: `${personalStats.avgHoursPerDay}h avg/day`
    },
    { 
      title: "Hours This Month", 
      value: `${personalStats.hoursThisMonth}h`, 
      icon: Calendar, 
      color: "text-green-600",
      subtitle: "Approved hours"
    },
    { 
      title: "Pending Approval", 
      value: `${personalStats.pendingHours}h`, 
      icon: AlertCircle, 
      color: "text-orange-600",
      subtitle: "Awaiting review"
    },
    { 
      title: "Monthly Earnings", 
      value: `$${personalStats.totalEarnings.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-emerald-600",
      subtitle: "Based on approved hours"
    },
    { 
      title: "Scheduled Today", 
      value: personalStats.scheduledToday.toString(), 
      icon: CheckCircle, 
      color: "text-purple-600",
      subtitle: "Active sessions"
    },
    { 
      title: "Approved Hours", 
      value: `${personalStats.approvedHours}h`, 
      icon: TrendingUp, 
      color: "text-indigo-600",
      subtitle: "This week"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.full_name || 'User'}!</p>
        </div>
        <div className="text-sm text-gray-600">
          Your personal workspace overview
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personalDashboardStats.map((stat) => {
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
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
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
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSchedule.map((schedule, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">{schedule.projects?.name || 'Unknown Project'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(schedule.date).toLocaleDateString()} • {schedule.total_hours}h
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {schedule.clients?.company || 'Unknown Client'}
                  </span>
                </div>
              ))}
              {upcomingSchedule.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming schedule</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
