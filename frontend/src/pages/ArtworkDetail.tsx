/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Eye, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { api, Artwork, Comment } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ArtworkCard from '@/components/ArtworkCard';
import CommentSuggestions from '@/components/CommentSuggestions';

const ArtworkDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [related, setRelated] = useState<Artwork[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadArtwork();
      loadRelated();
    }
  }, [id]);

  const loadArtwork = async () => {
    try {
      setLoading(true);
      const data = await api.getArtwork(Number(id));
      setArtwork(data);
      setIsLiked(data.is_liked || false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load artwork',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRelated = async () => {
    try {
      const response = await api.getArtworks({ category: artwork?.category });
      const items = Array.isArray(response)
        ? response
        : ((response as { results?: Artwork[] }).results || []);
      setRelated(items.slice(0, 4));
    } catch (error) {
      console.error('Failed to load related artworks');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to like artworks',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await api.likeArtwork(Number(id));
      setIsLiked(result.liked);
      if (artwork) {
        setArtwork(prev => (prev ? ({ ...prev, likes_count: result.likes_count } as any) : prev));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like artwork',
        variant: 'destructive',
      });
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to comment',
        variant: 'destructive',
      });
      return;
    }

    if (!comment.trim()) return;

    try {
      const newComment = await api.commentOnArtwork(Number(id), comment);
      if (artwork) {
        setArtwork({
          ...artwork,
          comments: [...(artwork.comments || []), newComment],
          comments_count: (artwork.comments_count || 0) + 1,
        });
      }
      setComment('');
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">Loading artwork...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Artwork not found</p>
          <Link to="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Artwork Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden glass-effect hover-glow">
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Artwork Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">{artwork.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                {artwork.artist.avatar && (
                  <img
                    src={artwork.artist.avatar}
                    alt={artwork.artist.username}
                    className="w-10 h-10 rounded-full border-2 border-primary/50"
                  />
                )}
                <div>
                  <p className="font-semibold">{artwork.artist.username}</p>
                  <p className="text-sm text-muted-foreground">Artist</p>
                </div>
              </div>
            </div>

            <Card className="p-6 glass-effect">
              <p className="text-foreground/90 leading-relaxed">{artwork.description}</p>
            </Card>

            <div className="flex gap-4">
              <span className="px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                {artwork.category}
              </span>
              <span className="px-4 py-2 rounded-full bg-accent/20 text-accent border border-accent/30 font-medium">
                {artwork.style}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 py-4">
              <Button
                onClick={handleLike}
                variant="outline"
                className={`flex items-center gap-2 ${isLiked ? 'text-secondary border-secondary' : ''} hover-glow`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{artwork.likes_count}</span>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-5 h-5" />
                <span>{artwork.views}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
                <span>{artwork.comments_count || 0}</span>
              </div>
            </div>

            {/* Comments Section */}
            <Card className="p-6 glass-effect">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Comments
              </h3>

              {/* Add Comment */}
              <div className="mb-6 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-2 bg-background/50"
                  rows={3}
                />
                
                {/* AI Comment Suggestions */}
                {isAuthenticated && (
                  <CommentSuggestions
                    artworkId={Number(id)}
                    onSelectSuggestion={(suggestion) => setComment(suggestion)}
                  />
                )}
                
                <Button onClick={handleComment} className="glow-effect w-full sm:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {artwork.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-background/30">
                    {comment.user.avatar && (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.username}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{comment.user.username}</p>
                      <p className="text-foreground/80 text-sm mt-1">{comment.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                {(!artwork.comments || artwork.comments.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Related Artworks */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold gradient-text mb-8">Related Artworks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((art) => (
                <ArtworkCard key={art.id} artwork={art} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtworkDetail;
