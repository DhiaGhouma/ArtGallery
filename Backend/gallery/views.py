from django.http import JsonResponse
from .models import Artwork, Report, Comment, Like, Category, UserProfile
from .forms import ReportForm
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q, Count
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone
from datetime import timedelta
import requests
from dotenv import load_dotenv
import json
import os
from .ai_service import generate_comment_suggestions
from .utils import call_groq_ai

load_dotenv()

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

def call_groq_ai(user_query: str) -> str:
    """
    Call Groq AI chat model and return the response text.
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",  # working model
        "messages": [
            {"role": "system", "content": "You are an expert art instructor."},
            {"role": "user", "content": user_query},
        ],
        "temperature": 0.7,
        "top_p": 0.9,
    }

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=payload,
    )

    if response.status_code != 200:
        return f"Error from Groq API: {response.text}"

    result = response.json()
    return result['choices'][0]['message']['content']


    response = requests.post(GROQ_API_URL, headers=headers, data=json.dumps(payload))
    if response.status_code == 200:
        data = response.json()
        return data["choices"][0]["message"]["content"]
    else:
        return f"Error: {response.status_code} - {response.text}"



    response = requests.post(GROQ_API_URL, headers=headers, data=json.dumps(payload))
    if response.status_code == 200:
        data = response.json()
        return data["choices"][0]["message"]["content"]
    else:
        return f"Error: {response.status_code} - {response.text}"






# ============ Helper Functions ============

def get_user_data(user, request):
    """Helper function to get user data with is_staff"""
    try:
        profile = UserProfile.objects.get(user=user)
        avatar = request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        bio = profile.bio
        location = profile.location
        website = profile.website
    except UserProfile.DoesNotExist:
        avatar = None
        bio = ''
        location = ''
        website = ''
    
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,  # Include is_staff for admin checks
        'avatar': avatar,
        'bio': bio,
        'location': location,
        'website': website,
        'artworks_count': user.artworks.count(),
    }


# ============ Artworks ============
@csrf_exempt
@require_http_methods(["GET"])
def index(request):
    """Get all artworks with optional filters"""
    try:
        # Start with annotated queryset
        artworks = Artwork.objects.annotate(
            likes_count=Count('likes', distinct=True),
            comments_count=Count('comments', distinct=True)
        )
        
        # Handle filters
        search = request.GET.get('search', '')
        category = request.GET.get('category', '')
        style = request.GET.get('style', '')
        featured = request.GET.get('featured', '')
        sort = request.GET.get('sort', '-created_at')
        
        if search:
            artworks = artworks.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        if category and category != 'all':
            artworks = artworks.filter(category__name__iexact=category)
        if style and style != 'all':
            artworks = artworks.filter(style=style)
        if featured:
            artworks = artworks.filter(is_featured=True)
        
        # Apply sorting
        valid_sorts = [
            '-created_at', 'created_at',
            '-likes_count', 'likes_count',
            '-comments_count', 'comments_count',
            '-views', 'views',
            '-updated_at', 'updated_at'
        ]
        
        if sort in valid_sorts:
            # Use secondary sort by created_at for consistency
            artworks = artworks.order_by(sort, '-created_at')
        else:
            artworks = artworks.order_by('-created_at')
        
        data = []
        for artwork in artworks:
            # Get artist avatar
            avatar = None
            try:
                if hasattr(artwork.artist, 'userprofile') and artwork.artist.userprofile.avatar:
                    avatar = request.build_absolute_uri(artwork.artist.userprofile.avatar.url)
            except UserProfile.DoesNotExist:
                pass
            
            # Get comments for this artwork
            comments = Comment.objects.filter(artwork=artwork).order_by('-created_at')
            comments_data = []
            for comment in comments:
                comment_avatar = None
                try:
                    if hasattr(comment.user, 'userprofile') and comment.user.userprofile.avatar:
                        comment_avatar = request.build_absolute_uri(comment.user.userprofile.avatar.url)
                except UserProfile.DoesNotExist:
                    pass
                
                comments_data.append({
                    'id': comment.id,
                    'text': comment.content,
                    'content': comment.content,
                    'user': {
                        'id': comment.user.id,
                        'username': comment.user.username,
                        'avatar': comment_avatar,
                    },
                    'created_at': comment.created_at.isoformat(),
                })
            
            # Check if current user has liked this artwork
            is_liked = False
            if request.user.is_authenticated:
                is_liked = artwork.likes.filter(user=request.user).exists()
            
            data.append({
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description,
                'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
                'category': artwork.category.name if artwork.category else None,
                'style': artwork.style,
                'artist': {
                    'id': artwork.artist.id,
                    'username': artwork.artist.username,
                    'avatar': avatar,
                },
                'likes_count': artwork.likes_count,  # Use annotated value
                'comments_count': artwork.comments_count,  # Use annotated value
                'views': artwork.views,
                'is_liked': is_liked,
                'is_featured': artwork.is_featured,
                'comments': comments_data,  # Include all comments
                'created_at': artwork.created_at.isoformat(),
                'updated_at': artwork.updated_at.isoformat(),
                # yosr's :
                'price': float(artwork.price) if artwork.price else 0,
                'in_stock': artwork.in_stock,



            })
        
        return JsonResponse(data, safe=False)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def artwork_detail_update_delete(request, pk):
    """Get, update, or delete artwork"""
    try:
        if request.method == 'GET':
            # Get single artwork with comments
            artwork = Artwork.objects.annotate(
                likes_count=Count('likes', distinct=True),
                comments_count=Count('comments', distinct=True)
            ).get(pk=pk)
            
            # Increment views
            artwork.views += 1
            artwork.save()
            
            # Get comments
            comments = Comment.objects.filter(artwork=artwork).order_by('-created_at')
            
            # Get artist avatar
            artist_avatar = None
            try:
                if hasattr(artwork.artist, 'userprofile') and artwork.artist.userprofile.avatar:
                    artist_avatar = request.build_absolute_uri(artwork.artist.userprofile.avatar.url)
            except UserProfile.DoesNotExist:
                pass
            
            data = {
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description,
                'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
                'category': artwork.category.name if artwork.category else None,
                'style': artwork.style,
                'artist': {
                    'id': artwork.artist.id,
                    'username': artwork.artist.username,
                    'avatar': artist_avatar,
                },
                'likes_count': artwork.likes_count,
                'comments_count': artwork.comments_count,
                'views': artwork.views,
                'is_liked': artwork.likes.filter(user=request.user).exists() if request.user.is_authenticated else False,
                'created_at': artwork.created_at.isoformat(),
                'updated_at': artwork.updated_at.isoformat(),
                # yosr's additions
                'price': float(artwork.price) if artwork.price else 0,
                'in_stock': artwork.in_stock,
                'comments': []
            }
            
            # Add comments
            for comment in comments:
                comment_avatar = None
                try:
                    if hasattr(comment.user, 'userprofile') and comment.user.userprofile.avatar:
                        comment_avatar = request.build_absolute_uri(comment.user.userprofile.avatar.url)
                except UserProfile.DoesNotExist:
                    pass
                
                data['comments'].append({
                    'id': comment.id,
                    'text': comment.content,
                    'content': comment.content,
                    'user': {
                        'id': comment.user.id,
                        'username': comment.user.username,
                        'avatar': comment_avatar,
                    },
                    'created_at': comment.created_at.isoformat(),
                })
            
            return JsonResponse(data)
        
        elif request.method == 'PUT':
            # Update artwork
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            artwork = Artwork.objects.get(pk=pk)
            
            # Check if user is owner or staff
            if artwork.artist != request.user and not request.user.is_staff:
                return JsonResponse({'error': 'Permission denied'}, status=403)
            
            # Parse multipart form data for PUT request
            title = request.POST.get('title')
            description = request.POST.get('description')
            category_name = request.POST.get('category')
            style = request.POST.get('style')
            image = request.FILES.get('image')
            
            # Update fields if provided
            if title:
                artwork.title = title
            if description is not None:
                artwork.description = description
            if category_name:
                category, _ = Category.objects.get_or_create(name=category_name)
                artwork.category = category
            if style:
                artwork.style = style
            if image:
                if artwork.image:
                    try:
                        import os
                        old_path = artwork.image.path
                        if os.path.exists(old_path):
                            os.remove(old_path)
                    except Exception as e:
                        print(f"Error deleting old image: {e}")
                artwork.image = image
            
            artwork.save()
            
            return JsonResponse({
                'message': 'Artwork updated successfully',
                'id': artwork.id
            })
        
        elif request.method == 'DELETE':
            # Delete artwork
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            artwork = Artwork.objects.get(pk=pk)
            
            # Check if user is owner or staff
            if artwork.artist != request.user and not request.user.is_staff:
                return JsonResponse({'error': 'Permission denied'}, status=403)
            
            if artwork.image:
                try:
                    import os
                    if os.path.exists(artwork.image.path):
                        os.remove(artwork.image.path)
                except Exception as e:
                    print(f"Error deleting image file: {e}")
            
            artwork.delete()
            
            return JsonResponse({'message': 'Artwork deleted successfully'})
            
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)
    


@csrf_exempt
@require_http_methods(["POST"])
def upload_artwork(request):
    """Upload new artwork"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Get form data
        title = request.POST.get('title')
        description = request.POST.get('description')
        category_name = request.POST.get('category')
        style = request.POST.get('style')
        image = request.FILES.get('image')
        price = request.POST.get('price')  # AJOUTEZ
        in_stock = request.POST.get('in_stock', 'true')  # AJOUTEZ
        
        if not all([title, category_name, style, image]):
            return JsonResponse({'error': 'Required fields: title, category, style, image'}, status=400)
        
        # Get or create category
        category, _ = Category.objects.get_or_create(name=category_name)
        
        # Create artwork
        artwork = Artwork.objects.create(
            title=title,
            description=description or '',
            category=category,
            style=style,
            image=image,
            artist=request.user,
            price=float(price) if price else 0,  # AJOUTEZ
            in_stock=in_stock.lower() == 'true'  # AJOUTEZ
        )
        
        return JsonResponse({
            'id': artwork.id,
            'message': 'Artwork uploaded successfully'
        }, status=201)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_artwork(request, pk):
    """Delete artwork"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        artwork = Artwork.objects.get(pk=pk)
        
        # Check if user is owner or staff
        if artwork.artist != request.user and not request.user.is_staff:
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        # Delete the image file
        if artwork.image:
            try:
                import os
                if os.path.exists(artwork.image.path):
                    os.remove(artwork.image.path)
            except Exception as e:
                print(f"Error deleting image: {e}")
        
        artwork.delete()
        return JsonResponse({'message': 'Artwork deleted successfully'})
        
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


# ============ Likes ============

@csrf_exempt
@require_http_methods(["POST"])
def toggle_like(request, pk):
    """Toggle like on artwork"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        artwork = Artwork.objects.get(pk=pk)
        like, created = Like.objects.get_or_create(
            artwork=artwork,
            user=request.user
        )
        
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
        
        # Get updated count
        likes_count = artwork.likes.count()
        
        return JsonResponse({
            'liked': liked,
            'likes_count': likes_count
        })
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============ Comments ============

@csrf_exempt
@require_http_methods(["POST"])
def add_comment(request, pk):
    """Add comment to artwork"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        data = json.loads(request.body)
        text = data.get('text')
        
        if not text:
            return JsonResponse({'error': 'Comment text is required'}, status=400)
        
        artwork = Artwork.objects.get(pk=pk)
        comment = Comment.objects.create(
            artwork=artwork,
            user=request.user,
            content=text
        )
        
        # Get user avatar
        avatar = None
        try:
            if hasattr(request.user, 'userprofile') and request.user.userprofile.avatar:
                avatar = request.build_absolute_uri(request.user.userprofile.avatar.url)
        except UserProfile.DoesNotExist:
            pass
        
        return JsonResponse({
            'id': comment.id,
            'text': comment.content,
            'content': comment.content,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'avatar': avatar,
            },
            'created_at': comment.created_at.isoformat()
        }, status=201)
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_comment(request, pk):
    """Delete comment"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        comment = Comment.objects.get(pk=pk)
        
        # Check if user is owner or staff
        if comment.user != request.user and not request.user.is_staff:
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        comment.delete()
        return JsonResponse({'message': 'Comment deleted successfully'})
    except Comment.DoesNotExist:
        return JsonResponse({'error': 'Comment not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============ AI Comment Suggestions ============

@csrf_exempt
@require_http_methods(["POST"])
def suggest_comments(request, pk):
    """
    Generate AI-powered comment suggestions for an artwork
    POST /artworks/{pk}/suggest-comments/
    """
    try:
        # Check authentication
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Get the artwork
        artwork = Artwork.objects.get(pk=pk)
        
        # Generate suggestions using AI
        suggestions = generate_comment_suggestions(
            artwork_title=artwork.title,
            artwork_description=artwork.description or 'An artwork',
            artwork_style=artwork.style,
            num_suggestions=3
        )
        
        return JsonResponse({
            'suggestions': suggestions,
            'artwork_id': artwork.id,
            'artwork_title': artwork.title
        })
        
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        # Log error in production
        print(f"AI suggestion error: {str(e)}")
        return JsonResponse({
            'error': 'Failed to generate suggestions. Please try again.',
            'details': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_tutorial_categories(request):
    """
    Get available tutorial categories
    GET /tutorials/categories/
    """
    try:
        from .ai_service import get_tutorial_categories as get_categories
        categories = get_categories()
        
        return JsonResponse({
            'categories': categories,
            'count': len(categories)
        })
    except Exception as e:
        print(f"Error fetching categories: {str(e)}")
        return JsonResponse({
            'error': 'Failed to fetch categories',
            'details': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def generate_ai_tutorial(request):
    """
    Generate AI-powered tutorial
    POST /tutorials/generate/
    Body: { "topic": "portrait drawing", "skill_level": "beginner", "language": "en" }
    """
    try:
        # Parse request data
        data = json.loads(request.body)
        topic = data.get('topic')
        skill_level = data.get('skill_level', 'beginner')
        language = data.get('language', 'en')
        
        # Validate inputs
        if not topic:
            return JsonResponse({'error': 'Topic is required'}, status=400)
        
        if skill_level not in ['beginner', 'intermediate', 'advanced']:
            return JsonResponse({'error': 'Invalid skill level'}, status=400)
        
        if language not in ['en', 'ar', 'fr']:
            return JsonResponse({'error': 'Invalid language. Must be en, ar, or fr'}, status=400)
        
        # Generate tutorial using AI
        from .ai_service import generate_tutorial
        tutorial = generate_tutorial(topic=topic, skill_level=skill_level, language=language)
        
        return JsonResponse({
            'success': True,
            'tutorial': tutorial
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Tutorial generation error: {str(e)}")
        return JsonResponse({
            'error': 'Failed to generate tutorial',
            'details': str(e)
        }, status=500)


 #============ AI description Suggestions ============
@csrf_exempt
@require_http_methods(["POST"])
def generate_description(request):
    """
    Generate AI-powered description for an artwork
    POST /artworks/generate-description/
    Body: { "title": "...", "category": "...", "style": "..." }
    """
    try:
        # Import the service
        from .ai_description_service import generate_multiple_descriptions
        
        # Check authentication
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Parse request data
        data = json.loads(request.body)
        title = data.get('title')
        category = data.get('category')
        style = data.get('style')
        
        if not title:
            return JsonResponse({'error': 'Title is required'}, status=400)
        
        # Generate descriptions using AI
        descriptions = generate_multiple_descriptions(
            title=title,
            category=category,
            style=style,
            count=3
        )
        
        return JsonResponse({
            'descriptions': descriptions,
            'title': title
        })
        
    except Exception as e:
        # Log error in production
        print(f"AI description generation error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Failed to generate descriptions. Please try again.',
            'details': str(e)
        }, status=500)


# ============ Authentication ============

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
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        # Automatically log in the user after registration
        login(request, user)
        request.session.modified = True
        request.session.save()
        
        return JsonResponse({
            'message': 'User registered successfully',
            'user': get_user_data(user, request)
        }, status=201)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
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
            request.session.modified = True
            request.session.save()
            
            return JsonResponse({
                'message': 'Login successful',
                'user': get_user_data(user, request)
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """Logout user"""
    try:
        logout(request)
        return JsonResponse({'message': 'Logout successful'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def check_auth(request):
    """Check if user is authenticated"""
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': get_user_data(request.user, request)
        })
    else:
        return JsonResponse({'authenticated': False})


# ============ Profile ============

@csrf_exempt
@require_http_methods(["GET", "PUT"])
def profile(request, username=None):
    """Get or update user profile"""
    try:
        if request.method == 'GET':
            # Get profile
            if username:
                user = User.objects.get(username=username)
            else:
                if not request.user.is_authenticated:
                    return JsonResponse({'error': 'Authentication required'}, status=401)
                user = request.user
            
            return JsonResponse(get_user_data(user, request))
        
        elif request.method == 'PUT':
            # Check authentication for updates
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Authentication required'}, status=401)
            
            # Update profile
            data = json.loads(request.body)
            user = request.user
            
            if 'username' in data:
                user.username = data['username']
            if 'email' in data:
                user.email = data['email']
            
            user.save()
            
            # Update profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if 'bio' in data:
                profile.bio = data['bio']
            if 'location' in data:
                profile.location = data['location']
            if 'website' in data:
                profile.website = data['website']
            profile.save()
            
            return JsonResponse({
                'message': 'Profile updated successfully',
                'user': get_user_data(user, request)
            })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def upload_avatar(request):
    """Upload or update user avatar"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        if 'avatar' not in request.FILES:
            return JsonResponse({'error': 'No avatar file provided'}, status=400)
        
        avatar_file = request.FILES['avatar']
        
        # Validate file size (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return JsonResponse({'error': 'File too large. Maximum size is 5MB'}, status=400)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return JsonResponse({'error': 'Invalid file type. Only images are allowed'}, status=400)
        
        user = request.user
        
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Delete old avatar if exists
        if profile.avatar:
            profile.avatar.delete(save=False)
        
        # Save new avatar
        profile.avatar = avatar_file
        profile.save()
        
        avatar_url = request.build_absolute_uri(profile.avatar.url)
        
        return JsonResponse({
            'message': 'Avatar uploaded successfully',
            'avatar': avatar_url
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)


# ============ Reports ============

@csrf_exempt  # désactive CSRF pour test avec Postman
@require_http_methods(["POST"])
def create_report(request):
    """Create a new report for an artwork or comment"""
    try:
        print("=== RAW BODY ===", request.body)

        data = json.loads(request.body.decode("utf-8"))
        reporter_id = data.get("reporter_id")
        artwork_id = data.get("artwork_id")
        comment_id = data.get("comment_id")
        reason = data.get("reason")
        description = data.get("description", "")

        if not reporter_id or not reason:
            return JsonResponse({"error": "reporter_id and reason are required"}, status=400)

        reporter = get_object_or_404(User, id=reporter_id)
        artwork = Artwork.objects.filter(id=artwork_id).first() if artwork_id else None
        comment = Comment.objects.filter(id=comment_id).first() if comment_id else None

        report = Report.objects.create(
            reporter=reporter,
            artwork=artwork,
            comment=comment,
            reason=reason,
            description=description
        )

        return JsonResponse({
            "message": "Report created successfully",
            "report_id": report.id
        }, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
@staff_member_required
def get_reports(request):
    """Get all reports (admin only)"""
    try:
        reports = Report.objects.all().order_by('-created_at')
        
        data = []
        for report in reports:
            report_data = {
                'id': report.id,
                'reporter': {
                    'id': report.reporter.id,
                    'username': report.reporter.username,
                },
                'reason': report.reason,
                'description': report.description,
                'resolved': report.resolved,
                'created_at': report.created_at.isoformat(),
            }
            
            # Add artwork info if exists
            if report.artwork:
                report_data['artwork'] = {
                    'id': report.artwork.id,
                    'title': report.artwork.title,
                    'image': request.build_absolute_uri(report.artwork.image.url) if report.artwork.image else None,
                }
            
            # Add comment info if exists
            if report.comment:
                report_data['comment'] = {
                    'id': report.comment.id,
                    'text': report.comment.content,
                    'user': {
                        'id': report.comment.user.id,
                        'username': report.comment.user.username,
                    }
                }
            
            data.append(report_data)
        
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
#@staff_member_required
def resolve_report(request, report_id):
    """Resolve a report (admin only)"""
    try:
        report = get_object_or_404(Report, id=report_id)
        report.resolved = True
        report.save()
        
        return JsonResponse({
            'message': 'Report resolved successfully',
            'id': report.id,
            'resolved': report.resolved
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    
@csrf_exempt
@require_http_methods(["POST"])
@staff_member_required
def ban_user(request, user_id):
    """Ban permanently a user (admin only)"""
    try:
        user = get_object_or_404(User, id=user_id)
        # Artwork.objects.filter(artist=user).delete()
        user.is_active = False  # désactive le compte
        user.save()

        return JsonResponse({
            "message": f"User {user.username} has been permanently banned.",
            "user_id": user.id,
            "banned": True
        }, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



# ============ Admin - Users ============

@require_http_methods(["GET"])
@staff_member_required
def get_all_users(request):
    """Get all users (admin only)"""
    try:
        users = User.objects.all().order_by('-date_joined')
        
        # Apply filters
        search = request.GET.get('search', '')
        is_staff = request.GET.get('is_staff', '')
        is_active = request.GET.get('is_active', '')
        
        if search:
            users = users.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search)
            )
        if is_staff:
            users = users.filter(is_staff=is_staff.lower() == 'true')
        if is_active:
            users = users.filter(is_active=is_active.lower() == 'true')
        
        data = [get_user_data(user, request) for user in users]
        
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============ Admin - Stats ============

@require_http_methods(["GET"])
@staff_member_required
def get_admin_stats(request):
    """Get admin dashboard statistics"""
    try:
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_artworks = Artwork.objects.count()
        total_reports = Report.objects.count()
        pending_reports = Report.objects.filter(resolved=False).count()
        
        return JsonResponse({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalArtworks': total_artworks,
            'totalReports': total_reports,
            'pendingReports': pending_reports,
            'totalTransactions': 0,  # Placeholder
            'totalRevenue': 0,  # Placeholder
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============ Categories ============

@require_http_methods(["GET"])
def get_categories(request):
    """Get all categories"""
    try:
        categories = Category.objects.all()
        data = [
            {
                'id': cat.id,
                'name': cat.name,
                'description': cat.description,
            }
            for cat in categories
        ]
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
# ✅ GARDEZ CELLE-CI
@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def update_artwork(request, pk):
    """Update artwork"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        artwork = Artwork.objects.get(pk=pk)
        
        # Check if user is owner or staff
        if artwork.artist != request.user and not request.user.is_staff:
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        # Parse JSON data
        data = json.loads(request.body)
        
        # Update fields
        if 'title' in data:
            artwork.title = data['title']
        if 'description' in data:
            artwork.description = data['description']
        if 'price' in data:
            artwork.price = float(data['price'])
        if 'in_stock' in data:
            artwork.in_stock = data['in_stock']
        if 'category' in data:
            category, _ = Category.objects.get_or_create(name=data['category'])
            artwork.category = category
        if 'style' in data:
            artwork.style = data['style']
        
        artwork.save()
        
        return JsonResponse({
            'message': 'Artwork updated successfully',
            'id': artwork.id
        })
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def generate_art_technique(request):
    """Generate art technique suggestions using AI"""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        data = json.loads(request.body)
        prompt = data.get('prompt', '')
        
        if not prompt:
            return JsonResponse({'error': 'Prompt is required'}, status=400)
        
        # Call Groq AI
        answer = call_groq_ai(prompt)
        
        return JsonResponse({
            'success': True,
            'generated_text': answer
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Failed to generate technique',
            'details': str(e)
        }, status=500)
# Ajoutez ces nouvelles vues dans gallery/views.py

@csrf_exempt
@require_http_methods(["POST"])
def ai_mood_matcher(request):
    """
    AI Mood-based artwork recommendation
    POST /ai/mood-matcher/
    Body: { "mood": "joyful" }
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        data = json.loads(request.body)
        mood = data.get('mood')
        
        if not mood:
            return JsonResponse({'error': 'Mood is required'}, status=400)
        
        # Mapping plus précis des humeurs
        mood_keywords = {
            'joyful': {
                'colors': ['yellow', 'orange', 'bright', 'vibrant', 'colorful', 'sunny'],
                'themes': ['happy', 'joy', 'celebration', 'cheerful', 'playful', 'light']
            },
            'calm': {
                'colors': ['blue', 'green', 'white', 'soft', 'pastel', 'serene'],
                'themes': ['peaceful', 'tranquil', 'meditative', 'zen', 'quiet', 'gentle']
            },
            'energetic': {
                'colors': ['red', 'orange', 'bold', 'intense', 'vivid', 'dynamic'],
                'themes': ['energy', 'power', 'movement', 'action', 'passion', 'fire']
            },
            'mysterious': {
                'colors': ['purple', 'dark', 'deep', 'shadow', 'night', 'black'],
                'themes': ['mystery', 'enigma', 'mystical', 'hidden', 'secret', 'unknown']
            },
            'romantic': {
                'colors': ['pink', 'red', 'rose', 'soft', 'warm', 'gentle'],
                'themes': ['love', 'romance', 'heart', 'tender', 'sweet', 'intimate']
            },
            'melancholic': {
                'colors': ['grey', 'blue', 'muted', 'subdued', 'rain', 'storm'],
                'themes': ['sad', 'contemplative', 'thoughtful', 'rain', 'solitude', 'reflection']
            }
        }
        
        # Construire une requête complexe
        mood_data = mood_keywords.get(mood, mood_keywords['joyful'])
        all_keywords = mood_data['colors'] + mood_data['themes']
        
        # Créer une requête Q complexe
        query = Q()
        for keyword in all_keywords:
            query |= Q(title__icontains=keyword)
            query |= Q(description__icontains=keyword)
            if hasattr(Artwork, 'category'):
                query |= Q(category__name__icontains=keyword)
            if hasattr(Artwork, 'tags'):
                query |= Q(tags__name__icontains=keyword)
        
        # Récupérer les artworks correspondants
        artworks = Artwork.objects.filter(query).distinct().annotate(
            likes_count=Count('likes', distinct=True)
        ).order_by('-likes_count')[:6]
        
        # Si pas assez de résultats spécifiques, prendre des artworks populaires variés
        if artworks.count() < 3:
            artworks = Artwork.objects.annotate(
                likes_count=Count('likes', distinct=True)
            ).order_by('-created_at', '-likes_count')[:6]
        
        # Appel à Groq AI pour des caractéristiques
        try:
            prompt = f"""You are an art curator. Based on the mood '{mood}', recommend 3 art characteristics that match this emotion.
            Return ONLY a JSON array of 3 strings.
            Example: ["vibrant colors", "dynamic composition", "bold brushstrokes"]
            """
            ai_response = call_groq_ai(prompt)
            characteristics = json.loads(ai_response)
        except:
            characteristics = [f"{mood} artwork", "expressive style", "emotional depth"]
        
        # Formatter les données
        artworks_data = []
        for artwork in artworks:
            artworks_data.append({
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description or '',
                'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
                'price': float(artwork.price) if artwork.price else 0,
                'likes_count': artwork.likes_count,
                'artist': {
                    'id': artwork.artist.id,
                    'username': artwork.artist.username,
                }
            })
        
        return JsonResponse({
            'mood': mood,
            'characteristics': characteristics,
            'artworks': artworks_data,
            'count': len(artworks_data),
            'keywords_used': all_keywords[:5]  # Pour debug
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Failed to generate mood recommendations',
            'details': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def ai_art_curator(request):
    """
    AI Art Curator Chat
    POST /ai/curator-chat/
    Body: { "message": "I want abstract art with warm colors" }
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return JsonResponse({'error': 'Message is required'}, status=400)
        
        # Prompt amélioré pour l'AI curator
        prompt = f"""You are an expert art curator. A user says: "{user_message}"

Extract 4-5 specific art-related keywords from their request (styles, colors, themes, emotions, techniques).
Also write a friendly 2-sentence response.

Return ONLY valid JSON:
{{
    "response": "friendly message here",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}}
"""
        
        # Appel à Groq AI
        try:
            ai_response = call_groq_ai(prompt)
            parsed = json.loads(ai_response)
            curator_message = parsed.get('response', 'Let me find some artworks for you!')
            keywords = parsed.get('keywords', [])
        except:
            # Extraction simple de mots-clés en cas d'échec AI
            curator_message = "Based on your preferences, I've found some artworks that might interest you!"
            # Extraction basique de mots-clés
            words = user_message.lower().split()
            art_terms = ['abstract', 'modern', 'classic', 'colorful', 'warm', 'cold', 'bright', 'dark', 
                        'landscape', 'portrait', 'still life', 'vibrant', 'minimal', 'detailed']
            keywords = [word for word in words if word in art_terms][:4]
            if not keywords:
                keywords = ['popular', 'trending', 'featured']
        
        # Rechercher des artworks avec les mots-clés
        query = Q()
        for keyword in keywords:
            query |= Q(title__icontains=keyword)
            query |= Q(description__icontains=keyword)
            if hasattr(Artwork, 'category'):
                query |= Q(category__name__icontains=keyword)
        
        artworks = Artwork.objects.filter(query).distinct().annotate(
            likes_count=Count('likes', distinct=True)
        ).order_by('-likes_count')[:4]
        
        # Si pas de résultats, prendre des artworks populaires
        if not artworks.exists():
            artworks = Artwork.objects.annotate(
                likes_count=Count('likes', distinct=True)
            ).order_by('-likes_count', '-created_at')[:4]
        
        artworks_data = []
        for artwork in artworks:
            artworks_data.append({
                'id': artwork.id,
                'title': artwork.title,
                'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
                'price': float(artwork.price) if artwork.price else 0,
            })
        
        return JsonResponse({
            'message': curator_message,
            'artworks': artworks_data,
            'keywords': keywords
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Failed to process curator request',
            'details': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def ai_color_analyzer(request):
    """
    AI Color Palette Analysis
    POST /ai/color-analyzer/
    Body: { "colors": ["#FF6B6B", "#FFA07A"] }
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        data = json.loads(request.body)
        colors = data.get('colors', [])
        
        if not colors:
            return JsonResponse({'error': 'Colors array is required'}, status=400)
        
        # Analyser les couleurs
        def hex_to_rgb(hex_color):
            hex_color = hex_color.lstrip('#')
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
        def get_color_name(rgb):
            r, g, b = rgb
            if r > 200 and g < 100 and b < 100:
                return 'red'
            elif r > 200 and g > 150 and b < 100:
                return 'orange'
            elif r > 200 and g > 200 and b < 100:
                return 'yellow'
            elif r < 100 and g > 150 and b < 100:
                return 'green'
            elif r < 100 and g < 100 and b > 200:
                return 'blue'
            elif r > 150 and g < 100 and b > 150:
                return 'purple'
            elif r > 200 and g > 150 and b > 150:
                return 'pink'
            elif r < 100 and g < 100 and b < 100:
                return 'dark'
            elif r > 200 and g > 200 and b > 200:
                return 'light'
            else:
                return 'colorful'
        
        # Extraire les noms de couleurs
        color_names = []
        for hex_color in colors:
            try:
                rgb = hex_to_rgb(hex_color)
                color_names.append(get_color_name(rgb))
            except:
                continue
        
        # Appel AI pour analyse
        try:
            prompt = f"""Analyze this color palette: {', '.join(colors)}
            
Return ONLY valid JSON:
{{
    "mood": "one word emotion",
    "style": "art style",
    "keywords": ["keyword1", "keyword2", "keyword3"]
}}
"""
            ai_response = call_groq_ai(prompt)
            analysis = json.loads(ai_response)
            keywords = analysis.get('keywords', color_names)
        except:
            analysis = {
                'mood': 'vibrant',
                'style': 'contemporary',
                'keywords': color_names
            }
            keywords = color_names
        
        # Rechercher des artworks
        query = Q()
        for keyword in keywords:
            query |= Q(title__icontains=keyword)
            query |= Q(description__icontains=keyword)
        
        artworks = Artwork.objects.filter(query).distinct().annotate(
            likes_count=Count('likes', distinct=True)
        ).order_by('-likes_count')[:6]
        
        # Fallback
        if not artworks.exists():
            artworks = Artwork.objects.annotate(
                likes_count=Count('likes', distinct=True)
            ).order_by('-created_at')[:6]
        
        artworks_data = []
        for artwork in artworks:
            artworks_data.append({
                'id': artwork.id,
                'title': artwork.title,
                'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
                'description': artwork.description or '',
                'price': float(artwork.price) if artwork.price else 0,
                'category': artwork.category.name if hasattr(artwork, 'category') and artwork.category else None,
            })
        
        return JsonResponse({
            'analysis': analysis,
            'artworks': artworks_data,
            'color_names': color_names
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Failed to analyze colors',
            'details': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def ai_similarity_search(request):
    """
    Find similar artworks
    POST /ai/similarity-search/
    Body: { "artwork_id": 1, "threshold": 75 }
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        data = json.loads(request.body)
        artwork_id = data.get('artwork_id')
        threshold = data.get('threshold', 75)
        
        # Récupérer l'artwork source
        source_artwork = Artwork.objects.get(pk=artwork_id)
        
        # Trouver des artworks similaires
        query = Q()
        
        # Par catégorie
        if hasattr(source_artwork, 'category') and source_artwork.category:
            query |= Q(category=source_artwork.category)
        
        # Par style
        if hasattr(source_artwork, 'style') and source_artwork.style:
            query |= Q(style=source_artwork.style)
        
        # Par artiste
        query |= Q(artist=source_artwork.artist)
        
        # Par mots-clés dans le titre
        title_words = source_artwork.title.split()[:3]
        for word in title_words:
            if len(word) > 3:
                query |= Q(title__icontains=word)
        
        similar = Artwork.objects.filter(query).exclude(
            id=artwork_id
        ).distinct().annotate(
            likes_count=Count('likes', distinct=True)
        ).order_by('-likes_count')[:6]
        
        artworks_data = []
        for idx, artwork in enumerate(similar):
            # Calculer un score de similarité basé sur plusieurs facteurs
            score = 70
            if hasattr(artwork, 'category') and hasattr(source_artwork, 'category'):
                if artwork.category == source_artwork.category:
                    score += 15
            if hasattr(artwork, 'style') and hasattr(source_artwork, 'style'):
                if artwork.style == source_artwork.style:
                    score += 10
            if artwork.artist == source_artwork.artist:
                score += 10
            
            # Ajuster selon la popularité
            score = min(score + (idx * -2), 95)  # Décroit légèrement
            
            artworks_data.append({
                'id': artwork.id,
                'title': artwork.title,
                'image': request.build_absolute_uri(artwork.image.url) if artwork.image else None,
                'price': float(artwork.price) if artwork.price else 0,
                'similarity_score': max(threshold, score),
                'artist': {
                    'id': artwork.artist.id,
                    'username': artwork.artist.username,
                }
            })
        
        return JsonResponse({
            'source_artwork': {
                'id': source_artwork.id,
                'title': source_artwork.title,
            },
            'similar_artworks': artworks_data,
            'threshold': threshold
        })
        
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': 'Failed to find similar artworks',
            'details': str(e)
        }, status=500)