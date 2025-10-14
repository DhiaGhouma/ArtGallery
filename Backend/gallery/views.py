from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q
import json

# Assuming you have these models - adjust based on your actual models
# from .models import Artwork, Comment, Like

@require_http_methods(["GET"])
def index(request):
    """Get all artworks with optional filters"""
    try:
        # Import your Artwork model here
        # from .models import Artwork
        
        # For now, return empty array if model not set up
        # artworks = Artwork.objects.all()
        
        # Handle filters
        search = request.GET.get('search', '')
        category = request.GET.get('category', '')
        style = request.GET.get('style', '')
        
        # Uncomment when model is ready
        # if search:
        #     artworks = artworks.filter(
        #         Q(title__icontains=search) | 
        #         Q(description__icontains=search)
        #     )
        # if category:
        #     artworks = artworks.filter(category=category)
        # if style:
        #     artworks = artworks.filter(style=style)
        
        # artworks = artworks.order_by('-created_at')
        
        # data = [{
        #     'id': artwork.id,
        #     'title': artwork.title,
        #     'description': artwork.description,
        #     'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
        #     'category': artwork.category,
        #     'style': artwork.style,
        #     'artist': {
        #         'id': artwork.artist.id,
        #         'username': artwork.artist.username,
        #         'avatar': request.build_absolute_uri(artwork.artist.profile.avatar.url) if hasattr(artwork.artist, 'profile') and artwork.artist.profile.avatar else None,
        #     },
        #     'likes_count': artwork.likes.count() if hasattr(artwork, 'likes') else 0,
        #     'views': artwork.views if hasattr(artwork, 'views') else 0,
        #     'is_featured': artwork.is_featured if hasattr(artwork, 'is_featured') else False,
        #     'created_at': artwork.created_at.isoformat(),
        #     'updated_at': artwork.updated_at.isoformat(),
        # } for artwork in artworks]
        
        # Temporary: Return empty array until models are set up
        data = []
        
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def artwork_detail(request, pk):
    """Get single artwork with comments"""
    try:
        # from .models import Artwork, Comment
        # artwork = Artwork.objects.get(pk=pk)
        
        # # Increment views
        # artwork.views = (artwork.views or 0) + 1
        # artwork.save()
        
        # # Get comments
        # comments = Comment.objects.filter(artwork=artwork).order_by('-created_at')
        
        # data = {
        #     'id': artwork.id,
        #     'title': artwork.title,
        #     'description': artwork.description,
        #     'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
        #     'category': artwork.category,
        #     'style': artwork.style,
        #     'artist': {
        #         'id': artwork.artist.id,
        #         'username': artwork.artist.username,
        #         'avatar': request.build_absolute_uri(artwork.artist.profile.avatar.url) if hasattr(artwork.artist, 'profile') and artwork.artist.profile.avatar else None,
        #     },
        #     'likes_count': artwork.likes.count() if hasattr(artwork, 'likes') else 0,
        #     'views': artwork.views,
        #     'is_liked': artwork.likes.filter(user=request.user).exists() if request.user.is_authenticated and hasattr(artwork, 'likes') else False,
        #     'created_at': artwork.created_at.isoformat(),
        #     'updated_at': artwork.updated_at.isoformat(),
        #     'comments': [{
        #         'id': comment.id,
        #         'text': comment.text,
        #         'user': {
        #             'id': comment.user.id,
        #             'username': comment.user.username,
        #             'avatar': request.build_absolute_uri(comment.user.profile.avatar.url) if hasattr(comment.user, 'profile') and comment.user.profile.avatar else None,
        #         },
        #         'created_at': comment.created_at.isoformat(),
        #     } for comment in comments]
        # }
        
        # Temporary response
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def upload_artwork(request):
    """Upload new artwork"""
    try:
        # from .models import Artwork
        
        # Get form data
        title = request.POST.get('title')
        description = request.POST.get('description')
        category = request.POST.get('category')
        style = request.POST.get('style')
        image = request.FILES.get('image')
        
        if not all([title, description, category, style, image]):
            return JsonResponse({'error': 'All fields are required'}, status=400)
        
        # artwork = Artwork.objects.create(
        #     title=title,
        #     description=description,
        #     category=category,
        #     style=style,
        #     image=image,
        #     artist=request.user
        # )
        
        # return JsonResponse({
        #     'id': artwork.id,
        #     'message': 'Artwork uploaded successfully'
        # }, status=201)
        
        return JsonResponse({'message': 'Upload endpoint ready'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def toggle_like(request, pk):
    """Toggle like on artwork"""
    try:
        # from .models import Artwork, Like
        
        # artwork = Artwork.objects.get(pk=pk)
        # like, created = Like.objects.get_or_create(
        #     artwork=artwork,
        #     user=request.user
        # )
        
        # if not created:
        #     like.delete()
        #     liked = False
        # else:
        #     liked = True
        
        # return JsonResponse({
        #     'liked': liked,
        #     'likes_count': artwork.likes.count()
        # })
        
        return JsonResponse({'message': 'Like endpoint ready'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def add_comment(request, pk):
    """Add comment to artwork"""
    try:
        # from .models import Artwork, Comment
        
        data = json.loads(request.body)
        text = data.get('text')
        
        if not text:
            return JsonResponse({'error': 'Comment text is required'}, status=400)
        
        # artwork = Artwork.objects.get(pk=pk)
        # comment = Comment.objects.create(
        #     artwork=artwork,
        #     user=request.user,
        #     text=text
        # )
        
        # return JsonResponse({
        #     'id': comment.id,
        #     'text': comment.text,
        #     'user': {
        #         'id': request.user.id,
        #         'username': request.user.username,
        #     },
        #     'created_at': comment.created_at.isoformat()
        # }, status=201)
        
        return JsonResponse({'message': 'Comment endpoint ready'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=404)


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    """Register new user"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return JsonResponse({'error': 'All fields are required'}, status=400)
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Create user profile if you have a Profile model
        # from .models import Profile
        # Profile.objects.create(user=user)
        
        return JsonResponse({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """Login user"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return JsonResponse({'error': 'Username and password are required'}, status=400)
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            # Generate token if using token authentication
            # from rest_framework.authtoken.models import Token
            # token, _ = Token.objects.get_or_create(user=user)
            
            return JsonResponse({
                'message': 'Login successful',
                # 'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET", "PUT"])
@login_required
def profile(request, username=None):
    """Get or update user profile"""
    try:
        if request.method == 'GET':
            # Get profile
            if username:
                user = User.objects.get(username=username)
            else:
                user = request.user
            
            # from .models import Profile
            # profile = user.profile
            
            return JsonResponse({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                # 'avatar': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None,
                # 'bio': profile.bio,
                # 'artworks_count': user.artworks.count(),
            })
        
        elif request.method == 'PUT':
            # Update profile
            data = json.loads(request.body)
            user = request.user
            
            if 'username' in data:
                user.username = data['username']
            if 'email' in data:
                user.email = data['email']
            
            user.save()
            
            # Update profile model
            # profile = user.profile
            # if 'bio' in data:
            #     profile.bio = data['bio']
            # profile.save()
            
            return JsonResponse({
                'message': 'Profile updated successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)