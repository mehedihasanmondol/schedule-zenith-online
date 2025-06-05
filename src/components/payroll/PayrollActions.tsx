
import { EnhancedActionDropdown } from "@/components/ui/enhanced-action-dropdown";
import { Edit, Trash2, Eye } from "lucide-react";

interface Payroll {
  id: string;
  status: string;
}

interface PayrollActionsProps {
  payroll: Payroll;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const PayrollActions = ({
  payroll,
  onEdit,
  onDelete,
  onView
}: PayrollActionsProps) => {
  const items = [
    {
      label: "View Details",
      onClick: () => onView(payroll.id),
      icon: <Eye className="h-4 w-4" />
    }
  ];

  // Add edit and delete options if not paid
  if (payroll.status !== 'paid') {
    items.unshift(
      {
        label: "Edit",
        onClick: () => onEdit(payroll.id),
        icon: <Edit className="h-4 w-4" />
      },
      {
        label: "Delete",
        onClick: () => onDelete(payroll.id),
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const
      }
    );
  }

  return <EnhancedActionDropdown items={items} />;
};
