
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Building, Calendar, DollarSign, Timer } from "lucide-react";
import { WorkingHour } from "@/types/database";

interface WorkingHoursViewDialogProps {
  workingHour: WorkingHour | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkingHoursViewDialog = ({ workingHour, isOpen, onClose }: WorkingHoursViewDialogProps) => {
  if (!workingHour) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Hours Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Employee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">{workingHour.profiles?.full_name || 'N/A'}</div>
                <div className="text-sm text-gray-600">{workingHour.profiles?.role || 'N/A'}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Client & Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">{workingHour.clients?.company || 'N/A'}</div>
                <div className="text-sm text-gray-600">{workingHour.projects?.name || 'N/A'}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date & Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">{new Date(workingHour.date).toLocaleDateString()}</div>
                <Badge variant={
                  workingHour.status === "approved" ? "default" : 
                  workingHour.status === "pending" ? "secondary" : 
                  workingHour.status === "paid" ? "default" : "outline"
                }>
                  {workingHour.status}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Time Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Scheduled Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Time:</span>
                  <span className="font-medium">{workingHour.start_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Time:</span>
                  <span className="font-medium">{workingHour.end_time}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium text-blue-600">{workingHour.total_hours}h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Actual Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sign In:</span>
                  <span className="font-medium">{workingHour.sign_in_time || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sign Out:</span>
                  <span className="font-medium">{workingHour.sign_out_time || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Actual Hours:</span>
                  <span className="font-medium text-green-600">{workingHour.actual_hours || workingHour.total_hours}h</span>
                </div>
                {(workingHour.overtime_hours || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime:</span>
                    <span className="font-medium text-orange-600">{workingHour.overtime_hours}h</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">${workingHour.hourly_rate || 0}</div>
                  <div className="text-sm text-gray-600">Hourly Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{workingHour.actual_hours || workingHour.total_hours}h</div>
                  <div className="text-sm text-gray-600">Billable Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">${(workingHour.payable_amount || 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {workingHour.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{workingHour.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
