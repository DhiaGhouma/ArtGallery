from django.urls import path
from .views import get_all_evaluations, evaluate_user

urlpatterns = [
    # Liste de tous les utilisateurs avec leur dernière évaluation
    path('evaluations/all/', get_all_evaluations, name='get_all_evaluations'),

    # Évaluer un utilisateur spécifique
    path('evaluations/<int:user_id>/evaluate/', evaluate_user, name='evaluate_user'),
]
