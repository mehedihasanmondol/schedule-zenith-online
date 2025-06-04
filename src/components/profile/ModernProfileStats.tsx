
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Building2, Clock, TrendingUp, Award } from "lucide-react";
import { Profile } from "@/types/database";

interface ModernProfileStatsProps {
  profiles: Profile[];
}

export const ModernProfileStats = ({ profiles }: ModernProfileStatsProps) => {
  const activeProfiles = profiles.filter(p => p.is_active).length;
  const employeeProfiles = profiles.filter(p => p.role === 'employee').length;
  const avgHourlyRate = profiles.filter(p => p.hourly_rate).reduce((sum, p) => sum + (p.hourly_rate || 0), 0) / profiles.filter(p => p.hourly_rate).length || 0;
  const recentProfiles = profiles.filter(p => {
    const createdDate = new Date(p.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate >= weekAgo;
  }).length;

  const stats = [
    {
      title: "Total Profiles",
      value: profiles.length,
      icon: Users,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      change: "+12%",
      changeColor: "text-green-600"
    },
    {
      title: "Active Members",
      value: activeProfiles,
      icon: UserCheck,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      change: "+8%",
      changeColor: "text-green-600"
    },
    {
      title: "Employees",
      value: employeeProfiles,
      icon: Building2,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      change: "+5%",
      changeColor: "text-green-600"
    },
    {
      title: "Avg. Rate",
      value: `$${avgHourlyRate.toFixed(0)}`,
      icon: TrendingUp,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      change: "+3%",
      changeColor: "text-green-600"
    },
    {
      title: "New This Week",
      value: recentProfiles,
      icon: Award,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      change: "New",
      changeColor: "text-blue-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.color} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium ${stat.changeColor} bg-gray-50 px-2 py-1 rounded-full`}>
                    {stat.change}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </div>
              <div className={`h-1 ${stat.color}`}></div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
