
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Users, DollarSign, Building, FolderOpen, User, Mail, Phone } from "lucide-react";
import { Roster as RosterType } from "@/types/database";
import { format, parseISO } from "date-fns";

interface RosterViewDialogProps {
  roster: RosterType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RosterViewDialog = ({ roster, isOpen, onClose }: RosterViewDialogProps) => {
  if (!roster) return null;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDateRange = () => {
    const startDate = parseISO(roster.date);
    const endDate = roster.end_date ? parseISO(roster.end_date) : startDate;
    
    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      return format(startDate, 'MMMM dd, yyyy');
    }
    
    return `${format(startDate, 'MMMM dd, yyyy')} - ${format(endDate, 'MMMM dd, yyyy')}`;
  };

  const assignedProfiles = roster.roster_profiles?.length || 0;
  const expectedProfiles = roster.expected_profiles || 1;
  const progressPercentage = expectedProfiles > 0 ? (assignedProfiles / expectedProfiles) * 100 : 0;
  const estimatedValue = roster.total_hours * (roster.per_hour_rate || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Roster Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {roster.name || 'Unnamed Roster'}
                </h3>
                <div className="mt-2">
                  <Badge variant={
                    roster.status === "confirmed" ? "default" : 
                    roster.status === "pending" ? "secondary" : "outline"
                  }>
                    {roster.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Client</div>
                  <div className="text-sm text-gray-600">
                    {roster.clients?.company || 'No Client'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Project</div>
                  <div className="text-sm text-gray-600">
                    {roster.projects?.name || 'No Project'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Date Range</div>
                  <div className="text-sm text-gray-600">
                    {getDateRange()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Time</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(roster.start_time)} - {formatTime(roster.end_time)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Team Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Team Assignment</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Assignment Progress</span>
                <span className="text-gray-600">
                  {assignedProfiles}/{expectedProfiles} ({progressPercentage.toFixed(0)}%)
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>

              {/* Employee Details Section */}
              <div className="space-y-3">
                <div className="font-medium text-gray-700 text-sm">Assigned Team Members:</div>
                {roster.roster_profiles && roster.roster_profiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roster.roster_profiles.map((rp) => (
                      <div key={rp.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {rp.profiles?.full_name || 'Unknown Employee'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {rp.profiles?.role || 'N/A'}
                            </Badge>
                          </div>
                          
                          {rp.profiles?.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              <span>{rp.profiles.email}</span>
                            </div>
                          )}
                          
                          {rp.profiles?.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{rp.profiles.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Employment: {rp.profiles?.employment_type || 'N/A'}</span>
                            {rp.profiles?.hourly_rate && (
                              <span>Rate: ${rp.profiles.hourly_rate}/hr</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                    No team members assigned yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Financial Details</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-700">{roster.total_hours}h</div>
                <div className="text-xs text-gray-600">Total Hours</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-orange-700">
                  ${(roster.per_hour_rate || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Per Hour</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700">
                  ${estimatedValue.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Est. Value</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-700">
                  {assignedProfiles}/{expectedProfiles}
                </div>
                <div className="text-xs text-gray-600">Assigned</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {roster.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Notes</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {roster.notes}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
