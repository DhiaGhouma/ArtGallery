from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Artwork, Category, Comment, UserProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ArtworkSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Artwork
        fields = '__all__'

    def get_likes_count(self, obj):
        return obj.likes.count()

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
