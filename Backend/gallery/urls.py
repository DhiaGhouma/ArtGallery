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
    path('profile/', views.profile, name='profile'),
    path('profile/<str:username>/', views.profile, name='user_profile'),
]