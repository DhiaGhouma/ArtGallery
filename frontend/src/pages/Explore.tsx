import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, TrendingUp, Clock, Zap, Heart, MessageCircle, Eye, Flame, Palette, Flag, X, Send } from 'lucide-react';
import { api } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';
import { useNavigate } from 'react-router-dom';
import { ReportArtworkDialog } from '@/components/ReportArtworkDialog';

const Explore = () => {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [inspirationArtworks, setInspirationArtworks] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('trending');
  const [showInspiration, setShowInspiration] = useState(false);

  // Simple local comment modal (optionnel, déclenchable si tu ajoutes un bouton)
  const [commentModal, setCommentModal] = useState<{ open: boolean; artworkId: number | null; artworkTitle: string }>({
    open: false,
    artworkId: null,
    artworkTitle: '',
  });
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Report dialog
  const [reportDialog, setReportDialog] = useState<{ open: boolean; artworkId: number | null }>({
    open: false,
    artworkId: null,
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastArtworkRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const filters = [
    { id: 'all', label: 'All', icon: Flame },
    { id: 'trending', label: 'Most Liked', icon: TrendingUp },
    { id: 'commented', label: 'Most Commented', icon: MessageCircle },
    { id: 'viewed', label: 'Most Viewed', icon: Eye },
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'generate', label: 'Generate your own', icon: Sparkles, isLink: true },
    { id: 'abstract', label: 'Abstract', icon: Zap },
    { id: 'inspiration', label: 'Get Inspired', icon: Palette, isInspiration: true },
  ];

  // Fetch inspiration artworks from Art Institute of Chicago API
  const loadInspirationArtworks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://api.artic.edu/api/v1/artworks/search?q=painting&limit=12&fields=id,title,artist_display,date_display,image_id,thumbnail'
      );
      const data = await response.json();

      const formattedArtworks = (data.data || []).map((artwork: any) => ({
        id: `inspiration-${artwork.id}`,
        title: artwork.title,
        artist: artwork.artist_display,
        date: artwork.date_display,
        imageUrl: artwork.image_id
          ? `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`
          : null,
        isInspiration: true,
      }));

      setInspirationArtworks(formattedArtworks.filter((art: any) => art.imageUrl));
    } catch (error) {
      console.error('Error loading inspiration artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (filterId: string, isLink?: boolean, isInspiration?: boolean) => {
    if (filterId === 'generate' && isLink) {
      navigate('/ai-image-modifier');
    } else if (filterId === 'inspiration' && isInspiration) {
      setShowInspiration(true);
      setFilter('inspiration');
      if (inspirationArtworks.length === 0) {
        loadInspirationArtworks();
      }
    } else {
      setShowInspiration(false);
      setFilter(filterId);
    }
  };

  const loadArtworks = useCallback(
    async (pageNum: number, reset = false) => {
      if (loading) return;
      setLoading(true);

      try {
        // Backend artworks
        const response = await api.getArtworks({ category: '', search: '' });
        const backendArtworks = Array.isArray(response) ? response : [];

        let combined = [...backendArtworks];

        // Apply sorting based on filter
        switch (filter) {
          case 'trending':
            combined.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
            break;
          case 'commented':
            combined.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
            break;
          case 'viewed':
            combined.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
          case 'newest':
            combined.sort(
              (a, b) =>
                new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime()
            );
            break;
          case 'abstract':
            combined = combined.filter((a) => a.title?.toLowerCase().includes('abstract'));
            break;
          case 'all':
          default:
            break;
        }

        if (reset) setArtworks(combined);
        else setArtworks((prev) => [...prev, ...combined]);

        setHasMore(combined.length >= 12);
      } catch (error) {
        console.error('Error loading artworks:', error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [filter, loading]
  );

  useEffect(() => {
    if (filter !== 'generate' && filter !== 'inspiration') {
      setPage(1);
      loadArtworks(1, true);
    }
  }, [filter, loadArtworks]);

  useEffect(() => {
    if (page > 1 && filter !== 'generate' && filter !== 'inspiration') {
      loadArtworks(page);
    }
  }, [page, loadArtworks]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !showInspiration) {
        setPage((prev) => prev + 1);
      }
    });

    if (lastArtworkRef.current) observerRef.current.observe(lastArtworkRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, showInspiration]);

  const handleLike = async (id: number) => {
    try {
      const result = await api.likeArtwork(id);

      setArtworks((prev) =>
        prev.map((art) =>
          art.id === id
            ? {
                ...art,
                likes_count: result.likes_count,
                is_liked: result.liked,
              }
            : art
        )
      );
    } catch (error) {
      console.error('Failed to like artwork:', error);
      throw error;
    }
  };

  const handleComment = async (id: number, text: string) => {
    try {
      const newComment = await api.commentOnArtwork(id, text);

      setArtworks((prev) =>
        prev.map((art) =>
          art.id === id
            ? {
                ...art,
                comments: [newComment, ...(art.comments || [])],
              }
            : art
        )
      );
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  // --- Comment modal helpers (local simple modal) ---
  const openCommentModal = (artwork: any) => {
    setCommentModal({
      open: true,
      artworkId: artwork.id,
      artworkTitle: artwork.title || 'Untitled',
    });
    setCommentText('');
  };

  const closeCommentModal = () => {
    setCommentModal({ open: false, artworkId: null, artworkTitle: '' });
    setCommentText('');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !commentModal.artworkId) return;
    setSendingComment(true);
    try {
      await handleComment(commentModal.artworkId, commentText.trim());
      closeCommentModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingComment(false);
    }
  };

  // --- Report dialog helpers ---
  const openReportDialog = (artworkId: number) => {
    setReportDialog({ open: true, artworkId });
  };

  const closeReportDialog = () => {
    setReportDialog({ open: false, artworkId: null });
  };

  const displayArtworks = showInspiration ? inspirationArtworks : artworks;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 overflow-hidden opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, #8b5cf6 1px, transparent 1px),
            linear-gradient(to bottom, #8b5cf6 1px, transparent 1px)
          `,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              {showInspiration ? 'Get Inspired' : 'Explore Art'}
            </h1>
            <p className="text-xl text-slate-400">
              {showInspiration
                ? 'Discover masterpieces from the Art Institute of Chicago'
                : 'Discover trending masterpieces from our creative community'}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 overflow-x-auto">
            {filters.map(({ id, label, icon: Icon, isLink, isInspiration }) => (
              <button
                key={id}
                onClick={() => handleFilterClick(id, isLink, isInspiration)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-full font-medium
                  transition-all duration-300 backdrop-blur-sm
                  ${
                    filter === id
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50 scale-105'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Artwork Grid */}
          {showInspiration ? (
            // Inspiration grid: display only (pas d’actions backend ici)
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {inspirationArtworks.map((artwork, index) => (
                <div
                  key={artwork.id}
                  className="animate-fade-in group"
                  style={{ animationDelay: `${(index % 12) * 0.05}s` }}
                >
                  <div className="relative overflow-hidden rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">{artwork.title}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2">{artwork.artist}</p>
                      <p className="text-slate-500 text-xs mt-1">{artwork.date}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-purple-400">
                        <Palette className="w-3 h-3" />
                        <span>Art Institute of Chicago</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Main grid relying on ArtworkCard (inchangé)
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artworks.map((artwork, index) => (
                <div
                  key={artwork.id}
                  ref={index === artworks.length - 1 ? lastArtworkRef : null}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(index % 12) * 0.05}s` }}
                >
                  <ArtworkCard artwork={artwork} onLike={handleLike} onComment={handleComment} />
                </div>
              ))}
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          )}

          {/* End Message */}
          {!hasMore && artworks.length > 0 && !showInspiration && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">You've reached the end! ✨</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && displayArtworks.length === 0 && (
            <div className="text-center py-20">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
              <p className="text-xl text-slate-400">No artworks found</p>
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal.open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeCommentModal}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-lg w-full border border-purple-500/30 shadow-2xl shadow-purple-500/20"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalSlideIn 0.3s ease-out' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Add Comment</h3>
              <button onClick={closeCommentModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">
                Commenting on: <span className="text-purple-400 font-medium">{commentModal.artworkTitle}</span>
              </p>

              <form onSubmit={handleSubmitComment}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all min-h-[120px] resize-none"
                  autoFocus
                />

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={closeCommentModal}
                    className="px-5 py-2 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || sendingComment}
                    className="px-5 py-2 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {sendingComment ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Dialog (artwork-level) */}
      <ReportArtworkDialog
        open={reportDialog.open}
        onOpenChange={(open) => (open ? null : closeReportDialog())}
        artworkId={reportDialog.artworkId ?? undefined}
        onReportSubmitted={() => {
          closeReportDialog();
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Explore;
