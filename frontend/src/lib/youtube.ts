// YouTube Data API v3 Service
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
}

export interface TutorialCategory {
  id: string;
  name: string;
  query: string;
  icon: string;
}

// Predefined tutorial categories for art
export const tutorialCategories: TutorialCategory[] = [
  {
    id: 'drawing-basics',
    name: 'Drawing Basics',
    query: 'how to draw tutorial for beginners',
    icon: '✏️',
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    query: 'digital art procreate tutorial',
    icon: '🎨',
  },
  {
    id: '3d-modeling',
    name: '3D Modeling',
    query: 'blender 3d modeling tutorial beginners',
    icon: '🎭',
  },
  {
    id: 'painting',
    name: 'Painting',
    query: 'painting tutorial acrylic watercolor',
    icon: '🖌️',
  },
  {
    id: 'character-design',
    name: 'Character Design',
    query: 'character design tutorial',
    icon: '👤',
  },
  {
    id: 'color-theory',
    name: 'Color Theory',
    query: 'color theory for artists tutorial',
    icon: '🌈',
  },
  {
    id: 'perspective',
    name: 'Perspective',
    query: 'perspective drawing tutorial',
    icon: '📐',
  },
  {
    id: 'anatomy',
    name: 'Anatomy',
    query: 'drawing anatomy tutorial',
    icon: '🦴',
  },
];

/**
 * Search YouTube for tutorial videos
 */
export const searchYouTubeTutorials = async (
  query: string,
  maxResults: number = 12
): Promise<YouTubeVideo[]> => {
  try {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
      console.error('YouTube API key not configured');
      return [];
    }

    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', query);
    url.searchParams.append('type', 'video');
    url.searchParams.append('maxResults', maxResults.toString());
    url.searchParams.append('order', 'relevance');
    url.searchParams.append('videoDuration', 'medium'); // 4-20 minutes
    url.searchParams.append('videoEmbeddable', 'true');
    url.searchParams.append('key', YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch YouTube videos');
    }

    const data = await response.json();

    // Transform YouTube API response to our format
    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube tutorials:', error);
    throw error;
  }
};

/**
 * Get video details including statistics
 */
export const getVideoDetails = async (videoId: string): Promise<YouTubeVideo | null> => {
  try {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
      console.error('YouTube API key not configured');
      return null;
    }

    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.append('part', 'snippet,contentDetails,statistics');
    url.searchParams.append('id', videoId);
    url.searchParams.append('key', YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }

    const data = await response.json();
    
    if (data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails.duration,
      viewCount: item.statistics.viewCount,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
};

/**
 * Format YouTube duration (PT4M13S) to readable format (4:13)
 */
export const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '0').replace('S', '');

  if (hours) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
  return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
};

/**
 * Format view count (1234567 -> 1.2M)
 */
export const formatViewCount = (count: string): string => {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return count;
};

/**
 * Get embed URL for a video
 */
export const getEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Get watch URL for a video
 */
export const getWatchUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};
