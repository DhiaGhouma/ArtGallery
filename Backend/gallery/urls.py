from django.urls import path ,include
from . import views

urlpatterns = [
    # Artworks
    path('artworks/', views.index, name='artworks'),
    path('artworks/<int:pk>/', views.artwork_detail, name='artwork_detail'),
    path('artworks/upload/', views.upload_artwork, name='upload_artwork'),
    path('artworks/<int:pk>/delete/', views.delete_artwork, name='delete_artwork'),
    path('artworks/<int:pk>/like/', views.toggle_like, name='toggle_like'),
    path('artworks/<int:pk>/comment/', views.add_comment, name='add_comment'),
    path('artworks/<int:pk>/suggest-comments/', views.suggest_comments, name='suggest_comments'),
    
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

    # Evaluation (IA)
    path('evaluation/', include('evaluation.urls')),
]