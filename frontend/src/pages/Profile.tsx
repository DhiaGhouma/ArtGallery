import { useState, useEffect } from 'react';
import { Camera, Mail, MapPin, Globe, Edit2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Artwork } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      loadUserArtworks();
    }
  }, [user]);

  const loadUserArtworks = async () => {
    try {
      setLoading(true);
      const response = await api.getArtworks();
      // Filter artworks by current user
      setArtworks(response.results.filter(art => art.artist.id === user?.id));
    } catch (error) {
      console.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.updateProfile({ bio, location, website });
      setEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Profile Header */}
        <Card className="p-8 glass-effect mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-4xl font-bold text-white glow-effect">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full glow-effect"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold gradient-text mb-2">{user.username}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <Button
                  variant={editing ? 'default' : 'outline'}
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  className={editing ? 'glow-effect' : ''}
                >
                  {editing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="bg-background/50 mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Your location"
                        className="bg-background/50 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="bg-background/50 mt-2"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {bio && (
                    <p className="text-foreground/90">{bio}</p>
                  )}
                  <div className="flex flex-wrap gap-4">
                    {location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                      </div>
                    )}
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-accent hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        <span>{website}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 pt-4 border-t border-border/50">
                <div>
                  <p className="text-2xl font-bold gradient-text">{artworks.length}</p>
                  <p className="text-sm text-muted-foreground">Artworks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold gradient-text">
                    {artworks.reduce((sum, art) => sum + art.likes, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold gradient-text">
                    {artworks.reduce((sum, art) => sum + art.views, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* User's Artworks */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-6">My Artworks</h2>
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artworks.map((artwork, idx) => (
                <div key={artwork.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <ArtworkCard artwork={artwork} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center glass-effect">
              <p className="text-xl text-muted-foreground mb-4">No artworks yet</p>
              <p className="text-muted-foreground mb-6">Start sharing your creativity with the world!</p>
              <Button className="glow-effect">Upload Your First Artwork</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
