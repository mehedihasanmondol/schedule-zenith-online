
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, Calendar, DollarSign, CheckCircle, AlertCircle, TrendingUp, CalendarRange } from "lucide-react";
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
  const [dateShortcut, setDateShortcut] = useState('current-week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default dates to current week
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    
    setStartDate(mondayDate.toISOString().split('T')[0]);
    setEndDate(sundayDate.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (profile?.id && startDate && endDate) {
      fetchPersonalStats();
      fetchRecentActivity();
      fetchUpcomingSchedule();
    }
  }, [profile?.id, startDate, endDate]);

  const handleDateShortcut = (shortcut: string) => {
    setDateShortcut(shortcut);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    let start: Date, end: Date;
    
    switch (shortcut) {
      case "last-week":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 6);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        start = lastWeekStart;
        end = lastWeekEnd;
        break;
        
      case "current-week":
        const currentDay = today.getDay();
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);
        start = mondayDate;
        end = sundayDate;
        break;
        
      case "last-month":
        start = new Date(currentYear, currentMonth - 1, 1);
        end = new Date(currentYear, currentMonth, 0);
        break;
        
      case "this-year":
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31);
        break;
        
      default:
        // Handle month shortcuts (january, february, etc.)
        const monthNames = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const monthIndex = monthNames.indexOf(shortcut.toLowerCase());
        if (monthIndex !== -1) {
          start = new Date(currentYear, monthIndex, 1);
          end = new Date(currentYear, monthIndex + 1, 0);
        } else {
          return;
        }
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const generateShortcutOptions = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const options = [
      { value: "last-week", label: "Last Week" },
      { value: "current-week", label: "Current Week" },
      { value: "last-month", label: "Last Month" },
    ];
    
    // Add months from current month down to January
    for (let i = currentMonth; i >= 0; i--) {
      options.push({
        value: monthNames[i].toLowerCase(),
        label: monthNames[i]
      });
    }
    
    options.push({ value: "this-year", label: "This Year" });
    
    return options;
  };

  const fetchPersonalStats = async () => {
    if (!profile?.id) return;

    try {
      const startDateStr = startDate;
      const endDateStr = endDate;

      // Fetch working hours for date range
      const { data: dateRangeHours } = await supabase
        .from('working_hours')
        .select('total_hours, status, date')
        .eq('profile_id', profile.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      // Fetch today's schedule
      const todayString = new Date().toISOString().split('T')[0];
      const { data: todaySchedule } = await supabase
        .from('working_hours')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('date', todayString);

      // Use profile hourly rate or default
      const hourlyRate = (profile as any).hourly_rate || 25;

      // Calculate stats based on date range
      const totalHours = dateRangeHours?.reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const pendingHours = dateRangeHours?.filter(h => h.status === 'pending').reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const approvedHours = dateRangeHours?.filter(h => h.status === 'approved').reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const totalEarnings = approvedHours * hourlyRate;
      
      // Calculate weekly averages for date range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)) + 1;
      const avgHoursPerDay = totalHours / Math.max(daysDiff, 1);

      setPersonalStats({
        hoursThisWeek: Math.round(totalHours * 10) / 10,
        hoursThisMonth: Math.round(totalHours * 10) / 10,
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
        .gte('date', startDate)
        .lte('date', endDate)
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
      title: "Total Hours", 
      value: `${personalStats.hoursThisWeek}h`, 
      icon: Clock, 
      color: "text-blue-600",
      subtitle: `${personalStats.avgHoursPerDay.toFixed(1)}h avg/day`
    },
    { 
      title: "Approved Hours", 
      value: `${personalStats.approvedHours}h`, 
      icon: CheckCircle, 
      color: "text-green-600",
      subtitle: "Confirmed work"
    },
    { 
      title: "Pending Approval", 
      value: `${personalStats.pendingHours}h`, 
      icon: AlertCircle, 
      color: "text-orange-600",
      subtitle: "Awaiting review"
    },
    { 
      title: "Total Earnings", 
      value: `$${personalStats.totalEarnings.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-emerald-600",
      subtitle: "Based on approved hours"
    },
    { 
      title: "Scheduled Today", 
      value: personalStats.scheduledToday.toString(), 
      icon: Calendar, 
      color: "text-purple-600",
      subtitle: "Active sessions"
    },
    { 
      title: "Performance", 
      value: `${personalStats.approvedHours > 0 ? '✓' : '-'}`, 
      icon: TrendingUp, 
      color: "text-indigo-600",
      subtitle: "This period"
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.full_name || 'User'}!</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:gap-4 md:space-y-0">
          <Select value={dateShortcut} onValueChange={handleDateShortcut}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Date shortcut" />
            </SelectTrigger>
            <SelectContent>
              {generateShortcutOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:gap-2 md:space-y-0">
            <CalendarRange className="h-4 w-4 text-gray-500 hidden md:block" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full md:w-40"
              placeholder="Start Date"
            />
            <span className="text-gray-500 text-center md:text-left">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full md:w-40"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start md:items-center space-x-3">
                  <div className={`w-2 h-2 ${activity.color} rounded-full mt-2 md:mt-0`}></div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm block">{activity.description}</span>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.time}</span>
                      <span className={`text-xs px-2 py-1 rounded w-fit ${
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
                <p className="text-sm text-gray-500 text-center py-4">No recent activity in selected period</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSchedule.map((schedule, index) => (
                <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-center p-3 bg-blue-50 rounded-lg space-y-2 md:space-y-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{schedule.projects?.name || 'Unknown Project'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(schedule.date).toLocaleDateString()} • {schedule.total_hours}h
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded w-fit">
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
