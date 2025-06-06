
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PayrollQuickGenerate } from "./PayrollQuickGenerate";
import type { Profile, WorkingHour } from "@/types/database";

interface PayrollCreateDialogProps {
  profiles: Profile[];
  profilesWithHours: Profile[];
  workingHours: WorkingHour[];
  onRefresh: () => void;
}

export const PayrollCreateDialog = ({ 
  profiles, 
  profilesWithHours, 
  workingHours, 
  onRefresh 
}: PayrollCreateDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Payroll</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <PayrollQuickGenerate
            profiles={profiles}
            profilesWithHours={profilesWithHours}
            workingHours={workingHours}
            onRefresh={() => {
              onRefresh();
              setIsOpen(false);
            }}
            isInDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
