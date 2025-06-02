
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Clock, AlertCircle, CheckCircle2, Users, Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCreateForm } from "./notifications/NotificationCreateForm";

interface Notification {
  id: string;
  type: 'working_hours_pending' | 'roster_pending' | 'payroll_due' | 'system' | 'custom';
  title: string;
  message: string;
  data?: any;
  created_at: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  action_type: 'approve' | 'confirm' | 'grant' | 'cancel' | 'reject' | 'none';
  related_id?: string;
  is_actioned: boolean;
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [canCreateNotifications, setCanCreateNotifications] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchProfiles();
      checkNotificationPermissions();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_profile_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = data?.map(n => ({
        id: n.id,
        type: n.type as any,
        title: n.title,
        message: n.message,
        created_at: n.created_at,
        read: n.is_read,
        priority: n.priority as any,
        action_type: n.action_type as any,
        related_id: n.related_id,
        is_actioned: n.is_actioned,
        data: n.action_data
      })) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_permissions')
        .select('can_create_notifications, can_create_bulk_notifications')
        .eq('profile_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setCanCreateNotifications(data?.can_create_notifications || false);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('recipient_profile_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: "Success", description: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const executeAction = async (notification: Notification) => {
    try {
      let updateData: any = {};

      switch (notification.action_type) {
        case 'approve':
          if (notification.type === 'working_hours_pending' && notification.related_id) {
            const { error } = await supabase
              .from('working_hours')
              .update({ status: 'approved' })
              .eq('id', notification.related_id);
            if (error) throw error;
          }
          break;
        
        case 'confirm':
          if (notification.type === 'roster_pending' && notification.related_id) {
            const { error } = await supabase
              .from('rosters')
              .update({ status: 'confirmed' })
              .eq('id', notification.related_id);
            if (error) throw error;
          }
          break;
      }

      // Mark notification as actioned
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_actioned: true,
          is_read: true,
          actioned_at: new Date().toISOString(),
          read_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, is_actioned: true, read: true } 
            : n
        )
      );

      toast({ 
        title: "Success", 
        description: `Action executed successfully` 
      });
    } catch (error: any) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute action",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'working_hours_pending':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'roster_pending':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'payroll_due':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              Stay updated with system events and pending actions
              {unreadCount > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({unreadCount} unread)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canCreateNotifications && (
            <Button onClick={() => setIsCreateFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          )}
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unread</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {notifications.filter(n => !n.is_actioned && n.action_type !== 'none').length}
            </div>
            <p className="text-xs text-muted-foreground">Require action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">High priority items</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-all ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold ${
                            notification.read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            notification.read ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              notification.priority === 'high' ? 'destructive' : 
                              notification.priority === 'medium' ? 'default' : 'outline'
                            }
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!notification.is_actioned && notification.action_type !== 'none' && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => executeAction(notification)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {notification.action_type.charAt(0).toUpperCase() + notification.action_type.slice(1)}
                          </Button>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      )}

                      {!notification.read && notification.action_type === 'none' && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Read
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NotificationCreateForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        profiles={profiles}
        onSuccess={fetchNotifications}
      />
    </div>
  );
};
