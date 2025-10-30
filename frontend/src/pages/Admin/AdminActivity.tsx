import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, User, Upload, Trash2, Edit, Shield, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: number;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'admin';
}

export default function AdminActivity() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user?.is_staff) {
      navigate('/');
      return;
    }

    loadActivities();
  }, [isAuthenticated, user, navigate]);

  const loadActivities = async () => {
    try {
      // TODO: Replace with actual API call
      const mockActivities: ActivityLog[] = [
        {
          id: 1,
          user: 'johndoe',
          action: 'uploaded new artwork',
          target: 'Abstract Dreams',
          timestamp: '2024-03-15T10:30:00',
          type: 'create',
        },
        {
          id: 2,
          user: 'admin',
          action: 'deleted artwork',
          target: 'Spam Content',
          timestamp: '2024-03-15T10:15:00',
          type: 'admin',
        },
        {
          id: 3,
          user: 'janeart',
          action: 'updated profile',
          target: 'Profile Picture',
          timestamp: '2024-03-15T09:45:00',
          type: 'update',
        },
        {
          id: 4,
          user: 'collector',
          action: 'purchased artwork',
          target: 'Digital Sunset',
          timestamp: '2024-03-15T09:20:00',
          type: 'create',
        },
        {
          id: 5,
          user: 'moderator',
          action: 'resolved report',
          target: 'Report #42',
          timestamp: '2024-03-15T08:50:00',
          type: 'admin',
        },
      ];
      setActivities(mockActivities);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load activity logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'create':
        return Upload;
      case 'update':
        return Edit;
      case 'delete':
        return Trash2;
      case 'admin':
        return Shield;
    }
  };

  const getActivityBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'create':
        return <Badge className="bg-accent/20 text-accent border-accent/40">Create</Badge>;
      case 'update':
        return <Badge className="bg-primary/20 text-primary border-primary/40">Update</Badge>;
      case 'delete':
        return <Badge variant="destructive" className="bg-destructive/20">Delete</Badge>;
      case 'admin':
        return <Badge className="bg-gold/20 text-gold border-gold/40">Admin Action</Badge>;
    }
  };

  if (!user?.is_staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-lg glow-effect">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Activity Log</h1>
              <p className="text-muted-foreground">Monitor all platform activities</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Activities
              </CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Created
              </CardTitle>
              <Upload className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter((a) => a.type === 'create').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Updated
              </CardTitle>
              <Edit className="h-4 w-4 text-primary-glow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter((a) => a.type === 'update').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admin Actions
              </CardTitle>
              <Shield className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter((a) => a.type === 'admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Table */}
        <Card className="border-primary/20">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-primary">Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mb-4 opacity-50" />
                <p>No activities found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-primary/20">
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <TableRow
                          key={activity.id}
                          className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                        >
                          <TableCell>{getActivityBadge(activity.type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{activity.user}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              {activity.action}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {activity.target}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
