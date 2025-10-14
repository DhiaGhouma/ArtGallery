import { useState, useEffect } from 'react';
import { Search, Filter, Grid3x3, Grid2x2 } from 'lucide-react';
import { api, Artwork } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Gallery = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [style, setStyle] = useState('all');
  const [sort, setSort] = useState('latest');
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
      const response = await api.getArtworks({
        page,
        category: category === 'all' ? '' : category,
        style: style === 'all' ? '' : style,
        search,
        sort,
      });
      setArtworks(response.results || []);
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
    } catch {
      toast({
        title: 'Error',
        description: 'Please login to like artworks',
        variant: 'destructive',
      });
    }
  };

  const gridCols =
    gridSize === 'small'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Abstract Iridescent Background */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(86,11,173,0.5), transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,212,255,0.3), transparent 50%), linear-gradient(120deg, #1a0033, #0d001f, #2d003a)',
          backgroundBlendMode: 'screen',
          filter: 'blur(60px)',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 30,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 py-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-10 text-center"
          >
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-3 tracking-wide drop-shadow-md">
              Explore the ArtVerse
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover, admire, and connect with creators shaping the world of modern art.
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="glass-effect border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-12"
          >
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search artworks, artists, styles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-400 text-white hover:opacity-90 transition-all"
              >
                Search
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Filter className="w-5 h-5 text-pink-400" />
                <span className="font-semibold">Filters:</span>
              </div>

              {/* Category Select */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[160px] bg-white/10 text-white border-white/20">
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

              {/* Style Select */}
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="w-[160px] bg-white/10 text-white border-white/20">
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

              {/* Sort Select */}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px] bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="comments">Most Commented</SelectItem>
                </SelectContent>
              </Select>

              {/* Grid Size Buttons */}
              <div className="ml-auto flex gap-2">
                <Button
                  variant={gridSize === 'small' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setGridSize('small')}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={gridSize === 'large' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setGridSize('large')}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Grid2x2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Artwork Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-400">Loading artworks...</p>
            </div>
          ) : (
            <>
              <div className={`grid ${gridCols} gap-6 mb-8`}>
                {artworks.map((artwork, idx) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <ArtworkCard artwork={artwork} onLike={handleLike} />
                  </motion.div>
                ))}
              </div>

              {artworks.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-xl mb-2">No artworks found</p>
                  <p>Try adjusting your filters</p>
                </div>
              )}

              {/* Pagination */}
              {artworks.length > 0 && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="bg-white/10 text-white border-white/20"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-4 py-2 glass-effect rounded-lg text-white bg-white/10 border border-white/20">
                    <span className="font-semibold">Page {page}</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasMore}
                    className="bg-white/10 text-white border-white/20"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
