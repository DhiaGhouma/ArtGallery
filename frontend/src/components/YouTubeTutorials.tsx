import { useState, useEffect } from 'react';
import { Play, Clock, Eye, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  searchYouTubeTutorials,
  tutorialCategories,
  formatViewCount,
  getEmbedUrl,
  getWatchUrl,
  YouTubeVideo,
} from '@/lib/youtube';

const YouTubeTutorials = () => {
  const [selectedCategory, setSelectedCategory] = useState(tutorialCategories[0]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadTutorials();
  }, [selectedCategory]);

  const loadTutorials = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchYouTubeTutorials(selectedCategory.query, 12);
      setVideos(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tutorials');
      console.error('Error loading tutorials:', err);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setShowPlayer(true);
  };

  const closePlayer = () => {
    setShowPlayer(false);
    setSelectedVideo(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        {tutorialCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-4 py-2 rounded-full font-medium transition-all duration-300
              flex items-center gap-2
              ${
                selectedCategory.id === category.id
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-accent/20 hover:bg-accent/30 border border-border'
              }
            `}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <p className="text-destructive text-center">
            ⚠️ {error}
            <br />
            <span className="text-sm mt-2 block">
              Please check your YouTube API key configuration in .env file
            </span>
          </p>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-video bg-accent/20" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-accent/20 rounded w-3/4" />
                <div className="h-3 bg-accent/20 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Videos Grid */}
      {!loading && !error && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {videos.map((video, index) => (
            <Card
              key={video.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border-border hover:border-primary/50"
              onClick={() => openVideo(video)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-accent/10">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                  </div>
                </div>

                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-white text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {video.duration}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                  {video.title}
                </h3>
                
                <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {video.viewCount && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViewCount(video.viewCount)}
                    </span>
                  )}
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && videos.length === 0 && (
        <Card className="p-12 text-center">
          <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No tutorials found</p>
        </Card>
      )}

      {/* Video Player Modal */}
      {showPlayer && selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closePlayer}
        >
          <div
            className="bg-card rounded-2xl max-w-5xl w-full border border-primary/30 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold line-clamp-1 flex-1 pr-4">
                {selectedVideo.title}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getWatchUrl(selectedVideo.id), '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in YouTube
                </Button>
                <button
                  onClick={closePlayer}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black">
              <iframe
                width="100%"
                height="100%"
                src={getEmbedUrl(selectedVideo.id)}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Details */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{selectedVideo.channelTitle}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {selectedVideo.viewCount && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(selectedVideo.viewCount)} views
                    </span>
                  )}
                  <span>{formatDate(selectedVideo.publishedAt)}</span>
                </div>
              </div>
              
              {selectedVideo.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedVideo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeTutorials;
