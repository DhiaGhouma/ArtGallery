import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Eye, Send, X, User, Clock, Tag, Flag } from 'lucide-react';
import { Artwork, api } from '@/lib/api';
import CommentSuggestions from './CommentSuggestions';
import { ReportArtworkDialog } from '@/components/ReportArtworkDialog';

interface ArtworkCardProps {
  artwork: Artwork;
  onLike: (id: number) => Promise<void>;
  onComment?: (id: number, commentText: string) => Promise<void>;
}

type CommentUser = {
  id?: number;
  username?: string;
  avatar?: string;
};

type ArtworkComment = {
  id: number;
  text?: string;
  content?: string;
  user?: CommentUser;
  created_at?: string;
};

const ArtworkCard = ({ artwork, onLike, onComment }: ArtworkCardProps) => {
  const [detailModal, setDetailModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [comments, setComments] = useState<ArtworkComment[]>(artwork.comments || []);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; avatar?: string } | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [fullArtwork, setFullArtwork] = useState(artwork);

  // Report dialog state: support either artworkId OR commentId
  const [reportDialog, setReportDialog] = useState<{ open: boolean; artworkId: number | null; commentId: number | null }>({
    open: false,
    artworkId: null,
    commentId: null,
  });

  // auth
  useEffect(() => {
    (async () => {
      try {
        const authResponse = await api.checkAuth();
        if (authResponse.authenticated && authResponse.user) {
          setCurrentUser(authResponse.user);
        }
      } catch {
        setCurrentUser(null);
      }
    })();
  }, []);

  // sync props
  useEffect(() => {
    setFullArtwork(artwork);
    setComments((artwork.comments || []) as ArtworkComment[]);
  }, [artwork]);

  // load full on modal open
  useEffect(() => {
    if (!detailModal) return;
    (async () => {
      setLoadingComments(true);
      try {
        const fullData = await api.getArtwork(artwork.id);
        setFullArtwork(fullData);
        setComments((fullData.comments || []) as ArtworkComment[]);
      } catch (e) {
        console.error('Failed to load full artwork:', e);
      } finally {
        setLoadingComments(false);
      }
    })();
  }, [detailModal, artwork.id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || sendingComment || !onComment || !currentUser) return;

    setSendingComment(true);
    try {
      await onComment(artwork.id, commentText);

      // optimistic
      const newComment: ArtworkComment = {
        id: Date.now(),
        text: commentText,
        content: commentText,
        user: { id: currentUser.id, username: currentUser.username, avatar: currentUser.avatar },
        created_at: new Date().toISOString(),
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText('');

      // refresh (light delay)
      setTimeout(async () => {
        try {
          const updated = await api.getArtwork(artwork.id);
          setComments((updated.comments || []) as ArtworkComment[]);
        } catch (err) {
          console.error('Failed to refresh comments:', err);
        }
      }, 800);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking || !currentUser) return;

    setIsLiking(true);
    try {
      await onLike(artwork.id);
    } catch (err) {
      console.error('Failed to like artwork:', err);
    } finally {
      setIsLiking(false);
    }
  };

  // Report handlers
  const openReportDialogForArtwork = (artworkId: number) => {
    setReportDialog({ open: true, artworkId, commentId: null });
  };
  const openReportDialogForComment = (commentId: number) => {
    setReportDialog({ open: true, artworkId: null, commentId });
  };
  const closeReportDialog = () => {
    setReportDialog({ open: false, artworkId: null, commentId: null });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffH = diffInMs / (1000 * 60 * 60);
    const diffD = diffInMs / (1000 * 60 * 60 * 24);

    if (diffH < 1) {
      const m = Math.floor(diffInMs / (1000 * 60));
      return m <= 0 ? 'Just now' : `${m}m ago`;
    } else if (diffH < 24) {
      return `${Math.floor(diffH)}h ago`;
    } else if (diffD < 7) {
      return `${Math.floor(diffD)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <>
      {/* Card */}
      <div
        className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
        onClick={() => setDetailModal(true)}
      >
        <div className="aspect-square overflow-hidden relative">
          <img
            src={artwork.image}
            alt={artwork.title || 'Artwork'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Image+Not+Found'; }}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick actions (click-safe) */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <button
              onClick={handleLikeClick}
              disabled={!currentUser || isLiking}
              className={`pointer-events-auto p-3 rounded-full backdrop-blur-md border transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                artwork.is_liked ? 'bg-red-500/50 border-red-400' : 'bg-primary/30 border-primary/50 hover:bg-primary/50'
              }`}
              title="Like"
            >
              <Heart className={`w-6 h-6 ${artwork.is_liked ? 'fill-white text-white' : 'text-white'}`} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setDetailModal(true); }}
              className="pointer-events-auto p-3 rounded-full bg-blue-500/30 backdrop-blur-md border border-blue-400/50 hover:bg-blue-500/50 transition-all hover:scale-110"
              title="Comments"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); openReportDialogForArtwork(artwork.id); }}
              className="pointer-events-auto p-3 rounded-full bg-orange-500/30 backdrop-blur-md border border-orange-400/50 hover:bg-orange-500/50 transition-all hover:scale-110"
              title="Report artwork"
            >
              <Flag className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {artwork.title || 'Untitled'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {artwork.description || 'No description available'}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {artwork.likes_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {artwork.views ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {comments.length}
            </span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setDetailModal(false)}
        >
          <div
            className="bg-card rounded-2xl max-w-6xl w-full border border-primary/30 shadow-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalSlideIn 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <h2 className="text-2xl font-bold text-primary">{artwork.title || 'Untitled'}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReportDialogForArtwork(artwork.id)}
                  className="px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-400/40 hover:bg-orange-500/30 text-orange-200 text-sm flex items-center gap-2"
                  title="Report this artwork"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
                <button
                  onClick={() => setDetailModal(false)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Left */}
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-accent/10">
                    <img
                      src={artwork.image}
                      alt={artwork.title || 'Artwork'}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/800x800?text=Image+Not+Found'; }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-around p-4 bg-accent/10 rounded-xl">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Heart className={`w-5 h-5 ${artwork.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-2xl font-bold">{artwork.likes_count ?? 0}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Likes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Eye className="w-5 h-5" />
                        <span className="text-2xl font-bold">{artwork.views ?? 0}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-2xl font-bold">{comments.length}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Comments</p>
                    </div>
                  </div>

                  {/* Like button */}
                  <button
                    onClick={handleLikeClick}
                    disabled={!currentUser || isLiking}
                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      artwork.is_liked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${artwork.is_liked ? 'fill-white' : ''}`} />
                    {!currentUser ? 'Login to Like' : artwork.is_liked ? 'Liked' : 'Like'}
                  </button>
                </div>

                {/* Right */}
                <div className="space-y-6">
                  {/* Description */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        Description
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {artwork.description || 'No description available'}
                      </p>
                    </div>

                    {/* Artist */}
                    <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{artwork.artist?.username || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">Artist</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3">
                      {artwork.style && (
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Style</p>
                          <p className="font-medium capitalize">{artwork.style}</p>
                        </div>
                      )}
                      {artwork.category && (
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Category</p>
                          <p className="font-medium capitalize">{artwork.category}</p>
                        </div>
                      )}
                      {artwork.created_at && (
                        <div className="p-3 bg-accent/10 rounded-lg col-span-2">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created
                          </p>
                          <p className="font-medium">{formatDate(artwork.created_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-primary" />
                      Comments ({comments.length})
                    </h3>

                    {/* Add comment */}
                    {onComment && (
                      <form onSubmit={handleComment} className="space-y-3">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={currentUser ? 'Share your thoughts about this artwork...' : 'Please login to comment'}
                          disabled={!currentUser}
                          className="w-full bg-background border border-border rounded-xl p-4 placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {currentUser && (
                          <CommentSuggestions
                            artworkId={artwork.id}
                            onSelectSuggestion={(s) => setCommentText(s)}
                          />
                        )}
                        <button
                          type="submit"
                          disabled={!commentText.trim() || sendingComment || !currentUser}
                          className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          <Send className="w-4 h-4" />
                          {sendingComment ? 'Posting...' : !currentUser ? 'Login to Comment' : 'Post Comment'}
                        </button>
                      </form>
                    )}

                    {/* List */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No comments yet. Be the first to comment!</p>
                        </div>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="p-4 bg-accent/10 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-medium text-sm">
                                  {c.user?.username || 'Anonymous'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {c.created_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(c.created_at)}
                                  </span>
                                )}
                                {/* Report comment */}
                                <button
                                  onClick={() => openReportDialogForComment(c.id)}
                                  className="text-xs px-2 py-1 rounded-md bg-orange-500/15 border border-orange-400/30 hover:bg-orange-500/25 text-orange-200 flex items-center gap-1"
                                  title="Report this comment"
                                >
                                  <Flag className="w-3 h-3" />
                                  Report
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                              {c.text ?? c.content ?? ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Report dialog (handles artwork OR comment) */}
      <ReportArtworkDialog
        open={reportDialog.open}
        onOpenChange={closeReportDialog}
        artworkId={reportDialog.artworkId ?? undefined}
        commentId={reportDialog.commentId ?? undefined}
        onReportSubmitted={() => closeReportDialog()}
      />

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default ArtworkCard;
