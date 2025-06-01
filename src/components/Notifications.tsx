
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Clock, Calendar, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: 'schedule_reminder' | 'payment_due' | 'schedule_change' | 'roster_confirmation';
  title: string;
  message: string;
  employee_id?: string;
  read: boolean;
  created_at: string;
  action_required: boolean;
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would fetch from a notifications table
    // For now, we'll simulate some notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'schedule_reminder',
        title: 'Upcoming Shift Reminder',
        message: 'You have a shift scheduled for tomorrow at 9:00 AM with ABC Corp',
        read: false,
        created_at: new Date().toISOString(),
        action_required: true
      },
      {
        id: '2',
        type: 'payment_due',
        title: 'Payment Ready',
        message: 'Your payment for last week ($1,200) is ready for processing',
        read: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        action_required: false
      },
      {
        id: '3',
        type: 'roster_confirmation',
        title: 'Confirm Schedule',
        message: 'Please confirm your availability for next week\'s roster',
        read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        action_required: true
      }
    ];
    
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
    toast({ title: "Notification marked as read" });
  };

  const confirmAction = (id: string) => {
    toast({ title: "Action confirmed", description: "Response recorded successfully" });
    markAsRead(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'schedule_reminder': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'payment_due': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'schedule_change': return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'roster_confirmation': return <Users className="h-5 w-5 text-purple-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">No notifications at this time</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={`transition-all ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()} at{' '}
                        {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {notification.action_required && !notification.read && (
                      <Button size="sm" onClick={() => confirmAction(notification.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {!notification.read && (
                      <Button variant="outline" size="sm" onClick={() => markAsRead(notification.id)}>
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
