import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, TrendingUp, Clock, Zap, Heart, MessageCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, type Artwork } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import DotGrid from '@/components/DotGrid';

const Explore = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'trending' | 'newest' | 'ai-picks' | 'abstract'>('trending');
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastArtworkRef = useRef<HTMLDivElement | null>(null);

  const filters = [
    { id: 'trending' as const, label: 'Most Liked', icon: TrendingUp },
    { id: 'newest' as const, label: 'Newest', icon: Clock },
    { id: 'ai-picks' as const, label: 'AI Picks', icon: Sparkles },
    { id: 'abstract' as const, label: 'Abstract', icon: Zap },
  ];

  const loadArtworks = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const sortBy = filter === 'trending' ? '-likes_count' : filter === 'newest' ? '-created_at' : '-views';
      const category = filter === 'abstract' ? 'Abstract' : undefined;
      
      const data = await api.getArtworks({ page: pageNum, sort: sortBy, category });
      const results = Array.isArray(data.results) ? data.results : [];

      if (reset) {
        setArtworks(results);
      } else {
        setArtworks(prev => [...prev, ...results]);
      }

      setHasMore(!!data?.next);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load artworks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, loading, toast]);

  useEffect(() => {
    setPage(1);
    loadArtworks(1, true);
  }, [filter]);

  useEffect(() => {
    if (page > 1) loadArtworks(page);
  }, [page]);

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

  const handleLike = async (id: number) => {
    if (!isAuthenticated) {
      toast({ title: 'Please login to like artworks', variant: 'destructive' });
      return;
    }

    try {
      const result = await api.likeArtwork(id);
      setArtworks(prev =>
        prev.map(art => (art.id === id ? { ...art, likes: result.likes ?? art.likes } : art))
      );
    } catch (error) {
      toast({ title: 'Failed to like artwork', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* DotGrid Background */}
      <div className="fixed inset-0 z-0" style={{ width: '100%', height: '100%' }}>
        <DotGrid
          dotSize={4}
          gap={30}
          baseColor="#5227FF33"
          activeColor="#5227FF66"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl sm:text-7xl font-bold gradient-text mb-4">
              Explore Art
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover trending masterpieces from our creative community
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-scale-in">
            {filters.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                onClick={() => setFilter(id)}
                variant={filter === id ? 'default' : 'outline'}
                className={`gap-2 ${filter === id ? 'glow-effect' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>

          {/* Artwork Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((artwork, index) => (
              <div
                key={artwork.id}
                ref={index === artworks.length - 1 ? lastArtworkRef : null}
                className="group relative overflow-hidden rounded-2xl glass-effect animate-fade-in"
                style={{ animationDelay: `${(index % 12) * 0.05}s` }}
              >
                <Link to={`/artwork/${artwork.id}`}>
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={artwork.image}
                      alt={artwork.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 backdrop-blur-sm" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <button
                        onClick={(e) => { e.preventDefault(); handleLike(artwork.id); }}
                        className="p-3 rounded-full bg-primary/20 backdrop-blur-md border border-primary/50 hover:bg-primary/40 hover-glow transition-all"
                      >
                        <Heart className="w-6 h-6 text-primary" />
                      </button>
                      <button className="p-3 rounded-full bg-secondary/20 backdrop-blur-md border border-secondary/50 hover:bg-secondary/40 hover-glow transition-all">
                        <MessageCircle className="w-6 h-6 text-secondary" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:gradient-text transition-all">
                      {artwork.title ?? 'Untitled'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {artwork.description ?? ''}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {artwork.likes ?? 0}
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
                </Link>
              </div>
            ))}
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!hasMore && artworks.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">You've reached the end! ✨</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;