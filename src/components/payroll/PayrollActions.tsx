
import { ActionDropdown, ActionItem } from "@/components/ui/action-dropdown";
import { Edit, Trash2, Eye } from "lucide-react";
import type { Payroll as PayrollType } from "@/types/database";

interface PayrollActionsProps {
  payroll: PayrollType;
  onEdit: (payroll: PayrollType) => void;
  onDelete: (id: string) => void;
  onView: (payroll: PayrollType) => void;
}

export const PayrollActions = ({ payroll, onEdit, onDelete, onView }: PayrollActionsProps) => {
  const canEditDelete = payroll.status !== 'paid';

  const items: ActionItem[] = [
    {
      label: "View Details",
      onClick: () => onView(payroll),
      icon: <Eye className="h-4 w-4" />
    }
  ];

  if (canEditDelete) {
    items.unshift(
      {
        label: "Edit",
        onClick: () => onEdit(payroll),
        icon: <Edit className="h-4 w-4" />
      },
      {
        label: "Delete",
        onClick: () => onDelete(payroll.id),
        icon: <Trash2 className="h-4 w-4" />,
        destructive: true
      }
    );
  }

  return <ActionDropdown items={items} />;
};
