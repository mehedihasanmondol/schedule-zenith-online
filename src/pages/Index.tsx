
import { useState } from "react";
import BookingForm from "../components/BookingForm";
import ServiceCard from "../components/ServiceCard";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";

const Index = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const services = [
    {
      id: "consultation",
      title: "30-min Consultation",
      description: "Perfect for initial discussions and planning",
      duration: "30 minutes",
      price: "$50",
      icon: Users
    },
    {
      id: "meeting",
      title: "Business Meeting",
      description: "Comprehensive business strategy session",
      duration: "60 minutes", 
      price: "$100",
      icon: Calendar
    },
    {
      id: "workshop",
      title: "Workshop Session",
      description: "Interactive learning and development",
      duration: "90 minutes",
      price: "$150", 
      icon: Clock
    }
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setShowBookingForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Online Scheduler
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-gray-600">Book your appointment today</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {!showBookingForm ? (
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-800 mb-6">
                Schedule Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  Perfect Appointment
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Choose from our range of professional services and book your ideal time slot. 
                Quick, easy, and completely online.
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={() => handleServiceSelect(service.id)}
                />
              ))}
            </div>

            {/* Features */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-blue-100">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Easy Booking</h3>
                  <p className="text-gray-600">Select your preferred date and time in seconds</p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Flexible Times</h3>
                  <p className="text-gray-600">Available slots throughout the week</p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Instant Confirmation</h3>
                  <p className="text-gray-600">Receive confirmation immediately after booking</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <BookingForm 
              selectedService={selectedService}
              services={services}
              onBack={() => setShowBookingForm(false)}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
