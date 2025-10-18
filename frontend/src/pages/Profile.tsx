import { useState, useEffect, useRef } from 'react';
import { Camera, Mail, MapPin, Globe, Edit2, Save, X, Upload as UploadIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Artwork } from '@/lib/api';
import ArtworkCard from '@/components/ArtworkCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setAvatarPreview(user.avatar || '');
      loadUserArtworks();
    }
  }, [user, authLoading, isAuthenticated, navigate]);

  const loadUserArtworks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await api.getArtworks();
      const allArtworks = Array.isArray(response) ? response : [];
      // Filter artworks by current user
      const userArtworks = allArtworks.filter(art => art.artist.id === user.id);
      setArtworks(userArtworks);
    } catch (error) {
      console.error('Failed to load artworks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your artworks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Avatar must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update profile data
      const profileData = {
        username: username !== user?.username ? username : undefined,
        email: email !== user?.email ? email : undefined,
        bio,
        location,
        website,
      };

      // Remove undefined values
      Object.keys(profileData).forEach(key => 
        profileData[key as keyof typeof profileData] === undefined && delete profileData[key as keyof typeof profileData]
      );

      await api.updateProfile(profileData);

      // Upload avatar if changed
      if (avatar) {
        await api.uploadAvatar(avatar);
      }

      setEditing(false);
      setAvatar(null);
      
      // Refresh user data
      const updatedUser = await api.getProfile();
      // Update auth context if needed
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setAvatar(null);
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setAvatarPreview(user.avatar || '');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Profile Header */}
        <Card className="p-8 glass-effect mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-4xl font-bold text-white glow-effect">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt={username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  username.charAt(0).toUpperCase()
                )}
              </div>
              {editing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full glow-effect"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-background/50 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background/50 mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold gradient-text mb-2">{username}</h1>
                      <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Mail className="w-4 h-4" />
                        <span>{email}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="glow-effect"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
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
                      className="bg-background/50 mt-2 min-h-[100px]"
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
                    {artworks.reduce((sum, art) => sum + (art.likes_count || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold gradient-text">
                    {artworks.reduce((sum, art) => sum + (art.views || 0), 0)}
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
              <p className="mt-4 text-muted-foreground">Loading artworks...</p>
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
              <UploadIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground mb-4">No artworks yet</p>
              <p className="text-muted-foreground mb-6">Start sharing your creativity with the world!</p>
              <Button className="glow-effect" onClick={() => navigate('/upload')}>
                Upload Your First Artwork
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;