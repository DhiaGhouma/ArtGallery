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
import json
from .ai_service import generate_comment_suggestions


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

@require_http_methods(["GET"])
def index(request):
    """Get all artworks with optional filters"""
    try:
        artworks = Artwork.objects.all()
        
        # Handle filters
        search = request.GET.get('search', '')
        category = request.GET.get('category', '')
        style = request.GET.get('style', '')
        featured = request.GET.get('featured', '')
        
        if search:
            artworks = artworks.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        if category and category != 'all':
            artworks = artworks.filter(category__name=category)
        if style and style != 'all':
            artworks = artworks.filter(style=style)
        if featured:
            artworks = artworks.filter(is_featured=True)
        
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
                'likes_count': artwork.likes.count(),
                'comments_count': artwork.comments.count(),
                'views': artwork.views,
                'is_featured': artwork.is_featured,
                'created_at': artwork.created_at.isoformat(),
                'updated_at': artwork.updated_at.isoformat(),
                # yosr's :
                'price': float(artwork.price) if artwork.price else 0,
                'in_stock': artwork.in_stock,



            })
        
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def artwork_detail(request, pk):
    """Get single artwork with comments"""
    try:
        artwork = Artwork.objects.get(pk=pk)
        
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
            'likes_count': artwork.likes.count(),
            'comments_count': artwork.comments.count(),
            'views': artwork.views,
            'is_liked': artwork.likes.filter(user=request.user).exists() if request.user.is_authenticated else False,
            'created_at': artwork.created_at.isoformat(),
            'updated_at': artwork.updated_at.isoformat(),
            # yosr's  :
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
                'user': {
                    'id': comment.user.id,
                    'username': comment.user.username,
                    'avatar': comment_avatar,
                },
                'created_at': comment.created_at.isoformat(),
            })
        
        return JsonResponse(data)
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
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
        
        artwork.delete()
        return JsonResponse({'message': 'Artwork deleted successfully'})
    except Artwork.DoesNotExist:
        return JsonResponse({'error': 'Artwork not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
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
        if 'is_featured' in data and request.user.is_staff:
            artwork.is_featured = data['is_featured']
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
        
        return JsonResponse({
            'liked': liked,
            'likes_count': artwork.likes.count()
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
@staff_member_required
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