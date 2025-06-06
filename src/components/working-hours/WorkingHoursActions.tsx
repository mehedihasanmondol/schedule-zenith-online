
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { Edit, Trash2, Eye } from "lucide-react";

interface WorkingHour {
  id: string;
  status: string;
}

interface WorkingHoursActionsProps {
  workingHour: WorkingHour;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const WorkingHoursActions = ({
  workingHour,
  onEdit,
  onDelete,
  onView
}: WorkingHoursActionsProps) => {
  const canEditDelete = workingHour.status !== 'paid';

  const items = [
    {
      label: "View Details",
      onClick: () => onView(workingHour.id),
      icon: <Eye className="h-4 w-4" />
    }
  ];

  if (canEditDelete) {
    items.unshift(
      {
        label: "Edit",
        onClick: () => onEdit(workingHour.id),
        icon: <Edit className="h-4 w-4" />
      },
      {
        label: "Delete",
        onClick: () => onDelete(workingHour.id),
        icon: <Trash2 className="h-4 w-4" />,
        destructive: true
      }
    );
  }

  return <ActionDropdown items={items} />;
};
