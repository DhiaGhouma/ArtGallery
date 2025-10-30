import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api, Report } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

interface TakeActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  onActionComplete?: () => void;
}

export const TakeActionDialog = ({
  open,
  onOpenChange,
  report,
  onActionComplete,
}: TakeActionDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'resolve' | 'delete-artwork' | 'delete-comment' | 'ban-user' | null>(null);
  const { toast } = useToast();

  if (!report) return null;

  // ✅ Résoudre l'œuvre (peut provenir du report direct ou via le commentaire)
  const art = report.artwork ?? report.comment?.artwork ?? null;

  const handleAction = async (action: 'resolve' | 'delete-artwork' | 'delete-comment' | 'ban-user') => {
    if (!report) return;

    setIsProcessing(true);
    try {
      switch (action) {
        case 'resolve': {
          await api.resolveReport(report.id);
          toast({ title: 'Report resolved', description: 'The report has been marked as resolved.' });
          break;
        }

        case 'delete-artwork': {
          if (!art) {
            toast({ title: 'No artwork', description: 'This report is not linked to an artwork.', variant: 'destructive' });
            break;
          }
          await api.deleteArtwork(art.id);
          await api.resolveReport(report.id);
          toast({ title: 'Artwork deleted', description: 'The artwork has been removed and report resolved.' });
          break;
        }

        case 'delete-comment': {
  if (!report.comment) {
    toast({ title: 'No comment', description: 'This report does not reference a comment.', variant: 'destructive' });
    break;
  }
  // ✅ resolve first
  await api.resolveReport(report.id);
  await api.deleteComment(report.comment.id);
  toast({ title: 'Comment deleted', description: 'The comment has been removed and report resolved.' });
  break;
}


        case 'ban-user': {
          if (!art) {
            toast({ title: 'No artwork', description: 'Cannot ban: report has no artwork/artist context.', variant: 'destructive' });
            break;
          }

          // Essayer d’utiliser l’artiste s’il est déjà attaché à l’œuvre
          let artistId = (art as any)?.artist?.id as number | undefined;
          let artistUsername = (art as any)?.artist?.username as string | undefined;

          // Sinon, charger l’œuvre complète pour récupérer l’artiste
          if (!artistId) {
            try {
              const fullArtwork = await api.getArtwork(art.id);
              artistId = fullArtwork.artist?.id;
              artistUsername = fullArtwork.artist?.username;
            } catch (err) {
              toast({
                title: 'Error',
                description: 'Failed to fetch artwork artist. Cannot ban user.',
                variant: 'destructive',
              });
              break;
            }
          }

          if (!artistId) {
            toast({
              title: 'Error',
              description: 'Artist not found for this artwork.',
              variant: 'destructive',
            });
            break;
          }

          // D’abord résoudre le report, puis bannir
          await api.resolveReport(report.id);
          await api.banUser(artistId);

          toast({
            title: 'User banned',
            description: `The user ${artistUsername ?? ''} has been permanently banned and their artworks removed.`,
          });
          break;
        }
      }

      setConfirmAction(null);
      onOpenChange(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete action. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const ConfirmView = () => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-background to-destructive/5 border-destructive/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Confirm Action
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            {confirmAction === 'resolve' && 'Mark this report as resolved without deleting content?'}
            {confirmAction === 'delete-artwork' && 'Delete the artwork and mark report as resolved?'}
            {confirmAction === 'delete-comment' && 'Delete the comment and mark report as resolved?'}
            {confirmAction === 'ban-user' && 'Permanently ban the user who created this artwork?'}
          </p>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmAction && handleAction(confirmAction)}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (confirmAction) return <ConfirmView />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl">Take Action on Report</DialogTitle>
          <DialogDescription>Choose an action to handle this report</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Report Details */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Reporter:</span>
              <p className="text-sm">{report.reporter?.username ?? '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Artwork:</span>
              <p className="text-sm">
                {art ? (art.title ?? `#${art.id}`) : '—'}
              </p>
            </div>
            {report.comment && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Comment:</span>
                <p className="text-sm italic">“{report.comment.text ?? '—'}”</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">Reason:</span>
              <p className="text-sm">{report.reason}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Date:</span>
              <p className="text-sm">
                {report.created_at ? new Date(report.created_at).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setConfirmAction('resolve')}
              className="w-full justify-start gap-3 h-auto py-4 bg-primary/10 hover:bg-primary/20 text-foreground border border-primary/20"
              disabled={isProcessing}
            >
              <CheckCircle className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Mark as Resolved</div>
                <div className="text-xs text-muted-foreground">No action needed, dismiss the report</div>
              </div>
            </Button>

            <Button
              onClick={() => setConfirmAction('delete-artwork')}
              className="w-full justify-start gap-3 h-auto py-4 bg-destructive/10 hover:bg-destructive/20 text-foreground border border-destructive/20 disabled:opacity-50"
              disabled={isProcessing || !art}
              title={!art ? 'This report has no artwork' : undefined}
            >
              <Trash2 className="h-5 w-5 text-destructive" />
              <div className="text-left">
                <div className="font-medium">Delete Artwork</div>
                <div className="text-xs text-muted-foreground">Remove the artwork permanently</div>
              </div>
            </Button>

            <Button
              onClick={() => setConfirmAction('ban-user')}
              className="w-full justify-start gap-3 h-auto py-4 bg-destructive/10 hover:bg-destructive/20 text-foreground border border-destructive/20 disabled:opacity-50"
              disabled={isProcessing || !art}
              title={!art ? 'No artwork context to identify the artist' : undefined}
            >
              <Trash2 className="h-5 w-5 text-destructive" />
              <div className="text-left">
                <div className="font-medium">Ban User</div>
                <div className="text-xs text-muted-foreground">Permanently ban the user who created this artwork</div>
              </div>
            </Button>

            {report.comment && (
              <Button
                onClick={() => setConfirmAction('delete-comment')}
                className="w-full justify-start gap-3 h-auto py-4 bg-destructive/10 hover:bg-destructive/20 text-foreground border border-destructive/20"
                disabled={isProcessing}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
                <div className="text-left">
                  <div className="font-medium">Delete Comment</div>
                  <div className="text-xs text-muted-foreground">Remove only the comment</div>
                </div>
              </Button>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
