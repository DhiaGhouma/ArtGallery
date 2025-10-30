import { useState, useEffect, useRef } from 'react';
import { Camera, Mail, MapPin, Globe, Edit2, Save, X, Upload as UploadIcon, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Artwork } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Profile = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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

  // Edit artwork state
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStyle, setEditStyle] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [updatingArtwork, setUpdatingArtwork] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete artwork state
  const [deletingArtwork, setDeletingArtwork] = useState<Artwork | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categories = ['Photography', 'Digital Art', 'Painting', 'Sculpture', 'Illustration', 'Mixed Media'];
  const styles = ['Abstract', 'Realistic', 'Minimalist', 'Surreal', 'Contemporary', 'Traditional'];

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

      const profileData = {
        username: username !== user?.username ? username : undefined,
        email: email !== user?.email ? email : undefined,
        bio,
        location,
        website,
      };

      Object.keys(profileData).forEach(key => 
        profileData[key as keyof typeof profileData] === undefined && delete profileData[key as keyof typeof profileData]
      );

      await api.updateProfile(profileData);

      if (avatar) {
        await api.uploadAvatar(avatar);
      }

      setEditing(false);
      setAvatar(null);
      
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

  // Edit artwork handlers
  const handleEditArtwork = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setEditTitle(artwork.title);
    setEditDescription(artwork.description);
    setEditCategory(artwork.category);
    setEditStyle(artwork.style);
    setEditImagePreview(artwork.image);
    setEditImage(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateArtwork = async () => {
    if (!editingArtwork) return;

    try {
      setUpdatingArtwork(true);

      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('category', editCategory);
      formData.append('style', editStyle);
      
      if (editImage) {
        formData.append('image', editImage);
      }

      await api.updateArtwork(editingArtwork.id, formData);

      toast({
        title: 'Success',
        description: 'Artwork updated successfully',
      });

      setEditingArtwork(null);
      loadUserArtworks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update artwork',
        variant: 'destructive',
      });
    } finally {
      setUpdatingArtwork(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingArtwork(null);
    setEditTitle('');
    setEditDescription('');
    setEditCategory('');
    setEditStyle('');
    setEditImage(null);
    setEditImagePreview('');
  };

  // Delete artwork handlers
  const handleDeleteClick = (artwork: Artwork) => {
    setDeletingArtwork(artwork);
  };

  const handleDeleteArtwork = async () => {
    if (!deletingArtwork) return;

    try {
      setDeleting(true);
      await api.deleteArtwork(deletingArtwork.id);

      toast({
        title: 'Success',
        description: 'Artwork deleted successfully',
      });

      setDeletingArtwork(null);
      loadUserArtworks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete artwork',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
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
                <Card key={artwork.id} className="overflow-hidden glass-effect group animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/artwork/${artwork.id}`)}>
                    <img
                      src={artwork.image}
                      alt={artwork.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate">{artwork.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{artwork.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>{artwork.likes_count} likes</span>
                      <span>{artwork.views} views</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditArtwork(artwork)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(artwork)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
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

      {/* Edit Artwork Dialog */}
      <Dialog open={!!editingArtwork} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Artwork</DialogTitle>
            <DialogDescription>
              Update your artwork details and image
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Preview */}
            <div className="space-y-2">
              <Label>Artwork Image</Label>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50">
                {editImagePreview ? (
                  <img
                    src={editImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No image selected
                  </div>
                )}
              </div>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => editFileInputRef.current?.click()}
                className="w-full"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Change Image
              </Button>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Give your artwork a title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your artwork..."
                className="min-h-[100px]"
              />
            </div>

            {/* Category and Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <select
                  id="edit-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-style">Style *</Label>
                <select
                  id="edit-style"
                  value={editStyle}
                  onChange={(e) => setEditStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="">Select style</option>
                  {styles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={updatingArtwork}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateArtwork}
              disabled={updatingArtwork || !editTitle || !editCategory || !editStyle}
              className="glow-effect"
            >
              {updatingArtwork ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingArtwork} onOpenChange={(open) => !open && setDeletingArtwork(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artwork?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingArtwork?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArtwork}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;