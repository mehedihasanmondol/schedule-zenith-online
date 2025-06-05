
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { Edit, Trash2, Eye } from "lucide-react";

interface SalarySheet {
  id: string;
  status: string;
}

interface SalarySheetActionsProps {
  salarySheet: SalarySheet;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const SalarySheetActions = ({
  salarySheet,
  onEdit,
  onDelete,
  onView
}: SalarySheetActionsProps) => {
  const items = [
    {
      label: "View Details",
      onClick: () => onView(salarySheet.id),
      icon: <Eye className="h-4 w-4" />
    }
  ];

  // Add edit and delete options if not paid
  if (salarySheet.status !== 'paid') {
    items.unshift(
      {
        label: "Edit",
        onClick: () => onEdit(salarySheet.id),
        icon: <Edit className="h-4 w-4" />
      },
      {
        label: "Delete",
        onClick: () => onDelete(salarySheet.id),
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const
      }
    );
  }

  return <ActionDropdown items={items} />;
};
