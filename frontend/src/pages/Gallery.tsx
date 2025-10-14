import { useState, useEffect } from 'react';
import { Search, Filter, Grid3x3, Grid2x2 } from 'lucide-react';
import { api, Artwork } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Gallery = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [sort, setSort] = useState('');
  const [gridSize, setGridSize] = useState<'small' | 'large'>('small');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadArtworks();
  }, [category, style, sort, page]);

  const loadArtworks = async () => {
    try {
      setLoading(true);
      const response = await api.getArtworks({ page, category, style, search, sort });
      setArtworks(response.results);
      setHasMore(!!response.next);
    } catch (error) {
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
    setPage(1);
    loadArtworks();
  };

  const handleLike = async (id: number) => {
    try {
      await api.likeArtwork(id);
      loadArtworks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Please login to like artworks',
        variant: 'destructive',
      });
    }
  };

  const gridCols = gridSize === 'small' 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Explore Gallery
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover amazing artworks from talented artists worldwide
          </p>
        </div>

        {/* Search & Filters */}
        <div className="glass-effect p-6 rounded-2xl mb-8 space-y-4 animate-scale-in">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search artworks, artists, styles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background/50"
              />
            </div>
            <Button onClick={handleSearch} className="glow-effect">
              Search
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-accent" />
              <span className="font-semibold">Filters:</span>
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px] bg-background/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="digital">Digital Art</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="3d">3D Art</SelectItem>
              </SelectContent>
            </Select>

            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="w-[160px] bg-background/50">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Styles</SelectItem>
                <SelectItem value="abstract">Abstract</SelectItem>
                <SelectItem value="realism">Realism</SelectItem>
                <SelectItem value="surreal">Surreal</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Latest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="comments">Most Commented</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex gap-2">
              <Button
                variant={gridSize === 'small' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setGridSize('small')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={gridSize === 'large' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setGridSize('large')}
              >
                <Grid2x2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Artwork Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading artworks...</p>
          </div>
        ) : (
          <>
            <div className={`grid ${gridCols} gap-6 mb-8`}>
              {artworks.map((artwork, idx) => (
                <div key={artwork.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                  <ArtworkCard artwork={artwork} onLike={handleLike} />
                </div>
              ))}
            </div>

            {artworks.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground mb-4">No artworks found</p>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}

            {/* Pagination */}
            {artworks.length > 0 && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 py-2 glass-effect rounded-lg">
                  <span className="font-semibold">Page {page}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Gallery;
