
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Plus } from "lucide-react";
import type { Payroll as PayrollType } from "@/types/database";

interface PayrollListWithFiltersProps {
  payrolls: PayrollType[];
  onViewPayroll: (payroll: PayrollType) => void;
  onMarkAsPaid: (payroll: PayrollType) => void;
  onApprove: (id: string) => void;
  onCreatePayroll: () => void;
  loading: boolean;
}

export const PayrollListWithFilters = ({ 
  payrolls, 
  onViewPayroll, 
  onMarkAsPaid, 
  onApprove,
  onCreatePayroll,
  loading 
}: PayrollListWithFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateShortcut, setDateShortcut] = useState("current-week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = payroll.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payroll.status === statusFilter;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const payrollStart = new Date(payroll.pay_period_start);
      const payrollEnd = new Date(payroll.pay_period_end);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      matchesDate = (payrollStart >= filterStart && payrollStart <= filterEnd) ||
                   (payrollEnd >= filterStart && payrollEnd <= filterEnd) ||
                   (payrollStart <= filterStart && payrollEnd >= filterEnd);
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payroll Records</CardTitle>
          <Button onClick={onCreatePayroll} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Payroll
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <Select value={dateShortcut} onValueChange={handleDateShortcut}>
            <SelectTrigger className="w-40">
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
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
              placeholder="End Date"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-500">Loading payroll records...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pay Period</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Net Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{payroll.profiles?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{payroll.profiles?.role || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{payroll.total_hours}</td>
                    <td className="py-3 px-4">${payroll.gross_pay.toFixed(2)}</td>
                    <td className="py-3 px-4 font-medium text-green-600">${payroll.net_pay.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        payroll.status === 'paid' ? 'default' :
                        payroll.status === 'approved' ? 'secondary' : 'outline'
                      }>
                        {payroll.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewPayroll(payroll)}
                        >
                          View Details
                        </Button>
                        {payroll.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onApprove(payroll.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {payroll.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => onMarkAsPaid(payroll)}
                          >
                            Mark as Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPayrolls.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No payroll records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
