
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarDays, Clock, Users, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { Roster as RosterType } from "@/types/database";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import { RosterActions } from "./RosterActions";

interface EnhancedRosterCalendarViewProps {
  rosters: RosterType[];
  onEdit: (roster: RosterType) => void;
  onDelete: (id: string) => void;
  onView: (roster: RosterType) => void;
}

export const EnhancedRosterCalendarView = ({ rosters, onEdit, onDelete, onView }: EnhancedRosterCalendarViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Sunday

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(current => 
      direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1)
    );
  };

  // Filter rosters for current week
  const weekRosters = rosters.filter(roster => {
    const rosterStartDate = parseISO(roster.date);
    const rosterEndDate = roster.end_date ? parseISO(roster.end_date) : rosterStartDate;
    
    return isWithinInterval(rosterStartDate, { start: weekStart, end: weekEnd }) ||
           isWithinInterval(rosterEndDate, { start: weekStart, end: weekEnd }) ||
           (rosterStartDate <= weekStart && rosterEndDate >= weekEnd);
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDateRange = (roster: RosterType) => {
    const startDate = parseISO(roster.date);
    const endDate = roster.end_date ? parseISO(roster.end_date) : startDate;
    
    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      return format(startDate, 'MMM dd');
    }
    
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-friendly week navigation */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <h3 className="font-bold text-base sm:text-lg text-gray-900">
              Week of {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Current Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              className="flex-1 sm:flex-none"
            >
              <span className="sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile-optimized roster cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {weekRosters.map((roster) => {
            const assignedProfiles = roster.roster_profiles?.length || 0;
            const expectedProfiles = roster.expected_profiles || 1;
            const progressPercentage = expectedProfiles > 0 ? (assignedProfiles / expectedProfiles) * 100 : 0;
            const estimatedValue = roster.total_hours * (roster.per_hour_rate || 0);

            return (
              <Card key={roster.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Mobile-friendly header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight">
                          {roster.name || 'Unnamed Roster'}
                        </h4>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                            {getDateRange(roster)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <Badge variant={
                          roster.status === "confirmed" ? "default" : 
                          roster.status === "pending" ? "secondary" : "outline"
                        } className="text-xs">
                          {roster.status}
                        </Badge>
                        <RosterActions
                          roster={roster}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onView={onView}
                        />
                      </div>
                    </div>

                    {/* Project & Client */}
                    <div className="space-y-1">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {roster.projects?.name || 'No Project'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 truncate">
                        {roster.clients?.company || 'No Client'}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{formatTime(roster.start_time)} - {formatTime(roster.end_time)}</span>
                    </div>

                    {/* Team Assignment Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">Team Assignment</span>
                        <span className="text-gray-600">
                          {assignedProfiles}/{expectedProfiles}
                        </span>
                      </div>
                      <Progress 
                        value={progressPercentage} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500">
                        {progressPercentage.toFixed(0)}% staffed
                      </div>
                    </div>

                    {/* Assigned Team Members */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {roster.roster_profiles?.slice(0, 2).map((rp) => (
                          <Badge key={rp.id} variant="secondary" className="text-xs">
                            {rp.profiles?.full_name}
                          </Badge>
                        ))}
                        {(roster.roster_profiles?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(roster.roster_profiles?.length || 0) - 2} more
                          </Badge>
                        )}
                        {assignedProfiles === 0 && (
                          <span className="text-xs text-gray-500 italic">No assignments yet</span>
                        )}
                      </div>
                    </div>

                    {/* Mobile-optimized financial & stats grid */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 p-2 rounded bg-purple-50">
                            <Clock className="h-3 w-3 text-purple-600 shrink-0" />
                            <span className="font-semibold text-xs text-purple-700">
                              {roster.total_hours}h
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total Hours</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 p-2 rounded bg-blue-50">
                            <Users className="h-3 w-3 text-blue-600 shrink-0" />
                            <span className="font-semibold text-xs text-blue-700">
                              {assignedProfiles}/{expectedProfiles}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total Assigned</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 p-2 rounded bg-green-50">
                            <DollarSign className="h-3 w-3 text-green-600 shrink-0" />
                            <span className="font-semibold text-xs text-green-700">
                              ${estimatedValue.toFixed(0)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Est. Value</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 p-2 rounded bg-orange-50">
                            <Clock className="h-3 w-3 text-orange-600 shrink-0" />
                            <span className="font-semibold text-xs text-orange-700">
                              ${(roster.per_hour_rate || 0).toFixed(0)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Per Hour</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Notes if available */}
                    {roster.notes && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600 italic line-clamp-2">
                          {roster.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {weekRosters.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <CalendarDays className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium mb-2">No rosters found for this week</h3>
            <p className="text-sm">Navigate to different weeks or create new rosters</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
