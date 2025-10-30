import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

interface ReportArtworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artworkId?: number;
  commentId?: number;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  'Inappropriate content',
  'Copyright violation',
  'Spam',
  'Offensive or hateful content',
  'Violence or dangerous content',
  'Misleading or fraudulent',
  'Other',
];

export const ReportArtworkDialog = ({
  open,
  onOpenChange,
  artworkId,
  commentId,
  onReportSubmitted,
}: ReportArtworkDialogProps) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!artworkId) {
      toast({
        title: 'Error',
        description: 'No artwork selected',
        variant: 'destructive',
      });
      return;
    }

    if (!reason) {
      toast({
        title: 'Error',
        description: 'Please select a reason',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log({ artworkId, commentId, reason, description });
      await api.createReport({
        artwork_id: artworkId,
        comment_id: commentId,
        reason: reason,
        description: description.trim() || undefined, // Envoyer seulement si non vide
      });

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.',
      });

      // Reset form
      setReason('');
      setDescription('');
      onOpenChange(false);
      onReportSubmitted?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-destructive" />
            Report {commentId ? 'Comment' : 'Artwork'}
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe and respectful community by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for report *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className="bg-background/50 border-primary/20">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Additional details <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about this report..."
              className="min-h-[100px] bg-background/50 border-primary/20 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReason('');
                setDescription('');
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !reason}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};