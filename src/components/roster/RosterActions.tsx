
import { ActionDropdown, ActionItem } from "@/components/ui/action-dropdown";
import { Edit, Trash2, Eye } from "lucide-react";
import { Roster as RosterType } from "@/types/database";

interface RosterActionsProps {
  roster: RosterType;
  onEdit: (roster: RosterType) => void;
  onDelete: (id: string) => void;
  onView: (roster: RosterType) => void;
}

export const RosterActions = ({ roster, onEdit, onDelete, onView }: RosterActionsProps) => {
  const canEditDelete = roster.status !== 'cancelled';

  const items: ActionItem[] = [
    {
      label: "View Details",
      onClick: () => onView(roster),
      icon: <Eye className="h-4 w-4" />
    }
  ];

  if (canEditDelete) {
    items.unshift(
      {
        label: "Edit",
        onClick: () => onEdit(roster),
        icon: <Edit className="h-4 w-4" />
      },
      {
        label: "Delete",
        onClick: () => onDelete(roster.id),
        icon: <Trash2 className="h-4 w-4" />,
        destructive: true
      }
    );
  }

  return <ActionDropdown items={items} />;
};
