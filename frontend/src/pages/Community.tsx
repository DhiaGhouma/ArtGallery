import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, BookOpen, Sparkles, Send, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import YouTubeTutorials from '@/components/YouTubeTutorials';

interface Discussion {
  id: number;
  title: string;
  category: string;
  author: string;
  replies: number;
  likes: number;
  timestamp: string;
  preview: string;
}

const Community = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [activeTab, setActiveTab] = useState<'discussions' | 'tutorials'>('discussions');

  const discussions: Discussion[] = [
    {
      id: 1,
      title: 'Digital painting techniques for beginners',
      category: 'Tutorials',
      author: 'ArtMaster',
      replies: 24,
      likes: 89,
      timestamp: '2 hours ago',
      preview: 'I wanted to share some tips that helped me improve my digital painting skills...',
    },
    {
      id: 2,
      title: 'Best brushes for abstract art in Procreate',
      category: 'Techniques',
      author: 'AbstractLover',
      replies: 15,
      likes: 67,
      timestamp: '5 hours ago',
      preview: 'After months of experimenting, here are my favorite brush sets...',
    },
    {
      id: 3,
      title: 'Upcoming virtual gallery exhibition - Submit your work!',
      category: 'Exhibitions',
      author: 'GalleryMod',
      replies: 42,
      likes: 134,
      timestamp: '1 day ago',
      preview: "We're hosting our monthly virtual exhibition. Theme: Liquid Dreams...",
    },
    {
      id: 4,
      title: 'Color theory masterclass discussion',
      category: 'Theory',
      author: 'ColorGuru',
      replies: 31,
      likes: 95,
      timestamp: '2 days ago',
      preview: "Let's dive deep into color harmony and how to create vibrant palettes...",
    },
    {
      id: 5,
      title: 'NFT art vs traditional art: Your thoughts?',
      category: 'Discussion',
      author: 'DigitalNative',
      replies: 58,
      likes: 112,
      timestamp: '3 days ago',
      preview: "I'm curious about the community's perspective on NFTs and digital ownership...",
    },
  ];

  const categories = [
    { name: 'All Discussions', icon: MessageSquare },
    { name: 'Tutorials', icon: BookOpen, onClick: () => setActiveTab('tutorials') },
    { name: 'Techniques', icon: Sparkles },
    { name: 'Exhibitions', icon: Users},
  ];

  const handleCategoryClick = (categoryName: string) => {
  if (categoryName === 'All Discussions') {
    navigate('/community-hub');
  } else if (categoryName === 'Techniques') {
    // Redirect to your internal route
    navigate('/technique-encyclopedia');
  } else {
    toast({
      title: 'Category Selected',
      description: `Filtering by ${categoryName}`,
    });
  }
};


  const handleAIChat = () => {
    if (!chatMessage.trim()) return;

    // Simulate AI response
    setAiResponse(
      `Great question! Based on current art trends and techniques, I'd suggest exploring these approaches: 1) Experiment with layering techniques to create depth, 2) Study color theory to enhance your palette choices, 3) Practice daily sketching to improve fundamentals. Would you like specific resources for any of these?`
    );

    toast({
      title: 'AI Assistant',
      description: 'Response generated!',
    });
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-7xl font-bold gradient-text mb-4">
            Community Hub
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect, learn, and grow with fellow artists
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-2xl p-6 sticky top-24 animate-slide-in-right">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Categories</h2>
              <div className="space-y-3">
                {categories.map((cat, index) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleCategoryClick(cat.name)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-all hover-glow group"
                    >
                      <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* AI Chatbot Section */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary animate-glow-pulse" />
                  <h3 className="font-semibold gradient-text">AI Art Assistant</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Ask me anything about art techniques, tools, or inspiration!
                </p>
                <div className="space-y-2">
                  <Input
                    placeholder="Ask a question..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                    className="bg-background/50"
                  />
                  <Button
                    onClick={handleAIChat}
                    className="w-full gap-2 glow-effect"
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                    Ask AI
                  </Button>
                </div>
                {aiResponse && (
                  <div className="mt-3 p-3 rounded-lg bg-background/70 text-sm">
                    {aiResponse}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discussions Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('discussions')}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                  ${activeTab === 'discussions' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-accent/20 hover:bg-accent/30'
                  }
                `}
              >
                <MessageSquare className="w-5 h-5" />
                Discussions
              </button>
              <button
                onClick={() => setActiveTab('tutorials')}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                  ${activeTab === 'tutorials' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-accent/20 hover:bg-accent/30'
                  }
                `}
              >
                <Video className="w-5 h-5" />
                Video Tutorials
              </button>
            </div>

            {/* Tutorials Section */}
            {activeTab === 'tutorials' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold gradient-text mb-2">Learn from the Best</h2>
                  <p className="text-muted-foreground">
                    Curated video tutorials to help you master your craft
                  </p>
                </div>
                <YouTubeTutorials />
              </div>
            )}

            {/* Discussions Section */}
            {activeTab === 'discussions' && (
              <>
            {/* Create New Discussion */}
            {isAuthenticated && (
              <div className="glass-effect rounded-2xl p-6 animate-scale-in">
                <h3 className="text-xl font-semibold mb-4">Start a Discussion</h3>
                <div className="space-y-3">
                  <Input placeholder="Discussion title..." className="bg-background/50" />
                  <Textarea
                    placeholder="Share your thoughts, ask questions, or start a conversation..."
                    rows={3}
                    className="bg-background/50"
                  />
                  <Button className="w-full sm:w-auto glow-effect">
                    Post Discussion
                  </Button>
                </div>
              </div>
            )}

            {/* Discussion Cards */}
            {discussions.map((discussion, index) => (
              <div
                key={discussion.id}
                className="glass-effect rounded-2xl p-6 hover-glow cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                        {discussion.category}
                      </span>
                      <span className="text-sm text-muted-foreground">{discussion.timestamp}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:gradient-text transition-all">
                      {discussion.title}
                    </h3>
                    <p className="text-muted-foreground mb-3">{discussion.preview}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {discussion.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {discussion.replies} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      {discussion.likes} likes
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="group-hover:glow-effect">
                    Join Discussion
                  </Button>
                </div>
              </div>
            ))}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;