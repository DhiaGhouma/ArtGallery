from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Artwork, Category, Comment, UserProfile, Like, Report


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
        fields = ['id', 'user', 'artwork', 'content', 'created_at', 'updated_at']
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
            'created_at'
        ]
        read_only_fields = ['id', 'reporter', 'created_at']
    
    def get_artwork(self, obj):
        """Get artwork details if report is for an artwork"""
        if obj.artwork:
            return {
                'id': obj.artwork.id,
                'title': obj.artwork.title,
                'image': obj.artwork.image.url if obj.artwork.image else None
            }
        return None
    
    def get_comment(self, obj):
        """Get comment details if report is for a comment"""
        if obj.comment:
            return {
                'id': obj.comment.id,
                'text': obj.comment.content,
                'user': {
                    'id': obj.comment.user.id,
                    'username': obj.comment.user.username
                }
            }
        return None


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