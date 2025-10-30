import { useState } from 'react';
import { BookOpen, Sparkles, Search, Loader2, ChevronRight, Palette, Brush, Layers, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const TechniqueEncyclopedia = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // Popular technique categories
  const categories = [
    { name: 'Painting Techniques', icon: Palette, color: 'from-pink-500 to-rose-500' },
    { name: 'Brush Techniques', icon: Brush, color: 'from-blue-500 to-cyan-500' },
    { name: 'Layering & Blending', icon: Layers, color: 'from-purple-500 to-indigo-500' },
    { name: 'Tool Recommendations', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
  ];

  // Quick search suggestions
  const quickSearches = [
    'Explain glazing technique',
    'How to blend in Procreate',
    'Best paper for watercolors',
    'Digital painting tips for beginners',
    'Color theory basics',
    'How to create realistic shadows',
    'Acrylic pouring technique',
    'Best brushes for portraits',
  ];

  const fetchTechniqueInfo = async (userQuery: string) => {
  setLoading(true);
  setResponse(null);

  try {
    const DJANGO_API_URL = 'http://localhost:8000/generate-technique/';

    const prompt = `You are an expert art instructor and encyclopedia. Provide a detailed, educational response about: "${userQuery}"

Please structure your response with:
1. Brief definition/overview
2. Step-by-step tutorial or explanation
3. Tips and best practices
4. Recommended tools/materials (if applicable)
5. Common mistakes to avoid

Keep the response informative, clear, and beginner-friendly.`;

    const res = await fetch(DJANGO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      throw new Error('API request failed');
    }

    const data = await res.json();

    // FIX: data is an object, not an array
    const aiResponse = data.generated_text || 'No response generated';

    setResponse({
      query: userQuery,
      content: aiResponse,
      timestamp: new Date().toLocaleTimeString(),
    });

    toast({
      title: '✨ Technique Loaded',
      description: 'AI has generated your art tutorial!',
    });
  } catch (error) {
    console.error('Error:', error);

    // Demo fallback
    setResponse({
      query: userQuery,
      content: `**${userQuery}**

📚 **Overview:**
This is a demonstration response. To use the real AI, you need to:
1. Get a free API key from Hugging Face (huggingface.co)
3. The AI will then provide detailed, personalized art technique tutorials!

🎨 **What the AI will provide:**
- Detailed technique explanations
- Step-by-step tutorials
- Tool and material recommendations
- Pro tips and common mistakes to avoid
- Beginner-friendly guidance

🔑 **To get started:**
Visit https://huggingface.co/settings/tokens to get your free API key.`,
      timestamp: new Date().toLocaleTimeString(),
    });

    toast({
      title: '⚠️ Demo Mode',
      description: 'Add your Hugging Face API key to enable real AI responses',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};


  const handleSearch = () => {
    if (!query.trim()) {
      toast({
        title: 'Empty query',
        description: 'Please enter a technique or question',
        variant: 'destructive',
      });
      return;
    }
    fetchTechniqueInfo(query);
  };

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    fetchTechniqueInfo(searchTerm);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-12 h-12 text-primary animate-glow-pulse" />
            <h1 className="text-5xl sm:text-7xl font-bold gradient-text">
              Art Technique Encyclopedia
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ask anything about art techniques, get instant AI-powered tutorials and recommendations
          </p>
        </div>

        {/* Search Bar */}
        <div className="glass-effect rounded-2xl p-8 mb-8 animate-scale-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-glow-pulse" />
            <h2 className="text-2xl font-bold gradient-text">Ask the AI Art Tutor</h2>
          </div>
          
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="e.g., How to blend colors in oil painting..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-14 text-lg bg-background/50"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-14 px-8 glow-effect text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Ask AI
                </>
              )}
            </Button>
          </div>

          {/* Quick Searches */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search)}
                  disabled={loading}
                  className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-sm transition-all hover:scale-105 hover-glow disabled:opacity-50"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <div
                key={index}
                className="glass-effect rounded-xl p-6 hover-glow cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2 group-hover:gradient-text transition-all">
                  {cat.name}
                </h3>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            );
          })}
        </div>

        {/* AI Response */}
        {response && (
          <div className="glass-effect rounded-2xl p-8 animate-scale-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold gradient-text">AI Art Tutor</h3>
                  <span className="text-sm text-muted-foreground">{response.timestamp}</span>
                </div>
                <p className="text-muted-foreground">
                  Responding to: <span className="text-foreground font-medium">"{response.query}"</span>
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="bg-background/50 rounded-xl p-6 whitespace-pre-wrap leading-relaxed">
                {response.content}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Was this helpful?</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  👍 Helpful
                </Button>
                <Button variant="outline" size="sm">
                  👎 Not Helpful
                </Button>
                <Button variant="outline" size="sm" className="ml-auto">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Save to Library
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!response && !loading && (
          <div className="glass-effect rounded-2xl p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3 gradient-text">
              Ready to Learn?
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Ask any question about art techniques, tools, or materials. Our AI tutor will provide detailed tutorials and recommendations instantly!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-sm">Step-by-step guides</span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-sm">Tool recommendations</span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-sm">Pro tips</span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-sm">Common mistakes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechniqueEncyclopedia;