from django.urls import path ,include
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Artworks
    path('artworks/', views.index, name='artworks'),
    path('artworks/upload/', views.upload_artwork, name='upload_artwork'),
    path('artworks/<int:pk>/', views.artwork_detail_update_delete, name='artwork_detail'),
    path('artworks/<int:pk>/update/', views.update_artwork, name='update_artwork'),  # Add this
    path('artworks/<int:pk>/delete/', views.delete_artwork, name='delete_artwork'),
    path('artworks/<int:pk>/like/', views.toggle_like, name='toggle_like'),
    path('artworks/<int:pk>/comment/', views.add_comment, name='add_comment'),
    path('artworks/<int:pk>/suggest-comments/', views.suggest_comments, name='suggest_comments'),
    #techniques
    path('generate-technique/', views.generate_art_technique, name='generate_art_technique'),
    
    path('artworks/<int:pk>/update/', views.update_artwork, name='update_artwork'),
    path('artworks/generate-description/', views.generate_description, name='generate_description'),

    # Comments
    path('comments/<int:pk>/', views.delete_comment, name='delete_comment'),
    
    # Auth
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/check/', views.check_auth, name='check_auth'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/profile/avatar/', views.upload_avatar, name='upload_avatar'),
    
    # Users
    path('users/<str:username>/', views.profile, name='user_profile'),
    
    # Reports
    path('reports/', views.create_report, name='create_report'),
    path('reports/all/', views.get_reports, name='get_reports'),
    path('reports/<int:report_id>/resolve/', views.resolve_report, name='resolve_report'),
    path('users/<int:user_id>/ban/', views.ban_user, name='ban_user'),

    
    
    # Admin
    path('admin/users/', views.get_all_users, name='get_all_users'),
    path('admin/stats/', views.get_admin_stats, name='get_admin_stats'),
    
    # Categories
    path('categories/', views.get_categories, name='get_categories'),

    # Tutorials
    path('tutorials/categories/', views.get_tutorial_categories, name='get_tutorial_categories'),
    path('tutorials/generate/', views.generate_ai_tutorial, name='generate_ai_tutorial'),

    # Evaluation (IA)
    path('evaluation/', include('evaluation.urls')),

    # ============ AI Experience Routes ============
    path('ai/mood-matcher/', views.ai_mood_matcher, name='ai_mood_matcher'),
    path('ai/curator-chat/', views.ai_art_curator, name='ai_art_curator'),
    path('ai/color-analyzer/', views.ai_color_analyzer, name='ai_color_analyzer'),
    path('ai/similarity-search/', views.ai_similarity_search, name='ai_similarity_search'),    
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)