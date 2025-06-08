
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Users, Calendar, Download, Filter } from "lucide-react";
import { Payroll, WorkingHour, BankTransaction, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";

interface SalaryReportsProps {
  payrolls: Payroll[];
  workingHours: WorkingHour[];
  bankTransactions: BankTransaction[];
  profiles: Profile[];
}

export const SalaryReports = ({ payrolls, workingHours, bankTransactions, profiles }: SalaryReportsProps) => {
  const [timeRange, setTimeRange] = useState("3months");
  const [selectedMetric, setSelectedMetric] = useState("netPay");

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let months = 3;
    
    switch (timeRange) {
      case "1month": months = 1; break;
      case "6months": months = 6; break;
      case "1year": months = 12; break;
      default: months = 3;
    }
    
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // Filter data by date range
  const filteredPayrolls = payrolls.filter(p => {
    const payrollDate = new Date(p.pay_period_end);
    return payrollDate >= startDate && payrollDate <= endDate;
  });

  // Monthly payroll trends
  const monthlyData = useMemo(() => {
    const monthlyMap = new Map();
    
    filteredPayrolls.forEach(payroll => {
      const month = new Date(payroll.pay_period_end).toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          month,
          totalNetPay: 0,
          totalGrossPay: 0,
          totalHours: 0,
          employeeCount: 0
        });
      }
      
      const data = monthlyMap.get(month);
      data.totalNetPay += payroll.net_pay;
      data.totalGrossPay += payroll.gross_pay;
      data.totalHours += payroll.total_hours;
      data.employeeCount += 1;
    });
    
    return Array.from(monthlyMap.values()).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [filteredPayrolls]);

  // Department/Role breakdown
  const roleData = useMemo(() => {
    const roleMap = new Map();
    
    filteredPayrolls.forEach(payroll => {
      const role = payroll.profiles?.role || 'Unknown';
      
      if (!roleMap.has(role)) {
        roleMap.set(role, {
          role,
          totalPay: 0,
          count: 0,
          avgPay: 0
        });
      }
      
      const data = roleMap.get(role);
      data.totalPay += payroll.net_pay;
      data.count += 1;
      data.avgPay = data.totalPay / data.count;
    });
    
    return Array.from(roleMap.values());
  }, [filteredPayrolls]);

  // Top earners
  const topEarners = useMemo(() => {
    const earnerMap = new Map();
    
    filteredPayrolls.forEach(payroll => {
      const profileId = payroll.profile_id;
      const name = payroll.profiles?.full_name || 'Unknown';
      
      if (!earnerMap.has(profileId)) {
        earnerMap.set(profileId, {
          name,
          totalPay: 0,
          totalHours: 0,
          avgHourlyRate: payroll.hourly_rate
        });
      }
      
      const data = earnerMap.get(profileId);
      data.totalPay += payroll.net_pay;
      data.totalHours += payroll.total_hours;
    });
    
    return Array.from(earnerMap.values())
      .sort((a, b) => b.totalPay - a.totalPay)
      .slice(0, 10);
  }, [filteredPayrolls]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalNetPay = filteredPayrolls.reduce((sum, p) => sum + p.net_pay, 0);
    const totalGrossPay = filteredPayrolls.reduce((sum, p) => sum + p.gross_pay, 0);
    const totalHours = filteredPayrolls.reduce((sum, p) => sum + p.total_hours, 0);
    const avgHourlyRate = filteredPayrolls.length > 0 
      ? filteredPayrolls.reduce((sum, p) => sum + p.hourly_rate, 0) / filteredPayrolls.length 
      : 0;
    
    return {
      totalNetPay,
      totalGrossPay,
      totalHours,
      avgHourlyRate,
      employeeCount: new Set(filteredPayrolls.map(p => p.profile_id)).size,
      totalDeductions: totalGrossPay - totalNetPay
    };
  }, [filteredPayrolls]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exportReport = () => {
    const reportData = {
      summary: summaryStats,
      monthlyTrends: monthlyData,
      roleBreakdown: roleData,
      topEarners: topEarners,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary-report-${timeRange}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-friendly Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-lg sm:text-xl">Reports & Analytics</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportReport} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-1" />
                <span className="sm:hidden">Export</span>
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mobile-optimized Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600">Net Pay</div>
              <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">${summaryStats.totalNetPay.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600">Hours</div>
              <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{summaryStats.totalHours.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600">Employees</div>
              <Users className="h-4 w-4 text-purple-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{summaryStats.employeeCount}</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600">Avg Rate</div>
              <DollarSign className="h-4 w-4 text-orange-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">${summaryStats.avgHourlyRate.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600">Deductions</div>
              <DollarSign className="h-4 w-4 text-red-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">${summaryStats.totalDeductions.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600">Gross Pay</div>
              <DollarSign className="h-4 w-4 text-indigo-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">${summaryStats.totalGrossPay.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-friendly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Payroll Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Net Pay']} />
                <Line type="monotone" dataKey="totalNetPay" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pay Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, percent }) => `${role} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="totalPay"
                  fontSize={10}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Total Pay']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Earners */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Earners</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topEarners} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" width={60} fontSize={10} />
                <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Total Pay']} />
                <Bar dataKey="totalPay" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Hours Worked</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: any) => [`${value.toFixed(1)} hrs`, 'Hours']} />
                <Bar dataKey="totalHours" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-friendly Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Role Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-sm">Role</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">Count</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">Total Pay</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">Avg Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {roleData.map((role) => (
                    <tr key={role.role} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-sm">{role.role}</td>
                      <td className="py-2 px-3 text-right text-sm">{role.count}</td>
                      <td className="py-2 px-3 text-right text-sm">${role.totalPay.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-sm">${role.avgPay.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile card view */}
            <div className="sm:hidden space-y-3">
              {roleData.map((role) => (
                <div key={role.role} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-semibold text-gray-900 mb-2">{role.role}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Count:</span>
                      <div className="font-medium">{role.count}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <div className="font-medium">${role.totalPay.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Average:</span>
                      <div className="font-medium">${role.avgPay.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Earners Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Earners Details</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 text-sm">Employee</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">Hours</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">Rate</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">Total Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {topEarners.slice(0, 8).map((earner, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-sm">{earner.name}</td>
                      <td className="py-2 px-3 text-right text-sm">{earner.totalHours.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right text-sm">${earner.avgHourlyRate.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-sm">${earner.totalPay.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile card view */}
            <div className="sm:hidden space-y-3">
              {topEarners.slice(0, 6).map((earner, index) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-semibold text-gray-900 mb-2">{earner.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Hours:</span>
                      <div className="font-medium">{earner.totalHours.toFixed(1)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate:</span>
                      <div className="font-medium">${earner.avgHourlyRate.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <div className="font-bold text-green-600">${earner.totalPay.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
