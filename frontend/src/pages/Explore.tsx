import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, TrendingUp, Clock, Zap, Heart, MessageCircle, Eye, Flame, Palette } from 'lucide-react';
import { api } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';

const Explore = () => {
  const [artworks, setArtworks] = useState([]);
  const [inspirationArtworks, setInspirationArtworks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('trending');
  const [showInspiration, setShowInspiration] = useState(false);
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
      
      const formattedArtworks = data.data.map(artwork => ({
        id: `inspiration-${artwork.id}`,
        title: artwork.title,
        artist: artwork.artist_display,
        date: artwork.date_display,
        imageUrl: artwork.image_id 
          ? `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`
          : null,
        isInspiration: true,
      }));
      
      setInspirationArtworks(formattedArtworks.filter(art => art.imageUrl));
    } catch (error) {
      console.error('Error loading inspiration artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  // New API: Rijksmuseum
  const loadRijksmuseumArtworks = async () => {
    try {
      setLoading(true);
      const apiKey = 'YOUR_RIJKS_API_KEY'; // Replace with your free key
      const res = await fetch(
        `https://www.rijksmuseum.nl/api/en/collection?key=${apiKey}&ps=12&p=${page}&imgonly=True`
      );
      const data = await res.json();
      const formatted = data.artObjects.map(a => ({
        id: `rijks-${a.objectNumber}`,
        title: a.title,
        artist: a.principalOrFirstMaker,
        date: a.longTitle?.split(',')[1] || '',
        imageUrl: a.webImage?.url || null,
        likes_count: Math.floor(Math.random() * 100), // fake likes
        comments_count: Math.floor(Math.random() * 20), // fake comments
        views: Math.floor(Math.random() * 500), // fake views
      }));
      return formatted.filter(a => a.imageUrl);
    } catch (err) {
      console.error('Rijksmuseum API error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (filterId, isLink, isInspiration) => {
    if (filterId === 'generate' && isLink) {
      window.location.href = 'http://localhost:8081/ai-image-modifier';
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

  const loadArtworks = useCallback(async (pageNum, reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      // Original backend artworks
      const response = await api.getArtworks({ category: '', search: '' });
      const backendArtworks = Array.isArray(response) ? response : [];

      // New API artworks
      const rijksArtworks = await loadRijksmuseumArtworks();

      let combined = [...backendArtworks, ...rijksArtworks];

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
          combined.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));
          break;
        case 'abstract':
          combined = combined.filter(a => a.title?.toLowerCase().includes('abstract'));
          break;
      }

      if (reset) setArtworks(combined);
      else setArtworks(prev => [...prev, ...combined]);

      setHasMore(combined.length >= 12);
    } catch (error) {
      console.error('Error loading artworks:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [filter, loading, page]);

  useEffect(() => {
    if (filter !== 'generate' && filter !== 'inspiration') {
      setPage(1);
      loadArtworks(1, true);
    }
  }, [filter]);

  useEffect(() => {
    if (page > 1 && filter !== 'generate' && filter !== 'inspiration') {
      loadArtworks(page);
    }
  }, [page, loadArtworks]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading && !showInspiration) {
        setPage(prev => prev + 1);
      }
    });

    if (lastArtworkRef.current) observerRef.current.observe(lastArtworkRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, showInspiration]);

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

  const displayArtworks = showInspiration ? inspirationArtworks : artworks;

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
              {showInspiration ? 'Get Inspired' : 'Explore Art'}
            </h1>
            <p className="text-xl text-slate-400">
              {showInspiration 
                ? 'Discover masterpieces from the Art Institute of Chicago'
                : 'Discover trending masterpieces from our creative community'
              }
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
          {showInspiration ? (
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
                      <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">
                        {artwork.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-2">
                        {artwork.artist}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {artwork.date}
                      </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artworks.map((artwork, index) => (
                <div
                  key={artwork.id}
                  ref={index === artworks.length - 1 ? lastArtworkRef : null}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(index % 12) * 0.05}s` }}
                >
                  <ArtworkCard 
                    artwork={artwork} 
                    onLike={handleLike}
                    onComment={handleComment}
                  />
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Explore;
