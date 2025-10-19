import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, ShoppingBag, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: number;
  buyer: string;
  seller: string;
  artwork_title: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded';
  date: string;
  payment_method: string;
}

export default function AdminTransactions() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    loadTransactions();
  }, [isAuthenticated, user, navigate]);

  const loadTransactions = async () => {
    try {
      // TODO: Replace with actual API call
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          buyer: 'johndoe',
          seller: 'janeart',
          artwork_title: 'Abstract Dreams',
          amount: 299,
          status: 'completed',
          date: '2024-03-15T10:30:00',
          payment_method: 'Credit Card',
        },
        {
          id: 2,
          buyer: 'artlover',
          seller: 'modernist',
          artwork_title: 'Neon Nights',
          amount: 450,
          status: 'pending',
          date: '2024-03-14T15:45:00',
          payment_method: 'PayPal',
        },
        {
          id: 3,
          buyer: 'collector',
          seller: 'janeart',
          artwork_title: 'Digital Sunset',
          amount: 150,
          status: 'completed',
          date: '2024-03-13T09:20:00',
          payment_method: 'Credit Card',
        },
        {
          id: 4,
          buyer: 'gallery',
          seller: 'contemporary',
          artwork_title: 'Urban Flow',
          amount: 890,
          status: 'refunded',
          date: '2024-03-12T14:10:00',
          payment_method: 'Wire Transfer',
        },
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

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
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Transaction History</h1>
              <p className="text-muted-foreground">Monitor all platform transactions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {transactions.filter((t) => t.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Amount
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.filter((t) => t.status === 'pending').length} pending transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="border-primary/20">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-primary">Loading transactions...</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-primary/20">
                      <TableHead>ID</TableHead>
                      <TableHead>Artwork</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                      >
                        <TableCell className="font-medium">#{transaction.id}</TableCell>
                        <TableCell className="font-medium">{transaction.artwork_title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {transaction.buyer}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {transaction.seller}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-gold">
                          ${transaction.amount}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {transaction.payment_method}
                        </TableCell>
                        <TableCell>
                          {transaction.status === 'completed' && (
                            <Badge className="bg-accent/20 text-accent border-accent/40">
                              Completed
                            </Badge>
                          )}
                          {transaction.status === 'pending' && (
                            <Badge className="bg-gold/20 text-gold border-gold/40">
                              Pending
                            </Badge>
                          )}
                          {transaction.status === 'refunded' && (
                            <Badge variant="destructive" className="bg-destructive/20">
                              Refunded
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
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
