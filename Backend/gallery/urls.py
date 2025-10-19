from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('artwork/<int:pk>/', views.artwork_detail, name='artwork_detail'),
    path('upload/', views.upload_artwork, name='upload_artwork'),
    path('artwork/<int:pk>/like/', views.toggle_like, name='toggle_like'),
    path('artwork/<int:pk>/comment/', views.add_comment, name='add_comment'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('check-auth/', views.check_auth, name='check_auth'),
    path('profile/avatar/', views.upload_avatar, name='upload_avatar'),  
    path('profile/', views.profile, name='profile'),
    path('profile/<str:username>/', views.profile, name='user_profile'),
    # Reports endpoints
    path('reports/', views.reports_list, name='reports_list'),  # GET all reports / POST create report
    path('reports/artwork/<int:artwork_id>/', views.report_artwork, name='report_artwork'),  # POST report artwork
    path('reports/comment/<int:comment_id>/', views.report_comment, name='report_comment'),  # POST report comment
    path('reports/<int:report_id>/resolve/', views.take_action, name='resolve_report'),  # POST take action / resolve report
]