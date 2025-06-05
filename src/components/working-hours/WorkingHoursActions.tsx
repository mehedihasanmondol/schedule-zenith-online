
import { Button } from "@/components/ui/button";
import { EnhancedActionDropdown } from "@/components/ui/enhanced-action-dropdown";
import { Check, Edit, Trash2, Eye } from "lucide-react";

interface WorkingHour {
  id: string;
  status: string;
}

interface WorkingHoursActionsProps {
  workingHour: WorkingHour;
  onApprove: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const WorkingHoursActions = ({
  workingHour,
  onApprove,
  onEdit,
  onDelete,
  onView
}: WorkingHoursActionsProps) => {
  if (workingHour.status === 'pending') {
    return (
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onApprove(workingHour.id)}
        >
          <Check className="h-4 w-4 mr-1" />
          Mark as Approved
        </Button>
        <EnhancedActionDropdown
          items={[
            {
              label: "Edit",
              onClick: () => onEdit(workingHour.id),
              icon: <Edit className="h-4 w-4" />
            },
            {
              label: "Delete",
              onClick: () => onDelete(workingHour.id),
              icon: <Trash2 className="h-4 w-4" />,
              variant: "destructive"
            },
            {
              label: "View Details",
              onClick: () => onView(workingHour.id),
              icon: <Eye className="h-4 w-4" />
            }
          ]}
        />
      </div>
    );
  }

  // For approved/paid records, only show view details
  return (
    <EnhancedActionDropdown
      items={[
        {
          label: "View Details",
          onClick: () => onView(workingHour.id),
          icon: <Eye className="h-4 w-4" />
        }
      ]}
    />
  );
};
