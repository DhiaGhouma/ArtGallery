import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, DollarSign, Eye, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import EditArtworkDialog from '@/components/EditArtworkDialog';
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

const MyListings = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingArtwork, setEditingArtwork] = useState<any>(null);
  const [deletingArtwork, setDeletingArtwork] = useState<any>(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Fetch user's artworks
  const { data: artworks = [], isLoading } = useQuery({
    queryKey: ['my-artworks', user?.id],
    queryFn: async () => {
      const allArtworks = await api.getArtworks();
      return allArtworks.filter((artwork) => artwork.artist.id === user?.id);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteArtwork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-artworks'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-artworks'] });
      toast({
        title: 'Success!',
        description: 'Artwork deleted successfully',
      });
      setDeletingArtwork(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete artwork',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your artworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-5xl sm:text-7xl font-bold gradient-text mb-4">My Listings</h1>
            <p className="text-xl text-muted-foreground">
              Manage your artworks on the marketplace
            </p>
          </div>
          <Button onClick={() => navigate('/upload')} size="lg" className="glow-effect">
            + Add New Artwork
          </Button>
        </div>

        {/* No artworks */}
        {artworks.length === 0 && (
          <div className="text-center py-20 glass-effect rounded-2xl">
            <p className="text-2xl text-muted-foreground mb-4">You haven't listed any artworks yet</p>
            <Button onClick={() => navigate('/upload')} size="lg">
              Upload Your First Artwork
            </Button>
          </div>
        )}

        {/* Artworks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artworks.map((artwork, index) => (
            <div
              key={artwork.id}
              className="glass-effect rounded-2xl overflow-hidden hover-glow group animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {artwork.is_featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-br from-gold/90 to-primary/90 backdrop-blur-md text-white text-sm font-semibold">
                    Featured
                  </div>
                )}

                {!artwork.in_stock && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-destructive/90 backdrop-blur-md text-white text-sm font-semibold">
                    Out of Stock
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                    {artwork.category || 'Uncategorized'}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1">{artwork.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {artwork.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-5 h-5 text-gold" />
                    <span className="text-2xl font-bold text-gold">{artwork.price || 0}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {artwork.likes_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {artwork.views ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditingArtwork(artwork)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeletingArtwork(artwork)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        {editingArtwork && (
          <EditArtworkDialog
            artwork={editingArtwork}
            open={!!editingArtwork}
            onOpenChange={(open) => !open && setEditingArtwork(null)}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingArtwork} onOpenChange={() => setDeletingArtwork(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deletingArtwork?.title}". This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingArtwork && deleteMutation.mutate(deletingArtwork.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MyListings;