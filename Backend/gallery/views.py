from django.http import JsonResponse
from .models import Artwork, Report, Comment  # ou le chemin correct si models.py est ailleurs
from .forms import ReportForm
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
import json
from .models import Artwork, Comment, Like, Category, UserProfile


@require_http_methods(["GET"])
def index(request):
    """Get all artworks with optional filters"""
    try:
        artworks = Artwork.objects.all()
        
        # Handle filters
        search = request.GET.get('search', '')
        category = request.GET.get('category', '')
        style = request.GET.get('style', '')
        
        if search:
            artworks = artworks.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        if category:
            artworks = artworks.filter(category__name=category)
        if style:
            artworks = artworks.filter(style=style)
        
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
                'views': artwork.views,
                'is_featured': artwork.is_featured,
                'created_at': artwork.created_at.isoformat(),
                'updated_at': artwork.updated_at.isoformat(),
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
            'views': artwork.views,
            'is_liked': artwork.likes.filter(user=request.user).exists() if request.user.is_authenticated else False,
            'created_at': artwork.created_at.isoformat(),
            'updated_at': artwork.updated_at.isoformat(),
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
        # Debug logging
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"User: {request.user}")
        print(f"Session key: {request.session.session_key}")
        
        # Check if user is authenticated (for API, not using @login_required)
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Authentication required',
                'debug': {
                    'user': str(request.user),
                    'authenticated': request.user.is_authenticated,
                    'session_key': request.session.session_key
                }
            }, status=401)
        
        from .models import Artwork, Category
        
        # Get form data
        title = request.POST.get('title')
        description = request.POST.get('description')
        category_name = request.POST.get('category')
        style = request.POST.get('style')
        image = request.FILES.get('image')
        
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
            artist=request.user
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
            
            # Get user profile
            try:
                profile = UserProfile.objects.get(user=user)
                avatar = request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
            except UserProfile.DoesNotExist:
                avatar = None
            
            return JsonResponse({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'avatar': avatar,
                }
            })
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """Logout user"""
    try:
        from django.contrib.auth import logout
        logout(request)
        return JsonResponse({'message': 'Logout successful'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def check_auth(request):
    """Check if user is authenticated"""
    if request.user.is_authenticated:
        try:
            profile = UserProfile.objects.get(user=request.user)
            avatar = request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        except UserProfile.DoesNotExist:
            avatar = None
        
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'avatar': avatar,
            }
        })
    else:
        return JsonResponse({'authenticated': False})


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
                user = request.user
            
            # Get or create profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            avatar = None
            if profile.avatar:
                avatar = request.build_absolute_uri(profile.avatar.url)
            
            return JsonResponse({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'avatar': avatar,
                'bio': profile.bio,
                'location': profile.location,
                'website': profile.website,
                'artworks_count': user.artworks.count(),
            })
        
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
    
    
@login_required
def report_artwork(request, artwork_id):
    artwork = get_object_or_404(Artwork, id=artwork_id)

    if request.method == 'POST':
        form = ReportForm(request.POST)
        if form.is_valid():
            report = form.save(commit=False)
            report.user = request.user
            report.artwork = artwork
            report.save()
            messages.success(request, "Report submitted successfully.")
            return redirect(artwork.get_absolute_url())
    else:
        form = ReportForm(initial={'artwork': artwork})

    return render(request, 'reports/report_form.html', {'form': form, 'artwork': artwork})


@login_required
def report_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)

    if request.method == 'POST':
        form = ReportForm(request.POST)
        if form.is_valid():
            report = form.save(commit=False)
            report.user = request.user
            report.comment = comment
            report.save()
            messages.success(request, "Report submitted successfully.")
            return redirect(comment.artwork.get_absolute_url())
    else:
        form = ReportForm(initial={'comment': comment})

    return render(request, 'reports/report_form.html', {'form': form, 'comment': comment})


# Admin view pour lister tous les reports
from django.contrib.admin.views.decorators import staff_member_required

@staff_member_required
def reports_list(request):
    reports = Report.objects.all().order_by('-created_at')
    return render(request, 'reports/report_list.html', {'reports': reports})

@staff_member_required
def take_action(request, report_id):
    """
    Permet à un staff/admin de prendre une action sur un report.
    Actions possibles via POST:
    - resolve: marque le report comme résolu
    - delete_artwork: supprime l'artwork signalé
    - delete_comment: supprime le commentaire signalé
    """
    report = get_object_or_404(Report, id=report_id)

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'resolve':
            report.resolved = True
            report.save()
            return JsonResponse({'status': 'success', 'message': 'Report resolved'})
        elif action == 'delete_artwork':
            report.artwork.delete()
            report.resolved = True
            report.save()
            return JsonResponse({'status': 'success', 'message': 'Artwork deleted'})
        elif action == 'delete_comment' and report.comment:
            report.comment.delete()
            report.resolved = True
            report.save()
            return JsonResponse({'status': 'success', 'message': 'Comment deleted'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Invalid action'})
    return JsonResponse({'status': 'error', 'message': 'POST method required'})