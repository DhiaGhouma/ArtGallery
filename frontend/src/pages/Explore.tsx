import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, TrendingUp, Clock, Zap, Heart, MessageCircle, Eye, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';

const Explore = () => {
  const [artworks, setArtworks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('trending');
  const observerRef = useRef(null);
  const lastArtworkRef = useRef(null);

  const filters = [
    { id: 'all', label: 'All', icon: Flame },
    { id: 'trending', label: 'Most Liked', icon: TrendingUp },
    { id: 'commented', label: 'Most Commented', icon: MessageCircle },
    { id: 'viewed', label: 'Most Viewed', icon: Eye },
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'generate', label: 'Generate your own', icon: Sparkles, isLink: true },
    { id: 'abstract', label: 'Abstract', icon: Zap },
  ];

  const handleFilterClick = (filterId, isLink) => {
    if (filterId === 'generate' && isLink) {
      window.location.href = 'http://localhost:8081/ai-image-modifier';
    } else {
      setFilter(filterId);
    }
  };

  const loadArtworks = useCallback(async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      let sortBy = '-created_at'; // Default to newest
      let category = '';

      // Determine sort parameter based on filter
      switch (filter) {
        case 'trending':
          sortBy = '-likes_count';
          break;
        case 'commented':
          sortBy = '-comments_count';
          break;
        case 'viewed':
          sortBy = '-views';
          break;
        case 'newest':
          sortBy = '-created_at';
          break;
        case 'abstract':
          sortBy = '-created_at';
          category = 'abstract';
          break;
        case 'all':
          sortBy = '-created_at';
          break;
        default:
          sortBy = '-created_at';
      }
      
      const response = await api.getArtworks({ 
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
    if (filter !== 'generate') {
      setPage(1);
      loadArtworks(1, true);
    }
  }, [filter]);

  useEffect(() => {
    if (page > 1 && filter !== 'generate') loadArtworks(page);
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
      const result = await api.likeArtwork(id);
      
      setArtworks(prev =>
        prev.map(art => (art.id === id ? { 
          ...art, 
          likes_count: result.likes_count,
          is_liked: result.liked 
        } : art))
      );
    } catch (error) {
      console.error('Failed to like artwork:', error);
      throw error;
    }
  };

  const handleComment = async (id, commentText) => {
    try {
      const newComment = await api.commentOnArtwork(id, commentText);
      
      // Update artworks state to add the new comment
      setArtworks(prev =>
        prev.map(art => (art.id === id ? { 
          ...art, 
          comments: [newComment, ...(art.comments || [])]
        } : art))
      );
      
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
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
            {filters.map(({ id, label, icon: Icon, isLink }) => (
              <button
                key={id}
                onClick={() => handleFilterClick(id, isLink)}
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
                className="animate-fade-in"
                style={{ 
                  animationDelay: `${(index % 12) * 0.05}s`
                }}
              >
                <ArtworkCard 
                  artwork={artwork} 
                  onLike={handleLike}
                  onComment={handleComment}
                />
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
      `}</style>
    </div>
  );
};

export default Explore;