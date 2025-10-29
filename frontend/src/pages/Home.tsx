import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Filter } from 'lucide-react';
import { api, Artwork } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import CurvedLoop from '@/components/CurvedLoop';
import ShinyText from '@/components/ShinyText';
import LiquidEther from '@/components/LiquidEther';

const Home = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [featured, setFeatured] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadArtworks();
  }, [category, style]);

  const loadArtworks = async () => {
    try {
      setLoading(true);
      const response = await api.getArtworks({ category, style, search });
      const data = Array.isArray(response) ? response : [];
      setArtworks(data);
      setFeatured(data.slice(0, 3));
    } catch (error) {
      console.error('Error loading artworks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artworks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadArtworks();
  };

  const handleLike = async (id: number): Promise<void> => {
    try {
      const result = await api.likeArtwork(id);
      
      // Update artworks state
      setArtworks(prev =>
        prev.map(art => (art.id === id ? { 
          ...art, 
          likes_count: result.likes_count,
          is_liked: result.liked 
        } : art))
      );
      
      // Update featured state if the artwork is in featured
      setFeatured(prev =>
        prev.map(art => (art.id === id ? { 
          ...art, 
          likes_count: result.likes_count,
          is_liked: result.liked 
        } : art))
      );
      
    } catch (error) {
      console.error('Failed to like artwork:', error);
      toast({
        title: 'Error',
        description: 'Please login to like artworks',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the card component know it failed
    }
  };

  const handleComment = async (id: number, commentText: string) => {
    try {
      await api.commentOnArtwork(id, commentText);
      
      // Update artworks state to increment comment count
      setArtworks(prev =>
        prev.map(art => (art.id === id ? { 
          ...art, 
          comments: [
            ...(art.comments || []), 
            {
              id: Date.now(), // or use a better unique id if available
              text: commentText,
              user: { id: 0, username: 'You' }, // or use actual user info if available
              created_at: new Date().toISOString()
            }
          ]
        } : art))
      );
      
      // Update featured state if the artwork is in featured
      setFeatured(prev =>
        prev.map(art => (art.id === id ? { 
          ...art, 
          comments: [
            ...(art.comments || []), 
            {
              id: Date.now(), // or use a better unique id if available
              text: commentText,
              user: { id: 0, username: 'You' }, // or use actual user info if available
              created_at: new Date().toISOString()
            }
          ]
        } : art))
      );
      
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
      
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Error',
        description: 'Please login to comment on artworks',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* LiquidEther Background */}
        <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
          <LiquidEther
            colors={['#5227FF', '#FF9FFC', '#B19EEF']}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        {/* Curved Loop Welcome Message */}
         {/* <div className="absolute top-10 left-0 right-0 z-0 opacity-30">
          <CurvedLoop 
            marqueeText="Welcome to Digital Art Gallery ✦ Discover ✦ Create ✦ Inspire ✦"
            speed={2}
            curveAmount={400}
            direction="right"
            interactive={true}
            className="text-primary/50"
          />
        </div> */}

        <div className="container mx-auto text-center relative z-10 animate-fade-in">
          <div className="inline-block mb-4">
            <Sparkles className="w-12 h-12 text-primary animate-float mx-auto" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-10 gradient-text">
            Discover Digital Masterpieces
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            <ShinyText 
              text="Immerse yourself in a vibrant community of artists sharing their most creative works" 
              disabled={false} 
              speed={3} 
              className="inline-block"
            />
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex gap-2 glass-effect p-3 rounded-2xl">
            <Input
              placeholder="Search artworks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-background/50 border-border/50"
            />
            <Button onClick={handleSearch} className="glow-effect">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Carousel */}
      {featured.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold gradient-text">Featured Artworks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((artwork, idx) => (
                <div key={artwork.id} className="animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <ArtworkCard 
                    artwork={artwork} 
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-semibold">Filter & Sort</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px] glass-effect">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="digital">Digital Art</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="3d">3D Art</SelectItem>
              </SelectContent>
            </Select>

            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="w-[180px] glass-effect">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="abstract">Abstract</SelectItem>
                <SelectItem value="realism">Realism</SelectItem>
                <SelectItem value="surreal">Surreal</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Artwork Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading artworks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artworks.map((artwork, idx) => (
                <div key={artwork.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <ArtworkCard 
                    artwork={artwork} 
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && artworks.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No artworks found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;