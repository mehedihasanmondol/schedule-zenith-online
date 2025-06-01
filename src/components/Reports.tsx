
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, TrendingUp, Users, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour, Profile, Client, Project, BankTransaction } from "@/types/database";

export const Reports = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  const fetchAllData = async () => {
    try {
      const dateRange = getDateRange();
      
      // Fetch working hours with profile, client, and project details
      const { data: hoursData, error: hoursError } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey (id, full_name, role),
          clients!working_hours_client_id_fkey (id, company),
          projects!working_hours_project_id_fkey (id, name)
        `)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      if (hoursError) throw hoursError;
      
      // Handle the data safely with proper type checking
      const workingHoursData = (hoursData || []).map(wh => ({
        ...wh,
        profiles: Array.isArray(wh.profiles) ? wh.profiles[0] : wh.profiles,
        clients: Array.isArray(wh.clients) ? wh.clients[0] : wh.clients,
        projects: Array.isArray(wh.projects) ? wh.projects[0] : wh.projects
      }));
      
      setWorkingHours(workingHoursData as WorkingHour[]);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      if (profilesError) throw profilesError;
      setProfiles(profilesData as Profile[]);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) throw clientsError;
      setClients(clientsData as Client[]);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) throw projectsError;
      setProjects(projectsData as Project[]);

      // Fetch bank transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('bank_transactions')
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData as BankTransaction[]);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = workingHours.reduce((sum, wh) => sum + wh.total_hours, 0);
  const activeProfiles = profiles.filter(p => p.is_active).length;
  const totalPayroll = workingHours.reduce((sum, wh) => {
    const hourlyRate = wh.profiles?.hourly_rate || 25;
    return sum + (wh.total_hours * hourlyRate);
  }, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const totalRevenue = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group hours by profile
  const hoursByProfile = profiles.map(profile => {
    const profileHours = workingHours.filter(wh => wh.profile_id === profile.id);
    const totalHours = profileHours.reduce((sum, wh) => sum + wh.total_hours, 0);
    const maxHours = period === 'week' ? 40 : period === 'month' ? 160 : 320;
    const percentage = Math.min((totalHours / maxHours) * 100, 100);
    
    return {
      name: profile.full_name || 'Unnamed User',
      hours: totalHours,
      percentage
    };
  }).sort((a, b) => b.hours - a.hours).slice(0, 5);

  // Group hours by project
  const hoursByProject = projects.map(project => {
    const projectHours = workingHours.filter(wh => wh.project_id === project.id);
    const totalHours = projectHours.reduce((sum, wh) => sum + wh.total_hours, 0);
    const maxHours = 200;
    const percentage = Math.min((totalHours / maxHours) * 100, 100);
    
    return {
      name: project.name,
      hours: totalHours,
      percentage
    };
  }).filter(p => p.hours > 0).sort((a, b) => b.hours - a.hours).slice(0, 5);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">For selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Profiles</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeProfiles}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Payroll</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">For this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Projects Active</CardTitle>
            <FileText className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue vs Expenses</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${(totalRevenue - totalExpenses).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Net for period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hours by Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hoursByProfile.map((profile) => (
                <div key={profile.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{profile.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${profile.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{profile.hours.toFixed(1)}h</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hoursByProject.map((project) => (
                <div key={project.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{project.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${project.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{project.hours.toFixed(1)}h</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Profile</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hourly Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total Earned</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Projects Worked</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => {
                  const profileHours = workingHours.filter(wh => wh.profile_id === profile.id);
                  const totalHours = profileHours.reduce((sum, wh) => sum + wh.total_hours, 0);
                  const hourlyRate = profile.hourly_rate || 25;
                  const totalEarned = totalHours * hourlyRate;
                  const uniqueProjects = [...new Set(profileHours.map(wh => wh.project_id))];
                  
                  return (
                    <tr key={profile.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">{profile.full_name || 'Unnamed User'}</td>
                      <td className="py-3 px-4 text-gray-600">{profile.role}</td>
                      <td className="py-3 px-4 text-gray-600">{totalHours.toFixed(1)}h</td>
                      <td className="py-3 px-4 text-gray-600">${hourlyRate}/hr</td>
                      <td className="py-3 px-4 font-medium text-gray-900">${totalEarned.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-600">{uniqueProjects.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
