from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Artwork, Category, Like, Comment, UserProfile
from .forms import ArtworkForm, CommentForm, CustomUserCreationForm, UserProfileForm

def index(request):
    # Get filter parameters
    category_id = request.GET.get('category')
    style = request.GET.get('style')
    search = request.GET.get('search')
    sort_by = request.GET.get('sort', 'newest')

    # Base queryset
    artworks = Artwork.objects.select_related('artist', 'category').annotate(
        likes_count=Count('likes')
    )

    # Apply filters
    if category_id:
        artworks = artworks.filter(category_id=category_id)
    if style:
        artworks = artworks.filter(style=style)
    if search:
        artworks = artworks.filter(
            Q(title__icontains=search) | 
            Q(description__icontains=search) |
            Q(artist__username__icontains=search)
        )

    # Apply sorting
    if sort_by == 'popular':
        artworks = artworks.order_by('-likes_count', '-created_at')
    elif sort_by == 'views':
        artworks = artworks.order_by('-views', '-created_at')
    else:  # newest
        artworks = artworks.order_by('-created_at')

    # Pagination
    paginator = Paginator(artworks, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Get categories and styles for filters
    categories = Category.objects.all()
    styles = Artwork.STYLE_CHOICES

    # Get user's liked artworks on this page
    user_liked_artworks = set()
    if request.user.is_authenticated:
        user_liked_artworks = set(
            Like.objects.filter(user=request.user, artwork__in=page_obj.object_list)
            .values_list('artwork_id', flat=True)
        )

    context = {
        'page_obj': page_obj,
        'categories': categories,
        'styles': styles,
        'current_category': int(category_id) if category_id else None,
        'current_style': style,
        'current_search': search,
        'current_sort': sort_by,
        'featured_artworks': Artwork.objects.filter(is_featured=True)[:4],
        'user_liked_artworks': user_liked_artworks,  # pass liked artworks to template
    }
    return render(request, 'gallery/index.html', context)

def artwork_detail(request, pk):
    artwork = get_object_or_404(Artwork, pk=pk)
    
    # Increment views
    artwork.views += 1
    artwork.save(update_fields=['views'])
    
    # Check if user liked the artwork
    user_liked = False
    if request.user.is_authenticated:
        user_liked = Like.objects.filter(user=request.user, artwork=artwork).exists()
    
    # Get comments
    comments = artwork.comments.select_related('user').all()
    
    # Comment form
    comment_form = CommentForm()
    
    # Related artworks
    related_artworks = Artwork.objects.filter(
        category=artwork.category
    ).exclude(pk=artwork.pk)[:4]
    
    context = {
        'artwork': artwork,
        'user_liked': user_liked,
        'comments': comments,
        'comment_form': comment_form,
        'related_artworks': related_artworks,
    }
    return render(request, 'gallery/artwork_detail.html', context)

@login_required
def upload_artwork(request):
    if request.method == 'POST':
        form = ArtworkForm(request.POST, request.FILES)
        if form.is_valid():
            artwork = form.save(commit=False)
            artwork.artist = request.user
            artwork.save()
            messages.success(request, 'Your artwork has been uploaded successfully!')
            return redirect('artwork_detail', pk=artwork.pk)
    else:
        form = ArtworkForm()
    
    return render(request, 'gallery/upload.html', {'form': form})

@login_required
@require_POST
def toggle_like(request, pk):
    artwork = get_object_or_404(Artwork, pk=pk)
    like, created = Like.objects.get_or_create(user=request.user, artwork=artwork)
    
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
    
    likes_count = artwork.likes.count()
    
    return JsonResponse({
        'liked': liked,
        'likes_count': likes_count,
    })

@login_required
def add_comment(request, pk):
    artwork = get_object_or_404(Artwork, pk=pk)
    
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.user = request.user
            comment.artwork = artwork
            comment.save()
            messages.success(request, 'Your comment has been added!')
    
    return redirect('artwork_detail', pk=pk)

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('index')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'registration/register.html', {'form': form})

@login_required
def profile(request, username=None):
    if username:
        user = get_object_or_404(User, username=username)
    else:
        user = request.user
    
    profile, created = UserProfile.objects.get_or_create(user=user)
    artworks = user.artworks.all()
    
    # Profile editing
    if request.method == 'POST' and user == request.user:
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your profile has been updated!')
            return redirect('profile')
    else:
        form = UserProfileForm(instance=profile) if user == request.user else None
    
    context = {
        'profile_user': user,
        'profile': profile,
        'artworks': artworks,
        'form': form,
        'is_own_profile': user == request.user,
    }
    return render(request, 'gallery/profile.html', context)
