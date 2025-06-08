
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Calendar, Filter } from "lucide-react";
import { Profile, Client, Project } from "@/types/database";

interface WorkingHoursFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  profileFilter: string;
  setProfileFilter: (profileId: string) => void;
  clientFilter: string;
  setClientFilter: (clientId: string) => void;
  projectFilter: string;
  setProjectFilter: (projectId: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  dateShortcut: string;
  setDateShortcut: (shortcut: string) => void;
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
}

export const WorkingHoursFilter = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  profileFilter,
  setProfileFilter,
  clientFilter,
  setClientFilter,
  projectFilter,
  setProjectFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dateShortcut,
  setDateShortcut,
  profiles,
  clients,
  projects
}: WorkingHoursFilterProps) => {
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
    <div className="flex flex-wrap items-center gap-4 mb-6">
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
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 w-10 p-0">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filters</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Profile</label>
                  <Select value={profileFilter} onValueChange={setProfileFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Profiles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profiles</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Client</label>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
