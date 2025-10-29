import { useState } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CommentSuggestionsProps {
  artworkId: number;
  onSelectSuggestion: (suggestion: string) => void;
}

const CommentSuggestions = ({ artworkId, onSelectSuggestion }: CommentSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.getCommentSuggestions(artworkId);
      setSuggestions(response.suggestions);
      setShowSuggestions(true);
      
      toast({
        title: 'Suggestions Generated! ✨',
        description: 'Click a suggestion to use it',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate suggestions',
        variant: 'destructive',
      });
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    toast({
      title: 'Suggestion Added',
      description: 'Feel free to edit before posting!',
    });
  };

  return (
    <div className="space-y-3">
      {/* AI Suggestion Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={generateSuggestions}
          disabled={loading}
          className="gap-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-primary/30 hover:border-primary/50 transition-all duration-300"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI Suggestions
            </>
          )}
        </Button>

        {showSuggestions && suggestions.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            New
          </Button>
        )}
      </div>

      {/* Suggestions Display */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            AI-powered suggestions (click to use):
          </p>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 group"
              >
                <p className="text-sm text-foreground/90 group-hover:text-foreground leading-relaxed">
                  {suggestion}
                </p>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/70 italic">
            💡 Tip: You can edit the suggestion before posting
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentSuggestions;
