
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Clock, User, Mail, Phone } from "lucide-react";
import TimeSlot from "./TimeSlot";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: string;
}

interface BookingFormProps {
  selectedService: string | null;
  services: Service[];
  onBack: () => void;
}

const BookingForm = ({ selectedService, services, onBack }: BookingFormProps) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  const { toast } = useToast();

  const service = services.find(s => s.id === selectedService);
  
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a date/time.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Booking Confirmed! 🎉",
      description: `Your ${service?.title} appointment is scheduled for ${selectedDate} at ${selectedTime}.`,
    });

    console.log("Booking submitted:", {
      service: service?.title,
      date: selectedDate,
      time: selectedTime,
      ...formData
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-xl">
      <CardHeader>
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
        </div>
        <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Book Your {service?.title}
        </CardTitle>
        <CardDescription>
          Duration: {service?.duration} • Price: {service?.price}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Select Date</span>
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="text-lg p-3 border-blue-200 focus:border-blue-400"
              required
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Select Time</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time) => (
                <TimeSlot
                  key={time}
                  time={time}
                  isSelected={selectedTime === time}
                  onSelect={() => setSelectedTime(time)}
                />
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Contact Information</span>
            </Label>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="border-blue-200 focus:border-blue-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address *</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your.email@example.com"
                className="border-blue-200 focus:border-blue-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any special requirements or questions?"
                className="border-blue-200 focus:border-blue-400 min-h-[100px]"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Confirm Booking
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
