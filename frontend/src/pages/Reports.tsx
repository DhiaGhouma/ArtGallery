import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Report } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TakeActionDialog } from '@/components/TakeActionDialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const { user, isAuthenticated } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // if (!isAuthenticated) {
    //   navigate('/login');
    //   return;
    // }

    // if (!isAuthenticated) {
    //   toast({
    //     title: 'Access Denied',
    //     description: 'You do not have permission to view this page.',
    //     variant: 'destructive',
    //   });
    //   navigate('/');
    //   return;
    // }

    loadReports();
  }, [isAuthenticated, user, navigate]);

  const loadReports = async () => {
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeAction = (report: Report) => {
    setSelectedReport(report);
    setActionDialogOpen(true);
  };

  const handleActionComplete = () => {
    loadReports();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Reports Management
              </h1>
              <p className="text-muted-foreground">Review and take action on community reports</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-primary/20 rounded-lg p-6 hover:shadow-neon transition-all duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{reports.filter(r => !r.is_resolved).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg p-6 hover:shadow-neon transition-all duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.is_resolved).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg p-6 hover:shadow-neon transition-all duration-300">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-card border border-primary/20 rounded-lg overflow-hidden shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-glow-pulse text-primary">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-4 opacity-50" />
              <p>No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-primary/20">
                    <TableHead>Reporter</TableHead>
                    <TableHead>Artwork</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow 
                      key={report.id} 
                      className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                    >
                      <TableCell className="font-medium">{report.reporter.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img 
                            src={report.artwork.image} 
                            alt={report.artwork.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <span className="truncate max-w-[150px]">{report.artwork.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.comment ? (
                          <span className="text-sm italic truncate max-w-[200px] block">
                            "{report.comment.text}"
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{report.reason}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {report.is_resolved ? (
                          <Badge className="bg-primary/20 text-primary border-primary/40">
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/40">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleTakeAction(report)}
                          disabled={report.is_resolved}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Take Action
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <TakeActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        report={selectedReport}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
