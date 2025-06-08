
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, Briefcase, Clock, DollarSign, Building, FileText, TrendingUp, Calendar, Bell, BarChart3, Banknote, UserCheck, Filter, CalendarRange } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProfiles: 0,
    activeProjects: 0,
    pendingHours: 0,
    totalRevenue: 0,
    bankAccounts: 0,
    completedProjects: 0,
    totalClients: 0,
    totalRosters: 0,
    totalPayroll: 0,
    unreadNotifications: 0,
    totalHours: 0,
    netCashFlow: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateShortcut, setDateShortcut] = useState('current-week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any[]>([]);
  const [hoursData, setHoursData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

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
    if (startDate && endDate) {
      fetchDashboardData();
    }
  }, [startDate, endDate]);

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

  const fetchDashboardData = async () => {
    try {
      const startDateStr = startDate;
      const endDateStr = endDate;

      // Fetch comprehensive data for complete app summary
      const [
        profilesRes, projectsRes, workingHoursRes, transactionsRes, bankAccountsRes,
        clientsRes, rostersRes, payrollRes, notificationsRes, recentHoursRes
      ] = await Promise.all([
        // Profiles
        supabase.from('profiles').select('id, full_name, role, is_active').eq('is_active', true),
        
        // Projects  
        supabase.from('projects').select('id, status, budget, start_date, end_date'),
        
        // Working hours for date range
        supabase.from('working_hours').select(`
          total_hours, status, date, payable_amount,
          profiles!working_hours_profile_id_fkey (id, full_name),
          projects!working_hours_project_id_fkey (id, name)
        `).gte('date', startDateStr).lte('date', endDateStr),
        
        // Bank transactions
        supabase.from('bank_transactions').select('amount, type, date, category')
          .gte('date', startDateStr).lte('date', endDateStr),
        
        // Bank accounts
        supabase.from('bank_accounts').select('id, bank_name, opening_balance'),
        
        // Clients
        supabase.from('clients').select('id, status'),
        
        // Rosters for date range
        supabase.from('rosters').select('id, status, date, total_hours')
          .gte('date', startDateStr).lte('date', endDateStr),
        
        // Payroll for date range
        supabase.from('payroll').select('id, status, gross_pay, net_pay, pay_period_start, pay_period_end')
          .gte('pay_period_start', startDateStr).lte('pay_period_end', endDateStr),
        
        // Notifications
        supabase.from('notifications').select('id, is_read, priority, created_at')
          .gte('created_at', new Date(startDate).toISOString()).lte('created_at', new Date(endDate).toISOString()),
        
        // Recent activities
        supabase.from('working_hours').select(`
          *, profiles!working_hours_profile_id_fkey (id, full_name),
          projects!working_hours_project_id_fkey (id, name)
        `).order('created_at', { ascending: false }).limit(10)
      ]);

      // Handle errors
      if (profilesRes.error) throw profilesRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (workingHoursRes.error) throw workingHoursRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (bankAccountsRes.error) throw bankAccountsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (rostersRes.error) throw rostersRes.error;
      if (payrollRes.error) throw payrollRes.error;
      if (notificationsRes.error) throw notificationsRes.error;
      if (recentHoursRes.error) throw recentHoursRes.error;

      const profiles = profilesRes.data || [];
      const projects = projectsRes.data || [];
      const workingHours = workingHoursRes.data || [];
      const transactions = transactionsRes.data || [];
      const bankAccounts = bankAccountsRes.data || [];
      const clients = clientsRes.data || [];
      const rosters = rostersRes.data || [];
      const payrollData = payrollRes.data || [];
      const notifications = notificationsRes.data || [];
      const recentHours = recentHoursRes.data || [];

      // Calculate comprehensive app statistics
      const totalProfiles = profiles.length;
      const activeProfiles = profiles.filter(p => p.role !== 'admin').length;
      const adminProfiles = profiles.filter(p => p.role === 'admin').length;
      
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const projectBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      
      const totalClients = clients.length;
      const activeClients = clients.filter(c => c.status === 'active').length;
      
      const totalHours = workingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
      const pendingHours = workingHours.filter(wh => wh.status === 'pending').reduce((sum, wh) => sum + wh.total_hours, 0);
      const approvedHours = workingHours.filter(wh => wh.status === 'approved').reduce((sum, wh) => sum + wh.total_hours, 0);
      const totalPayableAmount = workingHours.reduce((sum, wh) => sum + (wh.payable_amount || 0), 0);
      
      const totalRosters = rosters.length;
      const pendingRosters = rosters.filter(r => r.status === 'pending').length;
      const confirmedRosters = rosters.filter(r => r.status === 'confirmed').length;
      
      const totalPayroll = payrollData.reduce((sum, p) => sum + p.net_pay, 0);
      const pendingPayroll = payrollData.filter(p => p.status === 'pending').length;
      const paidPayroll = payrollData.filter(p => p.status === 'paid').length;
      
      const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
      const totalRevenue = deposits;
      const netCashFlow = deposits - withdrawals;
      
      const totalBankAccounts = bankAccounts.length;
      const totalBankBalance = bankAccounts.reduce((sum, ba) => sum + (ba.opening_balance || 0), 0);
      
      const totalNotifications = notifications.length;
      const unreadNotifications = notifications.filter(n => !n.is_read).length;
      const highPriorityNotifications = notifications.filter(n => n.priority === 'high').length;

      // Prepare chart data for hours over time
      const hoursChartData = (workingHours || []).reduce((acc: any[], wh) => {
        const date = wh.date;
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.hours += wh.total_hours;
        } else {
          acc.push({ date, hours: wh.total_hours });
        }
        return acc;
      }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Prepare project data for charts
      const projectChartData = (workingHours || []).reduce((acc: any[], wh) => {
        const projectName = wh.projects?.name || 'Unknown';
        const existing = acc.find(item => item.name === projectName);
        if (existing) {
          existing.hours += wh.total_hours;
        } else {
          acc.push({ name: projectName, hours: wh.total_hours });
        }
        return acc;
      }, []);

      // Prepare revenue data for charts
      const revenueChartData = (transactions || []).reduce((acc: any[], t) => {
        const date = t.date;
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.revenue += t.amount;
        } else {
          acc.push({ date, revenue: t.amount });
        }
        return acc;
      }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Prepare employee performance data
      const employeePerformanceData = (workingHours || []).reduce((acc: any[], wh) => {
        const employeeName = wh.profiles?.full_name || 'Unknown';
        const existing = acc.find(item => item.name === employeeName);
        if (existing) {
          existing.hours += wh.total_hours;
          existing.amount += wh.payable_amount || 0;
        } else {
          acc.push({ 
            name: employeeName, 
            hours: wh.total_hours, 
            amount: wh.payable_amount || 0 
          });
        }
        return acc;
      }, []);

      // Prepare client revenue data
      const clientRevenueData = (transactions || []).reduce((acc: any[], t) => {
        const category = t.category || 'General';
        const existing = acc.find(item => item.category === category);
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category, amount: t.amount });
        }
        return acc;
      }, []);

      // Prepare monthly comparison data
      const monthlyComparisonData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        
        const monthHours = (workingHours || []).filter(wh => {
          const whDate = new Date(wh.date);
          return whDate.getMonth() === month.getMonth() && whDate.getFullYear() === month.getFullYear();
        }).reduce((sum, wh) => sum + wh.total_hours, 0);
        
        const monthRevenue = (transactions || []).filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === month.getMonth() && tDate.getFullYear() === month.getFullYear();
        }).reduce((sum, t) => sum + t.amount, 0);

        monthlyComparisonData.push({
          month: monthName,
          hours: monthHours,
          revenue: monthRevenue
        });
      }

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
        completedProjects,
        totalClients,
        totalRosters,
        totalPayroll,
        unreadNotifications,
        totalHours,
        netCashFlow
      });

      setRecentActivities(activities);
      setChartData(revenueChartData);
      setProjectData(projectChartData);
      setHoursData(hoursChartData);
      setEmployeeData(employeePerformanceData);
      setPayrollData(payrollData);
      setClientData(clientRevenueData);
      setMonthlyData(monthlyComparisonData);

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
      title: "Total Clients", 
      value: stats.totalClients.toString(), 
      icon: UserCheck, 
      color: "text-indigo-600" 
    },
    { 
      title: "Total Hours", 
      value: `${Math.round(stats.totalHours)}h`, 
      icon: Clock, 
      color: "text-blue-500" 
    },
    { 
      title: "Pending Hours", 
      value: `${Math.round(stats.pendingHours)}h`, 
      icon: Clock, 
      color: "text-orange-600" 
    },
    { 
      title: "Total Rosters", 
      value: stats.totalRosters.toString(), 
      icon: Calendar, 
      color: "text-purple-500" 
    },
    { 
      title: "Total Revenue", 
      value: `$${stats.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-emerald-600" 
    },
    { 
      title: "Net Cash Flow", 
      value: `$${stats.netCashFlow.toLocaleString()}`, 
      icon: TrendingUp, 
      color: stats.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
    },
    { 
      title: "Total Payroll", 
      value: `$${stats.totalPayroll.toLocaleString()}`, 
      icon: Banknote, 
      color: "text-violet-600" 
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
    },
    { 
      title: "Unread Notifications", 
      value: stats.unreadNotifications.toString(), 
      icon: Bell, 
      color: "text-red-500" 
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600">Comprehensive business management overview</p>
        </div>
        
        {/* Mobile-friendly Date Range Selector */}
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:gap-4 md:space-y-0">
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
            <Calendar className="h-4 w-4 text-gray-500 hidden md:block" />
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
      
      {/* Mobile-friendly Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-lg md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile-friendly Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
              Hours Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Briefcase className="h-4 w-4 md:h-5 md:w-5" />
              Project Hours Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4 max-h-64 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs md:text-sm block">{activity.description}</span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
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
              {recentActivities.length === 0 && (
                <p className="text-xs md:text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Comprehensive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Employee Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10}
                  tick={{ fontSize: 8 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="hours" fill="#8884d8" name="Hours" />
                <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#ff7300" name="Amount ($)" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
              Monthly Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis yAxisId="left" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" fontSize={10} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="hours" fill="#8884d8" stroke="#8884d8" fillOpacity={0.6} name="Hours" />
                <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={clientData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, value }) => `${category}: $${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {clientData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-4 w-4 md:h-5 md:w-5" />
              Payroll Summary Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Status</TableHead>
                    <TableHead className="text-xs md:text-sm">Gross Pay</TableHead>
                    <TableHead className="text-xs md:text-sm">Net Pay</TableHead>
                    <TableHead className="text-xs md:text-sm">Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.slice(0, 10).map((payroll: any, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                          payroll.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payroll.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">${payroll.gross_pay?.toLocaleString()}</TableCell>
                      <TableCell className="text-xs md:text-sm">${payroll.net_pay?.toLocaleString()}</TableCell>
                      <TableCell className="text-xs md:text-sm">{payroll.pay_period_start} to {payroll.pay_period_end}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {payrollData.length === 0 && (
                <p className="text-xs md:text-sm text-gray-500 text-center py-4">No payroll data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Users className="h-4 w-4 md:h-5 md:w-5" />
            Detailed Employee Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Employee</TableHead>
                  <TableHead className="text-xs md:text-sm">Total Hours</TableHead>
                  <TableHead className="text-xs md:text-sm">Total Amount</TableHead>
                  <TableHead className="text-xs md:text-sm">Average Hourly Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeData.map((employee: any, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-xs md:text-sm">{employee.name}</TableCell>
                    <TableCell className="text-xs md:text-sm">{employee.hours.toFixed(1)}h</TableCell>
                    <TableCell className="text-xs md:text-sm">${employee.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs md:text-sm">${employee.hours > 0 ? (employee.amount / employee.hours).toFixed(2) : '0.00'}/hr</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {employeeData.length === 0 && (
              <p className="text-xs md:text-sm text-gray-500 text-center py-4">No employee data available for selected period</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
