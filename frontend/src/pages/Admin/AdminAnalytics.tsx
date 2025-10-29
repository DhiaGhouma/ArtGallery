import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Eye, Heart, ShoppingBag, Activity } from 'lucide-react';

export default function AdminAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user?.is_staff) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  if (!user?.is_staff) {
    return null;
  }

  const metrics = [
    { label: 'Daily Active Users', value: '892', change: '+12.5%', icon: Users, color: 'text-primary' },
    { label: 'Page Views', value: '24.8K', change: '+8.2%', icon: Eye, color: 'text-accent' },
    { label: 'Total Likes', value: '15.2K', change: '+18.9%', icon: Heart, color: 'text-secondary' },
    { label: 'Sales', value: '$12.4K', change: '+23.1%', icon: ShoppingBag, color: 'text-gold' },
    { label: 'Engagement Rate', value: '64%', change: '+5.4%', icon: Activity, color: 'text-primary-glow' },
    { label: 'Growth Rate', value: '32%', change: '+7.2%', icon: TrendingUp, color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-lg glow-effect">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Platform performance metrics</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-neon">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{metric.value}</div>
                <p className="text-xs text-accent">
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>Visitors in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {[45, 62, 58, 71, 85, 92, 78, 88, 95, 82, 90, 98].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-primary to-primary-glow rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Engagement by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Artwork Views', value: 78, color: 'from-primary to-primary-glow' },
                  { label: 'Comments', value: 64, color: 'from-accent to-accent/80' },
                  { label: 'Likes', value: 89, color: 'from-secondary to-secondary/80' },
                  { label: 'Shares', value: 45, color: 'from-gold to-gold/80' },
                  { label: 'Purchases', value: 56, color: 'from-primary-glow to-accent' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Top Artworks</CardTitle>
              <CardDescription>Most viewed this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Abstract Dreams', views: '12.4K', likes_count: '2.1K' },
                  { title: 'Neon Nights', views: '10.8K', likes_count: '1.9K' },
                  { title: 'Digital Sunset', views: '9.2K', likes_count: '1.7K' },
                  { title: 'Urban Flow', views: '8.5K', likes_count: '1.5K' },
                ].map((artwork, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-primary/10 last:border-0">
                    <div>
                      <p className="font-medium">{artwork.title}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {artwork.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {artwork.likes_count}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">#{i + 1}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Top Artists</CardTitle>
              <CardDescription>Most followed creators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Jane Artist', followers: '8.2K', artworks: 45 },
                  { name: 'Modern Creator', followers: '6.7K', artworks: 38 },
                  { name: 'Digital Master', followers: '5.4K', artworks: 52 },
                  { name: 'Art Visionary', followers: '4.9K', artworks: 31 },
                ].map((artist, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-primary/10 last:border-0">
                    <div>
                      <p className="font-medium">{artist.name}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {artist.followers} followers
                        </span>
                        <span>{artist.artworks} artworks</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-accent">#{i + 1}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
