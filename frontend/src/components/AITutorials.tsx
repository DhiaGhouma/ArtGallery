import { useState, useEffect } from 'react';
import { BookOpen, Sparkles, ChevronRight, Lightbulb, Package, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

interface TutorialCategory {
  id: string;
  name: string;
  icon: string;
  topics: string[];
}

interface Tutorial {
  title: string;
  introduction: string;
  materials: string[];
  steps: {
    step: number;
    title: string;
    description: string;
  }[];
  tips: string[];
  conclusion: string;
  topic: string;
  skill_level: string;
}

const AITutorials = () => {
  const [categories, setCategories] = useState<TutorialCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [language, setLanguage] = useState<'en' | 'ar' | 'fr'>('en');
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.getTutorialCategories();
      setCategories(response.categories);
      if (response.categories.length > 0) {
        setSelectedCategory(response.categories[0]);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load tutorial categories');
    }
  };

  const generateTutorial = async (topic: string) => {
    setLoading(true);
    setError(null);
    setTutorial(null);
    
    try {
      const response = await api.generateTutorial({
        topic,
        skill_level: skillLevel,
        language: language,
      });
      
      if (response.success) {
        setTutorial(response.tutorial);
        setSelectedTopic(topic);
      }
    } catch (err: any) {
      console.error('Error generating tutorial:', err);
      setError(err.message || 'Failed to generate tutorial');
    } finally {
      setLoading(false);
    }
  };

  const resetTutorial = () => {
    setTutorial(null);
    setSelectedTopic(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Generated Tutorials</h2>
            <p className="text-sm text-muted-foreground">
              Personalized learning content powered by AI
            </p>
          </div>
        </div>

        {/* Skill Level & Language Selectors */}
        {!tutorial && (
          <div className="flex flex-col gap-3">
            {/* Skill Level */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-muted-foreground self-center mr-2">Level:</span>
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <Button
                  key={level}
                  variant={skillLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSkillLevel(level)}
                  className="capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>

            {/* Language */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-muted-foreground self-center mr-2">Language:</span>
              {[
                { code: 'en', label: 'EN' },
                { code: 'ar', label: 'AR' },
                { code: 'fr', label: 'FR' }
              ].map((lang) => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage(lang.code as 'en' | 'ar' | 'fr')}
                  className="gap-2"
                >
                  <span>{lang.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tutorial View */}
      {tutorial ? (
        <div className="space-y-6 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Back Button */}
          <Button variant="outline" onClick={resetTutorial} className="gap-2">
            <ChevronRight className="w-4 h-4 rotate-180" />
            {language === 'ar' ? 'العودة إلى المواضيع' : language === 'fr' ? 'Retour aux sujets' : 'Back to Topics'}
          </Button>

          {/* Tutorial Content */}
          <Card className="p-8 space-y-6">
            {/* Title & Meta */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="capitalize">{tutorial.skill_level} Level</span>
                <span>•</span>
                <span>{tutorial.topic}</span>
              </div>
              <h1 className="text-3xl font-bold">{tutorial.title}</h1>
            </div>

            {/* Introduction */}
            <div className="prose prose-sm max-w-none">
              <p className="text-lg text-muted-foreground">{tutorial.introduction}</p>
            </div>

            {/* Materials */}
            <div className="bg-accent/20 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Materials Needed</h3>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tutorial.materials.map((material, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-xl">Step-by-Step Guide</h3>
              <div className="space-y-6">
                {tutorial.steps.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-lg">{step.title}</h4>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Pro Tips</h3>
              </div>
              <ul className="space-y-2">
                {tutorial.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conclusion */}
            <div className="prose prose-sm max-w-none pt-6 border-t">
              <p className="text-muted-foreground italic">{tutorial.conclusion}</p>
            </div>
          </Card>
        </div>
      ) : (
        /* Topic Selection */
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 rounded-full font-medium transition-all duration-300
                  flex items-center gap-2
                  ${
                    selectedCategory?.id === category.id
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

          {/* Topics Grid */}
          {selectedCategory && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCategory.topics.map((topic, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-border hover:border-primary/50 group"
                  onClick={() => !loading && generateTutorial(topic)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {topic}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {skillLevel} Level
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-lg font-medium">Generating your tutorial...</p>
                <p className="text-sm text-muted-foreground">This may take a few seconds</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-6 bg-destructive/10 border-destructive/20">
              <p className="text-destructive text-center">⚠️ {error}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AITutorials;
