import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, ThumbsUp, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Discussion {
  id: number;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  replies: number;
  likes: number;
}

interface Reply {
  id: number;
  discussionId: number;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

const CommunityHub = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // States
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  // Charger les discussions depuis Django API
  useEffect(() => {
    loadDiscussions();
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
      setGroqApiKey(savedKey);
    }
  }, []);

  const loadDiscussions = async () => {
    try {
      // TODO: Remplacer par votre endpoint Django
      // const response = await fetch('/api/discussions/');
      // const data = await response.json();
      // setDiscussions(data);
      
      // Données de démonstration
      setDiscussions([
        {
          id: 1,
          title: 'Digital painting techniques for beginners',
          content: 'I wanted to share some tips that helped me improve my digital painting skills. First, always use layers...',
          author: 'ArtMaster',
          timestamp: '2 hours ago',
          replies: 12,
          likes: 45,
        },
        {
          id: 2,
          title: 'Best brushes for abstract art in Procreate',
          content: 'After months of experimenting, here are my favorite brush sets for creating stunning abstract pieces...',
          author: 'AbstractLover',
          timestamp: '5 hours ago',
          replies: 8,
          likes: 32,
        },
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load discussions',
        variant: 'destructive',
      });
    }
  };

  const loadReplies = async (discussionId: number) => {
    try {
      // TODO: Remplacer par votre endpoint Django
      // const response = await fetch(`/api/discussions/${discussionId}/replies/`);
      // const data = await response.json();
      // setReplies(data);
      
      // Données de démonstration
      setReplies([
        {
          id: 1,
          discussionId,
          author: 'ColorGuru',
          content: 'Great tips! I would also add that understanding color theory is crucial.',
          timestamp: '1 hour ago',
          likes: 8,
        },
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load replies',
        variant: 'destructive',
      });
    }
  };

  // Créer une nouvelle discussion
  const createDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // TODO: Remplacer par votre endpoint Django
      // const response = await fetch('/api/discussions/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title: newTitle,
      //     content: newContent,
      //   }),
      // });
      // const data = await response.json();
      
      const newDiscussion: Discussion = {
        id: Date.now(),
        title: newTitle,
        content: newContent,
        author: user?.username || 'Anonymous',
        timestamp: 'Just now',
        replies: 0,
        likes: 0,
      };
      
      setDiscussions([newDiscussion, ...discussions]);
      setNewTitle('');
      setNewContent('');
      
      toast({
        title: 'Success',
        description: 'Discussion created!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create discussion',
        variant: 'destructive',
      });
    }
  };

  // Ajouter une réponse
  const addReply = async () => {
    if (!replyContent.trim() || !selectedDiscussion) return;

    try {
      // TODO: Remplacer par votre endpoint Django
      const newReply: Reply = {
        id: Date.now(),
        discussionId: selectedDiscussion.id,
        author: user?.username || 'Anonymous',
        content: replyContent,
        timestamp: 'Just now',
        likes: 0,
      };
      
      setReplies([...replies, newReply]);
      setReplyContent('');
      
      toast({
        title: 'Success',
        description: 'Reply added!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add reply',
        variant: 'destructive',
      });
    }
  };

  // Appel API Groq pour l'IA
  const callGroqAPI = async (prompt: string) => {
    if (!groqApiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your Groq API key',
        variant: 'destructive',
      });
      setShowApiInput(true);
      return null;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for an art community. Provide creative, inspiring, and practical advice.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) throw new Error('API call failed');

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Check your API key.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleAIChat = async () => {
    if (!aiMessage.trim()) return;

    setIsLoadingAI(true);
    const result = await callGroqAPI(aiMessage);
    
    if (result) {
      setAiResponse(result);
    }
    
    setIsLoadingAI(false);
  };

  const saveApiKey = () => {
    localStorage.setItem('groq_api_key', groqApiKey);
    toast({
      title: 'Success',
      description: 'API key saved!',
    });
    setShowApiInput(false);
  };

  const openDiscussion = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    loadReplies(discussion.id);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/community')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
          <h1 className="text-5xl font-bold gradient-text mb-2">All Discussions</h1>
          <p className="text-xl text-muted-foreground">
            Join conversations and get AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Discussion List & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create New Discussion */}
            {isAuthenticated && !selectedDiscussion && (
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Start a New Discussion</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Discussion title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-background/50"
                  />
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4}
                    className="bg-background/50"
                  />
                  <Button onClick={createDiscussion} className="glow-effect">
                    <Send className="w-4 h-4 mr-2" />
                    Post Discussion
                  </Button>
                </div>
              </div>
            )}

            {/* Discussion View */}
            {selectedDiscussion ? (
              <div className="space-y-6">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDiscussion(null)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Discussions
                </Button>

                {/* Discussion Detail */}
                <div className="glass-effect rounded-2xl p-6">
                  <h2 className="text-3xl font-bold mb-4">{selectedDiscussion.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedDiscussion.author}
                    </span>
                    <span>{selectedDiscussion.timestamp}</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {selectedDiscussion.likes}
                    </span>
                  </div>
                  <p className="text-lg mb-6">{selectedDiscussion.content}</p>
                </div>

                {/* Replies */}
                <div className="glass-effect rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Replies ({replies.length})
                  </h3>
                  <div className="space-y-4 mb-6">
                    {replies.map((reply) => (
                      <div key={reply.id} className="border-l-4 border-primary/50 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold">{reply.author}</span>
                          <span className="text-sm text-muted-foreground">{reply.timestamp}</span>
                        </div>
                        <p>{reply.content}</p>
                        <button className="text-sm text-primary mt-2 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {reply.likes}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Reply */}
                  {isAuthenticated && (
                    <div className="space-y-3 pt-4 border-t">
                      <Textarea
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                        className="bg-background/50"
                      />
                      <Button onClick={addReply} className="glow-effect">
                        <Send className="w-4 h-4 mr-2" />
                        Post Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Discussion List */
              discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  onClick={() => openDiscussion(discussion)}
                  className="glass-effect rounded-2xl p-6 hover-glow cursor-pointer group"
                >
                  <h3 className="text-2xl font-semibold mb-2 group-hover:gradient-text transition-all">
                    {discussion.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {discussion.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {discussion.author}
                    </span>
                    <span>{discussion.timestamp}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {discussion.replies}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {discussion.likes}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* AI Assistant Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary animate-glow-pulse" />
                <h3 className="text-xl font-bold gradient-text">AI Assistant</h3>
              </div>

              {/* API Key Input */}
              {(!groqApiKey || showApiInput) && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">
                    Get free API key at{' '}
                    <a
                      href="https://console.groq.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      console.groq.com
                    </a>
                  </p>
                  <Input
                    type="password"
                    placeholder="Groq API Key..."
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    className="mb-2"
                  />
                  <Button onClick={saveApiKey} size="sm" className="w-full">
                    Save Key
                  </Button>
                </div>
              )}

              {groqApiKey && !showApiInput && (
                <button
                  onClick={() => setShowApiInput(true)}
                  className="text-xs text-primary underline mb-4"
                >
                  Change API Key
                </button>
              )}

              <p className="text-sm text-muted-foreground mb-4">
                Get AI help with discussions, art techniques, or creative ideas!
              </p>

              <div className="space-y-3">
                <Textarea
                  placeholder="Ask AI anything..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  rows={4}
                  className="bg-background/50"
                />
                <Button
                  onClick={handleAIChat}
                  disabled={isLoadingAI || !groqApiKey}
                  className="w-full glow-effect"
                >
                  {isLoadingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask AI
                    </>
                  )}
                </Button>
              </div>

              {aiResponse && (
                <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">AI Response:</span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{aiResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;