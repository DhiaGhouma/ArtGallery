from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Evaluation
from .serializers import EvaluationSerializer
from gallery.models import Artwork, Like  # si ton app gallery est utilisée

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all().order_by('-date_evaluated')
    serializer_class = EvaluationSerializer

    # Endpoint spécial pour calculer une évaluation IA
    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Calcul du score basé sur les contributions
        uploads = Artwork.objects.filter(artist=user).count()
        total_likes = sum(art.likes.count() for art in Artwork.objects.filter(artist=user))
        total_views = sum(art.views for art in Artwork.objects.filter(artist=user))

        score = uploads * 5 + total_likes * 2 + total_views * 0.1

        # Logique IA pour badge
        if score > 200:
            badge = '🌟 Master Creator'
            description = 'Un artiste légendaire dont les créations rayonnent partout.'
        elif score > 100:
            badge = '🔥 Rising Star'
            description = 'Un créateur prometteur au talent en pleine ascension.'
        elif score > 50:
            badge = '✨ Emerging Artist'
            description = 'Un artiste passionné qui commence à se faire remarquer.'
        else:
            badge = '🎨 Newcomer'
            description = 'Un nouveau talent prêt à briller.'

        # Crée ou met à jour l’évaluation
        evaluation, _ = Evaluation.objects.update_or_create(
            user=user,
            defaults={'score': score, 'badge': badge, 'description': description}
        )

        serializer = EvaluationSerializer(evaluation)
        return Response(serializer.data, status=status.HTTP_200_OK)

