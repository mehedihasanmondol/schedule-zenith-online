
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Service {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: string;
  icon: LucideIcon;
}

interface ServiceCardProps {
  service: Service;
  onSelect: () => void;
}

const ServiceCard = ({ service, onSelect }: ServiceCardProps) => {
  const Icon = service.icon;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-blue-100 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-8 w-8 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
          {service.title}
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          {service.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-3">
        <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <span>⏱️</span>
            <span>{service.duration}</span>
          </span>
          <span className="text-2xl font-bold text-blue-600">
            {service.price}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          onClick={onSelect}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg"
        >
          Select & Book
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
