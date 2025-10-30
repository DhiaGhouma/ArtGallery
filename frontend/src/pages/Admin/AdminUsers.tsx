import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, UserCheck, UserX, Shield, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  artworks_count: number;
}

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

    loadUsers();
  }, [isAuthenticated, user, navigate]);

  const loadUsers = async () => {
    try {
      // TODO: Replace with actual API call
      const mockUsers: UserData[] = [
        {
          id: 1,
          username: 'johndoe',
          email: 'john@example.com',
          is_staff: false,
          is_active: true,
          date_joined: '2024-01-15',
          artworks_count: 12,
        },
        {
          id: 2,
          username: 'janeart',
          email: 'jane@example.com',
          is_staff: false,
          is_active: true,
          date_joined: '2024-02-20',
          artworks_count: 24,
        },
        {
          id: 3,
          username: 'admin',
          email: 'admin@example.com',
          is_staff: true,
          is_active: true,
          date_joined: '2023-12-01',
          artworks_count: 0,
        },
      ];
      setUsers(mockUsers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user?.is_staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 p-3 rounded-lg glow-effect">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">User Management</h1>
              <p className="text-muted-foreground">Manage all platform users</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-primary/20 focus:border-primary/40"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.is_active).length}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Staff Members
              </CardTitle>
              <Shield className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.is_staff).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-primary/20">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-primary">Loading users...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-primary/20">
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Artworks</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow
                        key={userData.id}
                        className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                      >
                        <TableCell className="font-medium">{userData.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {userData.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {userData.is_active ? (
                            <Badge className="bg-accent/20 text-accent border-accent/40">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-destructive/20">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {userData.is_staff ? (
                            <Badge className="bg-gold/20 text-gold border-gold/40">
                              <Shield className="h-3 w-3 mr-1" />
                              Staff
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-primary/40">
                              User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{userData.artworks_count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(userData.date_joined).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="border-primary/40">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
