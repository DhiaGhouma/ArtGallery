from django.contrib import admin
from .models import Category, Artwork, Like, Comment, UserProfile

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'category', 'style', 'is_featured', 'created_at']
    list_filter = ['category', 'style', 'is_featured', 'created_at']
    search_fields = ['title', 'artist__username']
    list_editable = ['is_featured']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'artwork', 'created_at']
    list_filter = ['created_at']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'location']