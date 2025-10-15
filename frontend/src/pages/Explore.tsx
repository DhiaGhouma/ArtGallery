import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, TrendingUp, Clock, Zap, Heart, MessageCircle, Eye, X, Send } from 'lucide-react';
import { api } from '@/lib/api';

const Explore = () => {
  const [artworks, setArtworks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('trending');
  const [commentModal, setCommentModal] = useState({ open: false, artworkId: null, artworkTitle: '' });
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [likeAnimations, setLikeAnimations] = useState({});
  const observerRef = useRef(null);
  const lastArtworkRef = useRef(null);

  const filters = [
    { id: 'trending', label: 'Most Liked', icon: TrendingUp },
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'ai-picks', label: 'AI Picks', icon: Sparkles },
    { id: 'abstract', label: 'Abstract', icon: Zap },
  ];

  const loadArtworks = useCallback(async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const sortBy = filter === 'trending' ? '-likes_count' : filter === 'newest' ? '-created_at' : '-views';
      const category = filter === 'abstract' ? 'abstract' : '';
      
      const response = await api.getArtworks({ 
        page: pageNum, 
        sort: sortBy, 
        category: category,
        search: '' 
      });
      
      const data = Array.isArray(response) ? response : [];
      
      if (reset) {
        setArtworks(data);
      } else {
        setArtworks(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length > 0 && data.length >= 12);
      
    } catch (error) {
      console.error('Error loading artworks:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [filter, loading]);

  useEffect(() => {
    setPage(1);
    loadArtworks(1, true);
  }, [filter]);

  useEffect(() => {
    if (page > 1) loadArtworks(page);
  }, [page, loadArtworks]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    });

    if (lastArtworkRef.current) observerRef.current.observe(lastArtworkRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  const handleLike = async (id) => {
    try {
      // Trigger animation
      setLikeAnimations(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setLikeAnimations(prev => ({ ...prev, [id]: false }));
      }, 600);

      const result = await api.likeArtwork(id);
      setArtworks(prev =>
        prev.map(art => (art.id === id ? { 
          ...art, 
          likes_count: result.likes_count ?? (art.likes_count || 0) + 1,
          is_liked: result.liked 
        } : art))
      );
    } catch (error) {
      console.error('Failed to like artwork:', error);
    }
  };

  const openCommentModal = (artwork) => {
    setCommentModal({ 
      open: true, 
      artworkId: artwork.id, 
      artworkTitle: artwork.title 
    });
  };

  const closeCommentModal = () => {
    setCommentModal({ open: false, artworkId: null, artworkTitle: '' });
    setCommentText('');
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || sendingComment) return;

    setSendingComment(true);
    try {
      await api.commentOnArtwork(commentModal.artworkId, commentText);
      setCommentText('');
      closeCommentModal();
      // Optionally refresh the artwork to show new comment
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert(error.message || 'Failed to add comment. Please login first.');
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #8b5cf6 1px, transparent 1px),
            linear-gradient(to bottom, #8b5cf6 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Explore Art
            </h1>
            <p className="text-xl text-slate-400">
              Discover trending masterpieces from our creative community
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filters.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-full font-medium
                  transition-all duration-300 backdrop-blur-sm
                  ${filter === id 
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((artwork, index) => (
              <div
                key={artwork.id}
                ref={index === artworks.length - 1 ? lastArtworkRef : null}
                className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
                style={{ 
                  animation: `fadeIn 0.5s ease-out ${(index % 12) * 0.05}s both`
                }}
              >
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src={artwork.image}
                    alt={artwork.title || 'Artwork'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x600?text=Image+Not+Found';
                    }}
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Like Animation Hearts */}
                  {likeAnimations[artwork.id] && (
                    <>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ animation: 'heartBurst 0.6s ease-out' }}>
                        <Heart className="w-20 h-20 text-red-500 fill-red-500" />
                      </div>
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-1/2 left-1/2 pointer-events-none"
                          style={{
                            animation: `heartFloat${i} 0.8s ease-out`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        >
                          <Heart className="w-6 h-6 text-red-400 fill-red-400" />
                        </div>
                      ))}
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <button
                      onClick={() => handleLike(artwork.id)}
                      className={`p-3 rounded-full backdrop-blur-md border transition-all hover:scale-110 ${
                        artwork.is_liked 
                          ? 'bg-red-500/50 border-red-400' 
                          : 'bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/50'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${artwork.is_liked ? 'fill-white text-white' : 'text-white'}`} />
                    </button>
                    <button 
                      onClick={() => openCommentModal(artwork)}
                      className="p-3 rounded-full bg-blue-500/30 backdrop-blur-md border border-blue-400/50 hover:bg-blue-500/50 transition-all hover:scale-110"
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {artwork.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {artwork.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
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
                      {artwork.comments?.length ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          )}

          {/* End Message */}
          {!hasMore && artworks.length > 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">You've reached the end! ✨</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && artworks.length === 0 && (
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
              <h3 className="text-xl font-semibold text-white">
                Add Comment
              </h3>
              <button 
                onClick={closeCommentModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">
                Commenting on: <span className="text-purple-400 font-medium">{commentModal.artworkTitle}</span>
              </p>
              
              <form onSubmit={handleComment}>
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

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heartBurst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
        }

        ${[...Array(8)].map((_, i) => {
          const angle = (i * 45) * Math.PI / 180;
          const distance = 60;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          return `
            @keyframes heartFloat${i} {
              0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 1;
              }
              100% {
                transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.5);
                opacity: 0;
              }
            }
          `;
        }).join('\n')}

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Explore;