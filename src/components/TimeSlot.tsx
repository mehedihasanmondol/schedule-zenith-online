
import { Button } from "@/components/ui/button";

interface TimeSlotProps {
  time: string;
  isSelected: boolean;
  onSelect: () => void;
}

const TimeSlot = ({ time, isSelected, onSelect }: TimeSlotProps) => {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      onClick={onSelect}
      className={`
        p-3 text-sm font-medium transition-all duration-200
        ${isSelected 
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105" 
          : "border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700"
        }
      `}
    >
      {time}
    </Button>
  );
};

export default TimeSlot;
