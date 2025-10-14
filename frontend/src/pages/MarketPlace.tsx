import { useState, useMemo } from 'react';
import { ShoppingCart, DollarSign, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface MarketplaceArtwork {
  id: number;
  title: string;
  artist: string;
  price: number;
  image: string;
  category: string;
  likes?: number;
  views?: number;
  inStock: boolean;
  featured?: boolean;
}

const Marketplace = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  const artworks: MarketplaceArtwork[] = [
    { id: 1, title: 'Liquid Dreams', artist: 'AbstractMaster', price: 299, image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600', category: 'Abstract', likes: 234, views: 1203, inStock: true, featured: true },
    { id: 2, title: 'Neon Nights', artist: 'DigitalDreamer', price: 450, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600', category: 'Digital', likes: 456, views: 2301, inStock: true, featured: true },
    { id: 3, title: 'Ocean Serenity', artist: 'WaveArtist', price: 175, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600', category: 'Landscape', likes: 189, views: 892, inStock: true },
    { id: 4, title: 'Urban Chaos', artist: 'CityScaper', price: 320, image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600', category: 'Urban', likes: 301, views: 1456, inStock: false },
    { id: 5, title: 'Cosmic Journey', artist: 'StarGazer', price: 520, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', category: 'Surreal', likes: 678, views: 3201, inStock: true, featured: true },
    { id: 6, title: 'Floral Explosion', artist: 'NatureBloom', price: 210, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', category: 'Nature', likes: 412, views: 1789, inStock: true },
  ];

  // Filtered & sorted artworks
  const filteredArtworks = useMemo(() => {
    return artworks
      .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
      .filter(a => category === 'all' || a.category.toLowerCase() === category)
      .filter(a => {
        if (priceRange === 'all') return true;
        if (priceRange === '0-200') return a.price <= 200;
        if (priceRange === '200-400') return a.price > 200 && a.price <= 400;
        if (priceRange === '400-600') return a.price > 400 && a.price <= 600;
        if (priceRange === '600+') return a.price > 600;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-low': return (a.price ?? 0) - (b.price ?? 0);
          case 'price-high': return (b.price ?? 0) - (a.price ?? 0);
          case 'popular': return (b.likes ?? 0) - (a.likes ?? 0);
          case 'newest': return b.id - a.id; // assuming higher ID = newer
          case 'featured': return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
          default: return 0;
        }
      });
  }, [search, category, priceRange, sortBy]);

  const handlePurchase = (artwork: MarketplaceArtwork) => {
    if (!isAuthenticated) return toast({ title: 'Login Required', description: 'Please login to purchase artwork', variant: 'destructive' });
    if (!artwork.inStock) return toast({ title: 'Out of Stock', description: 'This artwork is currently unavailable', variant: 'destructive' });
    toast({ title: 'Added to Cart!', description: `"${artwork.title}" by ${artwork.artist}` });
  };

  const handleAddToWishlist = (artwork: MarketplaceArtwork) => {
    if (!isAuthenticated) return toast({ title: 'Login Required', description: 'Please login to add to wishlist', variant: 'destructive' });
    toast({ title: 'Added to Wishlist', description: `"${artwork.title}" saved!` });
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-7xl font-bold gradient-text mb-4">Art Marketplace</h1>
          <p className="text-xl text-muted-foreground">Discover and own unique pieces from talented artists</p>
        </div>

        {/* Filters */}
        <div className="glass-effect rounded-2xl p-6 mb-12 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search artworks..."
              className="bg-background/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="abstract">Abstract</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="urban">Urban</SelectItem>
                <SelectItem value="surreal">Surreal</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-200">$0 - $200</SelectItem>
                <SelectItem value="200-400">$200 - $400</SelectItem>
                <SelectItem value="400-600">$400 - $600</SelectItem>
                <SelectItem value="600+">$600+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Artworks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtworks.map((artwork, index) => (
            <div key={artwork.id} className="glass-effect rounded-2xl overflow-hidden hover-glow group animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="relative aspect-square overflow-hidden">
                <Link to={`/artwork/${artwork.id}`}>
                  <img
                    src={artwork.image}
                    alt={artwork.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </Link>

                {artwork.featured && <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-br from-gold/90 to-primary/90 backdrop-blur-md text-white text-sm font-semibold">Featured</div>}
                {!artwork.inStock && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center text-destructive text-2xl font-bold">SOLD OUT</div>}

                <button onClick={() => handleAddToWishlist(artwork)} className="absolute top-4 right-4 p-2 rounded-full bg-background/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">{artwork.category}</span>
                </div>
                <Link to={`/artwork/${artwork.id}`}><h3 className="text-xl font-bold mb-1 group-hover:gradient-text transition-all">{artwork.title}</h3></Link>
                <p className="text-muted-foreground text-sm mb-4">by {artwork.artist}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-5 h-5 text-gold" />
                    <span className="text-2xl font-bold text-gold">{artwork.price}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{artwork.likes ?? 0}</span>
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{artwork.views ?? 0}</span>
                  </div>
                </div>

                <Button onClick={() => handlePurchase(artwork)} disabled={!artwork.inStock} className="w-full gap-2 glow-effect disabled:opacity-50">
                  <ShoppingCart className="w-4 h-4" />
                  {artwork.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
