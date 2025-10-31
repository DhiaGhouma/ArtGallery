// src/pages/AIArtExperience.tsx - VERSION COMPLÈTE

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Sparkles, Palette, Brain, Wand2, Eye, Heart, 
  Zap, Send, Shuffle, Star, TrendingUp, DollarSign, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

const AIArtExperience = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mood');
  const [selectedMood, setSelectedMood] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string; artworks?: any[]}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [similarityScore, setSimilarityScore] = useState(75);
  const [selectedArtworkId, setSelectedArtworkId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const moods = [
    { id: 'joyful', name: 'Joyful', emoji: '😊', color: '#FFD700', gradient: 'from-yellow-400 to-orange-500' },
    { id: 'calm', name: 'Calm', emoji: '😌', color: '#87CEEB', gradient: 'from-blue-400 to-cyan-500' },
    { id: 'energetic', name: 'Energetic', emoji: '⚡', color: '#FF6347', gradient: 'from-red-500 to-pink-500' },
    { id: 'mysterious', name: 'Mysterious', emoji: '🌙', color: '#9370DB', gradient: 'from-purple-600 to-indigo-700' },
    { id: 'romantic', name: 'Romantic', emoji: '💕', color: '#FF69B4', gradient: 'from-pink-500 to-rose-500' },
    { id: 'melancholic', name: 'Melancholic', emoji: '🌧️', color: '#708090', gradient: 'from-gray-500 to-slate-600' },
  ];

  const colorPalettes = [
    { name: 'Sunset', colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF'] },
    { name: 'Ocean', colors: ['#0A2463', '#3E92CC', '#1E5F74', '#FAFFFD', '#247BA0'] },
    { name: 'Forest', colors: ['#2D4A2B', '#5C7457', '#8BAA7D', '#B5D99C', '#E8F3D6'] },
    { name: 'Vintage', colors: ['#8B4513', '#D2691E', '#F4A460', '#DEB887', '#FFE4B5'] },
    { name: 'Neon', colors: ['#FF10F0', '#00F0FF', '#FFFF00', '#FF00FF', '#00FF00'] },
  ];

  const { data: popularArtworks = [], isLoading: loadingArtworks } = useQuery({
    queryKey: ['popular-artworks'],
    queryFn: () => api.getArtworks({ sort: '-likes_count' }),
  });

  const moodMutation = useMutation({
    mutationFn: (mood: string) => api.aiMoodMatcher(mood),
    onSuccess: (data) => {
      toast({
        title: '✨ Mood Matched!',
        description: `Found ${data.count} artworks for ${data.mood} mood`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to match mood',
        variant: 'destructive',
      });
    },
  });

  const curatorMutation = useMutation({
    mutationFn: (message: string) => api.aiCuratorChat(message),
    onSuccess: (data) => {
      const aiMessage = {
        role: 'ai',
        content: data.message,
        artworks: data.artworks
      };
      setChatMessages(prev => [...prev, aiMessage]);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get curator response',
        variant: 'destructive',
      });
    },
  });

  const colorMutation = useMutation({
    mutationFn: (colors: string[]) => api.aiColorAnalyzer(colors),
    onSuccess: () => {
      toast({
        title: '🎨 Colors Analyzed!',
        description: 'Found matching artworks',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze colors',
        variant: 'destructive',
      });
    },
  });

  const { data: similarArtworks } = useQuery({
    queryKey: ['similar-artworks', selectedArtworkId, similarityScore],
    queryFn: () => selectedArtworkId ? api.aiSimilaritySearch(selectedArtworkId, similarityScore) : null,
    enabled: !!selectedArtworkId,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedMood) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{x: number; y: number; vx: number; vy: number; size: number}> = [];
    const mood = moods.find(m => m.id === selectedMood);
    if (!mood) return;
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = mood.color;
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [selectedMood]);

  const handleMoodSelect = (moodId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to use AI features',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    setSelectedMood(moodId);
    moodMutation.mutate(moodId);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to chat with curator',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    const userMessage = { role: 'user', content: chatInput, artworks: [] };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    curatorMutation.mutate(chatInput);
  };

  const handleColorSelect = (colors: string[]) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to explore colors',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    setSelectedColors(colors);
    colorMutation.mutate(colors);
  };

  if (loadingArtworks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200">Loading AI Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-3xl"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
              <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                AI Art Experience
              </h1>
              <Wand2 className="w-12 h-12 text-pink-400 animate-bounce" />
            </div>
            <p className="text-xl text-purple-200">Discover art through the power of artificial intelligence</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { id: 'mood', icon: Heart, label: 'Mood Matcher' },
              { id: 'curator', icon: Brain, label: 'AI Curator' },
              { id: 'colors', icon: Palette, label: 'Color Explorer' },
              { id: 'similar', icon: Shuffle, label: 'Find Similar' },
            ].map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`gap-2 px-6 py-6 text-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl shadow-purple-500/50 scale-110'
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        {activeTab === 'mood' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">How are you feeling today?</h2>
              <p className="text-purple-200">Select your mood and discover art that resonates</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  disabled={moodMutation.isPending}
                  className={`relative p-8 rounded-3xl transition-all duration-500 transform hover:scale-110 ${
                    selectedMood === mood.id
                      ? `bg-gradient-to-br ${mood.gradient} shadow-2xl scale-110`
                      : 'bg-white/10 backdrop-blur-md hover:bg-white/20'
                  }`}
                >
                  <div className="text-6xl mb-3">{mood.emoji}</div>
                  <div className="text-white font-semibold text-lg">{mood.name}</div>
                  {selectedMood === mood.id && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                      <Star className="w-5 h-5 text-yellow-900" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedMood && (
              <div className="relative mb-12 rounded-3xl overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-64 bg-black/30 backdrop-blur-md" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    {moodMutation.isPending ? (
                      <>
                        <Loader2 className="w-16 h-16 text-white mx-auto mb-4 animate-spin" />
                        <p className="text-2xl text-white font-bold">Analyzing...</p>
                      </>
                    ) : (
                      <>
                        <Zap className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
                        <p className="text-2xl text-white font-bold">Perfect matches!</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {moodMutation.data?.artworks && moodMutation.data.artworks.length > 0 && (
              <div>
                <h3 className="text-3xl font-bold text-white mb-8 text-center">
                  Perfect for your {selectedMood} mood
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {moodMutation.data.artworks.map((artwork: any) => (
                    <Link key={artwork.id} to={`/artwork/${artwork.id}`} className="group bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-105">
                      <div className="relative h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        {artwork.image ? (
                          <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Eye className="w-24 h-24 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                      <div className="p-6">
                        <h4 className="text-2xl font-bold text-white mb-2">{artwork.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold text-yellow-400 flex items-center gap-1">
                            <DollarSign className="w-6 h-6" />
                            {artwork.price || 0}
                          </span>
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">View</Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curator' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">AI Art Curator</h2>
              <p className="text-purple-200">Chat to discover artworks</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
              <div className="h-96 overflow-y-auto mb-6 space-y-4 pr-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <Brain className="w-20 h-20 text-purple-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-purple-200 text-lg mb-4">Start a conversation!</p>
                    <div className="space-y-2">
                      <p className="text-sm text-purple-300">Try:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {["Show abstract art", "I like minimalist", "Something inspiring"].map((prompt, i) => (
                          <Button key={i} onClick={() => setChatInput(prompt)} variant="outline" className="bg-white/5 border-purple-400/30 hover:bg-white/10 text-purple-200">
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/20'} rounded-2xl p-4`}>
                      <p className="text-white mb-2">{msg.content}</p>
                      {msg.artworks && msg.artworks.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {msg.artworks.map((art: any) => (
                            <Link key={art.id} to={`/artwork/${art.id}`} className="bg-black/30 rounded-lg p-2 hover:bg-black/50 transition">
                              <div className="h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded mb-2 overflow-hidden">
                                {art.image ? (
                                  <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Eye className="w-8 h-8 text-white/50" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-white truncate">{art.title}</p>
                              <p className="text-xs text-yellow-400">${art.price || 0}</p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {curatorMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-white/20 rounded-2xl p-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()} placeholder="Describe what you're looking for..." className="flex-1 bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300 h-14 text-lg" />
                <Button onClick={handleChatSubmit} disabled={curatorMutation.isPending || !chatInput.trim()} className="bg-gradient-to-r from-purple-600 to-pink-600 h-14 px-8">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Color Harmony</h2>
              <p className="text-purple-200">Find artworks by color palette</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              {colorPalettes.map((palette, idx) => (
                <button key={idx} onClick={() => handleColorSelect(palette.colors)} disabled={colorMutation.isPending} className={`p-6 rounded-3xl transition-all duration-500 hover:scale-105 ${JSON.stringify(selectedColors) === JSON.stringify(palette.colors) ? 'bg-white/20 shadow-2xl scale-105' : 'bg-white/10'}`}>
                  <div className="flex gap-2 mb-4">
                    {palette.colors.map((color, i) => (
                      <div key={i} className="flex-1 h-16 rounded-lg shadow-lg" style={{backgroundColor: color}} />
                    ))}
                  </div>
                  <p className="text-white font-semibold text-lg">{palette.name}</p>
                </button>
              ))}
            </div>

            {colorMutation.data?.artworks && colorMutation.data.artworks.length > 0 && (
              <div>
                <h3 className="text-3xl font-bold text-white mb-8 text-center">Matching artworks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {colorMutation.data.artworks.map((artwork: any) => (
                    <Link key={artwork.id} to={`/artwork/${artwork.id}`} className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105">
                      <div className="h-80">
                        {artwork.image ? (
                          <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <Palette className="w-24 h-24 text-white/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h4 className="text-2xl font-bold text-white mb-2">{artwork.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold text-yellow-400">${artwork.price || 0}</span>
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">View</Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Find Similar</h2>
              <p className="text-purple-200">Select an artwork to find similar pieces</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl mb-12">
              <label className="block text-white font-semibold mb-3">Select artwork:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {popularArtworks.slice(0, 4).map((art: any) => (
                  <button key={art.id} onClick={() => setSelectedArtworkId(art.id)} className={`rounded-xl overflow-hidden transition-all ${selectedArtworkId === art.id ? 'ring-4 ring-purple-500 scale-105' : 'hover:scale-105'}`}>
                    <div className="h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                      {art.image ? (
                        <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="bg-black/50 p-2">
                      <p className="text-white text-xs truncate">{art.title}</p>
                    </div>
                  </button>
                ))}
              </div>

              <label className="block text-white font-semibold mb-3">Similarity:</label>
              <div className="flex items-center gap-4">
                <Slider value={[similarityScore]} onValueChange={(v) => setSimilarityScore(v[0])} max={100} step={1} className="flex-1" />
                <span className="text-2xl font-bold text-purple-400 min-w-[60px]">{similarityScore}%</span>
              </div>
            </div>

            {similarArtworks?.similar_artworks && similarArtworks.similar_artworks.length > 0 && (
              <div>
                <h3 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                  Similar Artworks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {similarArtworks.similar_artworks.map((art: any) => (
                    <Link key={art.id} to={`/artwork/${art.id}`} className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/50 transition-all">
                      <div className="relative">
                        <div className="h-64">
                          {art.image ? (
                            <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                              <Eye className="w-20 h-20 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                          {art.similarity_score}% Match
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="text-2xl font-bold text-white mb-2">{art.title}</h4>
                        <p className="text-purple-200 text-sm mb-4">by {art.artist.username}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold text-yellow-400">${art.price}</span>
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">View</Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIArtExperience;