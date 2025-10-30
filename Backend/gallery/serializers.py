from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Artwork, Category, Comment, UserProfile, Like, Report, Discussion, Reply
from django.http import JsonResponse


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with profile fields"""
    bio = serializers.CharField(source='userprofile.bio', read_only=True, allow_blank=True)
    location = serializers.CharField(source='userprofile.location', read_only=True, allow_blank=True)
    website = serializers.URLField(source='userprofile.website', read_only=True, allow_blank=True)
    avatar = serializers.ImageField(source='userprofile.avatar', read_only=True)
    artworks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'is_staff',  # Include is_staff for admin checks
            'bio', 
            'location', 
            'website', 
            'avatar',
            'artworks_count'
        ]
        read_only_fields = ['id', 'is_staff']  # is_staff should not be editable via API
    
    def get_artworks_count(self, obj):
        """Get the count of artworks for this user"""
        return obj.artworks.count()


class SimpleUserSerializer(serializers.ModelSerializer):
    """Simplified user serializer for nested representations"""
    avatar = serializers.ImageField(source='userprofile.avatar', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']
        read_only_fields = ['id', 'username']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    
    class Meta:
        model = Category
        fields = '__all__'


class ArtworkSerializer(serializers.ModelSerializer):
    """Serializer for Artwork model"""
    artist = SimpleUserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Artwork
        fields = [
            'id',
            'title',
            'description',
            'image',
            'category',
            'category_id',
            'style',
            'artist',
            'likes_count',
            'comments_count',
            'views',
            'is_liked',
            'is_featured',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'artist', 'views', 'created_at', 'updated_at']

    def get_likes_count(self, obj):
        """Get the count of likes for this artwork"""
        return obj.likes.count()
    
    def get_comments_count(self, obj):
        """Get the count of comments for this artwork"""
        return obj.comments.count()
    
    def get_is_liked(self, obj):
        """Check if the current user has liked this artwork"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment model"""
    user = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'artwork', 'content','is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model"""
    reporter = SimpleUserSerializer(read_only=True)
    artwork = serializers.SerializerMethodField()
    comment = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id',
            'reporter',
            'artwork',
            'comment',
            'reason',
            'description',
            'resolved',
            'created_at',
            # 'resolved_at',  # si tu l’exposes au front
        ]
        read_only_fields = ['id', 'reporter', 'created_at']

    def get_artwork(self, obj):
        """
        Retourne l’œuvre prioritairement depuis report.artwork,
        sinon fallback sur report.comment.artwork pour les reports 'comment-only'.
        """
        art = getattr(obj, 'artwork', None)
        if art is None and getattr(obj, 'comment', None) is not None:
            art = getattr(obj.comment, 'artwork', None)
        if art is None:
            return None

        # image: gère FileField/ImageField .url ou string
        def img_url(a):
            img = getattr(a, 'image', None)
            if hasattr(img, 'url'):
                return img.url
            return img if isinstance(img, str) else None

        artist = getattr(art, 'artist', None)
        artist_dict = None
        if artist is not None:
            artist_dict = {
                'id': getattr(artist, 'id', None),
                'username': getattr(artist, 'username', None),
            }

        return {
            'id': getattr(art, 'id', None),
            'title': getattr(art, 'title', None),
            'image': img_url(art),
            'artist': artist_dict,  # utile pour "ban user" côté admin
        }
    

    def get_comment(self, obj):
        """
        Retourne le commentaire si présent, avec un sous-objet artwork minimal
        (utile pour l’admin UI quand report.artwork est nul).
        """
        c = getattr(obj, 'comment', None)
        if c is None:
            return None

        # sécurise artwork imbriqué si disponible
        art = getattr(c, 'artwork', None)

        def img_url(a):
            if not a:
                return None
            img = getattr(a, 'image', None)
            if hasattr(img, 'url'):
                return img.url
            return img if isinstance(img, str) else None

        return {
            'id': getattr(c, 'id', None),
            'text': getattr(c, 'text', None),
            'artwork': {
                'id': getattr(art, 'id', None),
                'title': getattr(art, 'title', None) if art else None,
                'image': img_url(art),
            } if art else None,
        }
        return None
    def list_reports(request):
        reports = Report.objects.all()
        serializer = ReportSerializer(reports, many=True, context={'request': request})
        return JsonResponse(serializer.data, safe=False)


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
    
    def validate_email(self, value):
        """Check if email is already in use"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Check if username is already in use"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def create(self, validated_data):
        """Create a new user with hashed password"""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        # Create associated UserProfile
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    bio = serializers.CharField(required=False, allow_blank=True, max_length=500)
    location = serializers.CharField(required=False, allow_blank=True, max_length=30)
    website = serializers.URLField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'bio', 'location', 'website']
    
    def update(self, instance, validated_data):
        """Update user and profile fields"""
        # Extract profile fields
        profile_data = {
            'bio': validated_data.pop('bio', None),
            'location': validated_data.pop('location', None),
            'website': validated_data.pop('website', None),
        }
        
        # Update user fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        
        # Update or create profile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        for field, value in profile_data.items():
            if value is not None:
                setattr(profile, field, value)
        profile.save()
        
        return instance


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin serializer for managing users"""
    artworks_count = serializers.SerializerMethodField()
    last_login = serializers.DateTimeField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'is_staff',
            'is_active',
            'last_login',
            'date_joined',
            'artworks_count'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_artworks_count(self, obj):
        """Get the count of artworks for this user"""
        return obj.artworks.count()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'text', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Support both 'content' and 'text' fields
        if hasattr(instance, 'content'):
            representation['text'] = instance.content
            representation['content'] = instance.content
        return representation

class ArtworkSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    category = serializers.StringRelatedField()
    
    class Meta:
        model = Artwork
        fields = [
            'id', 'title', 'description', 'image', 'artist',
            'category', 'style', 'likes_count', 'comments_count',
            'views', 'is_liked', 'is_featured', 'comments',
            'created_at', 'updated_at'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        user = self.context.get('user')
        
        if not user or not user.is_authenticated:
            return False
        
        # Check if already annotated (for optimization)
        if hasattr(obj, 'user_has_liked'):
            return obj.user_has_liked
        
        # Otherwise query
        return Like.objects.filter(user=user, artwork=obj).exists()
