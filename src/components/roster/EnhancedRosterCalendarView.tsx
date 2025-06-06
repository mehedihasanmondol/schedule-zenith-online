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
      <div className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-lg text-gray-900">
              Week of {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
            >
              Current Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Roster Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weekRosters.map((roster) => {
            const assignedProfiles = roster.roster_profiles?.length || 0;
            const expectedProfiles = roster.expected_profiles || 1;
            const progressPercentage = expectedProfiles > 0 ? (assignedProfiles / expectedProfiles) * 100 : 0;
            const estimatedValue = roster.total_hours * (roster.per_hour_rate || 0);

            return (
              <Card key={roster.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-gray-900 line-clamp-2">
                          {roster.name || 'Unnamed Roster'}
                        </h4>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                            {getDateRange(roster)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          roster.status === "confirmed" ? "default" : 
                          roster.status === "pending" ? "secondary" : "outline"
                        } className="ml-2 shrink-0">
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
                      <div className="font-medium text-sm text-gray-900">
                        {roster.projects?.name || 'No Project'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {roster.clients?.company || 'No Client'}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(roster.start_time)} - {formatTime(roster.end_time)}</span>
                    </div>

                    {/* Team Assignment Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
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
                        {roster.roster_profiles?.slice(0, 3).map((rp) => (
                          <Badge key={rp.id} variant="secondary" className="text-xs">
                            {rp.profiles?.full_name}
                          </Badge>
                        ))}
                        {(roster.roster_profiles?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(roster.roster_profiles?.length || 0) - 3} more
                          </Badge>
                        )}
                        {assignedProfiles === 0 && (
                          <span className="text-xs text-gray-500 italic">No assignments yet</span>
                        )}
                      </div>
                    </div>

                    {/* Financial & Stats Grid */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold text-sm text-purple-700">
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
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-sm text-blue-700">
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
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-sm text-green-700">
                              ${estimatedValue.toFixed(2)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Est. Value</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-semibold text-sm text-orange-700">
                              ${(roster.per_hour_rate || 0).toFixed(2)}
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
          <div className="text-center py-12 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No rosters found for this week</h3>
            <p className="text-sm">Navigate to different weeks or create new rosters</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
