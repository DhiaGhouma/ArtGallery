import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Upload as UploadIcon, Image as ImageIcon, Loader2, DollarSign, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const Upload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [price, setPrice] = useState('0');
  const [inStock, setInStock] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // AI Description Generation Mutation
  const generateDescriptionMutation = useMutation({
    mutationFn: (data: { title: string; category?: string; style?: string }) => 
      api.generateDescription(data),
    onSuccess: (data) => {
      setGeneratedDescriptions(data.descriptions);
      toast({
        title: 'AI Generated!',
        description: `Generated ${data.descriptions.length} description options`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate descriptions',
        variant: 'destructive',
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = () => {
    if (!title) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title first',
        variant: 'destructive',
      });
      return;
    }

    generateDescriptionMutation.mutate({
      title,
      category: category || undefined,
      style: style || undefined,
    });
  };

  const handleSelectDescription = (desc: string) => {
    setDescription(desc);
    setGeneratedDescriptions([]);
    toast({
      title: 'Description Selected',
      description: 'You can edit it if needed',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to upload artworks',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!image || !title || !category || !style) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append('image', image);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('style', style);
      formData.append('price', price);
      formData.append('in_stock', inStock.toString());

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const artwork = await api.uploadArtwork(formData);
      
      clearInterval(interval);
      setProgress(100);

      toast({
        title: 'Success!',
        description: 'Your artwork has been uploaded successfully',
      });

      setTimeout(() => {
        navigate(`/artwork/${artwork.id}`);
      }, 1000);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload artwork. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block p-4 rounded-2xl bg-primary/10 mb-4">
            <UploadIcon className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Upload Your Masterpiece
          </h1>
          <p className="text-xl text-muted-foreground">
            Share your creativity with the world
          </p>
        </div>

        <Card className="p-8 glass-effect animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label htmlFor="image" className="text-lg font-semibold mb-2 block">
                Artwork Image *
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all hover-glow ${
                  preview ? 'border-primary' : 'border-border'
                }`}
              >
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-96 mx-auto rounded-xl object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-4"
                      onClick={() => {
                        setImage(null);
                        setPreview('');
                      }}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Click to upload or drag and drop
                    </p>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      Select Image
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-lg font-semibold mb-2 block">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter artwork title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
                required
              />
            </div>

            {/* Category & Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category" className="text-lg font-semibold mb-2 block">
                  Category *
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Digital">Digital Art</SelectItem>
                    <SelectItem value="Painting">Painting</SelectItem>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="3D">3D Art</SelectItem>
                    <SelectItem value="Abstract">Abstract</SelectItem>
                    <SelectItem value="Landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="style" className="text-lg font-semibold mb-2 block">
                  Style *
                </Label>
                <Select value={style} onValueChange={setStyle} required>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="digital">Digital Art</SelectItem>
                    <SelectItem value="generative">Generative Art</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="mixed">Mixed Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description with AI Generator */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="description" className="text-lg font-semibold">
                  Description
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={!title || generateDescriptionMutation.isPending}
                  className="gap-2"
                >
                  {generateDescriptionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>

              {/* AI Generated Descriptions */}
              {generatedDescriptions.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ✨ AI Generated Descriptions (click to use):
                  </p>
                  {generatedDescriptions.map((desc, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectDescription(desc)}
                      className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 cursor-pointer transition-all border border-primary/20 hover:border-primary/40"
                    >
                      <p className="text-sm">{desc}</p>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                id="description"
                placeholder="Describe your artwork... or generate with AI"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-background/50"
              />
              <p className="text-sm text-muted-foreground mt-1">
                💡 Tip: Fill in title, category, and style first, then click "Generate with AI"
              </p>
            </div>

            {/* Price & In Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price" className="text-lg font-semibold mb-2 block">
                  Price (DT)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-background/50 pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Set to 0 for free artworks
                </p>
              </div>

              <div>
                <Label htmlFor="in_stock" className="text-lg font-semibold mb-2 block">
                  Availability
                </Label>
                <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border">
                  <div>
                    <p className="font-medium">In Stock</p>
                    <p className="text-sm text-muted-foreground">
                      {inStock ? 'Available for purchase' : 'Not available'}
                    </p>
                  </div>
                  <Switch
                    id="in_stock"
                    checked={inStock}
                    onCheckedChange={setInStock}
                  />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={uploading}
              className="w-full text-lg py-6 glow-effect"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5 mr-2" />
                  Upload Artwork
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Upload;