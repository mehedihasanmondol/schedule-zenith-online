
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, DollarSign, BarChart3, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const LandingPage = () => {
  const features = [
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Track working hours with precision and ease. Monitor project progress in real-time."
    },
    {
      icon: Users,
      title: "Team Management", 
      description: "Manage your team profiles, roles, and permissions from one central dashboard."
    },
    {
      icon: DollarSign,
      title: "Payroll Management",
      description: "Automated payroll calculations based on tracked hours and configurable rates."
    },
    {
      icon: BarChart3,
      title: "Advanced Reports",
      description: "Generate comprehensive reports for better business insights and decision making."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control and data protection."
    },
    {
      icon: Zap,
      title: "Easy Integration",
      description: "Quick setup and seamless integration with your existing business workflows."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Schedule & Payroll Manager</h1>
            </div>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your
            <span className="text-blue-600 block">Workforce Management</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The complete solution for tracking time, managing schedules, and processing payroll. 
            Built for modern businesses that value efficiency and accuracy.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Team
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From time tracking to payroll processing, our comprehensive platform 
              has all the tools you need to run your business efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Workforce Management?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust our platform to manage their teams efficiently.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-400" />
            <span className="ml-2 text-lg font-semibold">Schedule & Payroll Manager</span>
          </div>
          <p className="text-center text-gray-400 mt-4">
            © 2024 Schedule & Payroll Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
