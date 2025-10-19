import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  FileText,
  Activity,
  Eye,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingReports: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user?.is_staff) {
      navigate('/');
      return;
    }

    // TODO: Load actual stats from API
    setStats({
      totalUsers: 1247,
      totalReports: 23,
      totalTransactions: 456,
      totalRevenue: 12450,
      activeUsers: 892,
      pendingReports: 8,
    });
  }, [isAuthenticated, user, navigate]);

  if (!user?.is_staff) {
    return null;
  }

  const dashboardCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: `${stats.activeUsers} active users`,
      icon: Users,
      gradient: 'from-primary via-primary-glow to-primary',
      link: '/admin/users',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      description: `${stats.totalReports} total reports`,
      icon: AlertCircle,
      gradient: 'from-destructive via-destructive/80 to-destructive',
      link: '/reports',
    },
    {
      title: 'Transactions',
      value: stats.totalTransactions.toLocaleString(),
      description: 'This month',
      icon: ShoppingBag,
      gradient: 'from-accent via-accent/80 to-accent',
      link: '/admin/transactions',
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      description: '+12.5% from last month',
      icon: DollarSign,
      gradient: 'from-gold via-gold/80 to-gold',
      link: '/admin/analytics',
    },
  ];

  const quickActions = [
    { label: 'View All Users', icon: Users, link: '/admin/users' },
    { label: 'View Reports', icon: Shield, link: '/reports' },
    { label: 'Transaction History', icon: FileText, link: '/admin/transactions' },
    { label: 'Analytics', icon: TrendingUp, link: '/admin/analytics' },
    { label: 'Activity Log', icon: Activity, link: '/admin/activity' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-lg glow-effect">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome back, {user?.username}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card) => (
            <Link key={card.title} to={card.link}>
              <Card className="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-neon cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{card.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {card.description}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.link}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-4 border-primary/20 hover:border-primary/40 hover:bg-primary/5 group"
                  >
                    <action.icon className="h-5 w-5 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform">
                      {action.label}
                    </span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-primary/10 last:border-0">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New user registration</p>
                      <p className="text-xs text-muted-foreground">{i} hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">User Engagement</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent w-[78%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Revenue Growth</span>
                    <span className="font-medium">64%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gold to-secondary w-[64%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Platform Health</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-primary-glow w-[92%]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
