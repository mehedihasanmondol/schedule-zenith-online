
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
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Salary Reports & Analytics
            </CardTitle>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Month</SelectItem>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportReport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Net Pay</div>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">${summaryStats.totalNetPay.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Hours</div>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalHours.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Employees</div>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{summaryStats.employeeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Avg Hourly Rate</div>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">${summaryStats.avgHourlyRate.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Deductions</div>
              <DollarSign className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">${summaryStats.totalDeductions.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Gross Pay</div>
              <DollarSign className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">${summaryStats.totalGrossPay.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Payroll Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Net Pay']} />
                <Line type="monotone" dataKey="totalNetPay" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pay Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, percent }) => `${role} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalPay"
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
            <CardTitle>Top Earners</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topEarners} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Total Pay']} />
                <Bar dataKey="totalPay" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Hours Worked</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value.toFixed(1)} hrs`, 'Hours']} />
                <Bar dataKey="totalHours" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Role Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Role</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Count</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Total Pay</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Avg Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {roleData.map((role) => (
                    <tr key={role.role} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium">{role.role}</td>
                      <td className="py-2 px-3 text-right">{role.count}</td>
                      <td className="py-2 px-3 text-right">${role.totalPay.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">${role.avgPay.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Earners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Earners Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Employee</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Hours</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Rate</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Total Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {topEarners.slice(0, 8).map((earner, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium">{earner.name}</td>
                      <td className="py-2 px-3 text-right">{earner.totalHours.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right">${earner.avgHourlyRate.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold">${earner.totalPay.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
