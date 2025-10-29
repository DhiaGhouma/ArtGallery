import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, MessageCircle } from 'lucide-react';
import { Artwork } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ArtworkCardProps {
  artwork: Artwork;
  onLike?: (id: number) => void;
}

const ArtworkCard = ({ artwork, onLike }: ArtworkCardProps) => {
  const [isLiked, setIsLiked] = useState(artwork.is_liked || false);
  const [likes, setLikes] = useState(artwork.likes_count);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    onLike?.(artwork.id);
  };

  return (
    <Link to={`/artwork/${artwork.id}`}>
      <Card className="group overflow-hidden border-border/50 hover-glow glass-effect transition-all duration-500">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={artwork.image}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-sm text-white/90 line-clamp-2 mb-3">{artwork.description}</p>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-white hover:text-secondary ${isLiked ? 'text-secondary' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="ml-1">{likes}</span>
                </Button>
                <div className="flex items-center gap-1 text-white/70">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{artwork.views}</span>
                </div>
                <div className="flex items-center gap-1 text-white/70">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{artwork.comments_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 gradient-text truncate">{artwork.title}</h3>
          <div className="flex items-center gap-2">
            {artwork.artist.avatar && (
              <img
                src={artwork.artist.avatar}
                alt={artwork.artist.username}
                className="w-6 h-6 rounded-full border border-primary/50"
              />
            )}
            <span className="text-sm text-muted-foreground">{artwork.artist.username}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
              {artwork.category}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
              {artwork.style}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ArtworkCard;
