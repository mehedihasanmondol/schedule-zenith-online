
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { Edit, Trash2, Eye } from "lucide-react";

interface Roster {
  id: string;
  status: string;
}

interface RosterActionsProps {
  roster: Roster;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const RosterActions = ({
  roster,
  onEdit,
  onDelete,
  onView
}: RosterActionsProps) => {
  const items = [
    {
      label: "View Details",
      onClick: () => onView(roster.id),
      icon: <Eye className="h-4 w-4" />
    }
  ];

  // Add edit and delete options if not locked or paid
  if (roster.status !== 'paid') {
    items.unshift(
      {
        label: "Edit",
        onClick: () => onEdit(roster.id),
        icon: <Edit className="h-4 w-4" />
      },
      {
        label: "Delete",
        onClick: () => onDelete(roster.id),
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const
      }
    );
  }

  return <ActionDropdown items={items} />;
};
