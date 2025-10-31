import os
from groq import Groq
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import OuterRef, Subquery, IntegerField , FloatField
from gallery.models import Artwork
from .models import Evaluation
from django.contrib.auth.models import User
import json
from dotenv import load_dotenv
from openai import OpenAI
import re

# Initialisation du client Groq
load_dotenv()

# Initialiser le client Groq
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),  # Assure-toi que c’est bien GROQ_API_KEY dans ton .env
    base_url="https://api.groq.com/openai/v1"
)

AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")

# ================== Liste des utilisateurs avec score ==================
@api_view(['GET'])
def get_all_evaluations(request):
    last_eval = Evaluation.objects.filter(user=OuterRef('pk')).order_by('-date_evaluated')
    users = (
        User.objects.all()
        .annotate(
            score=Subquery(last_eval.values('score')[:1], output_field=FloatField()),
            badge=Subquery(last_eval.values('badge')[:1]),
            date_evaluated=Subquery(last_eval.values('date_evaluated')[:1]),
        )
        .order_by('-score')
    )

    data = [
        {
            "id": user.id,
            "username": user.username,
            "score": user.score or 0,
            "badge": user.badge or "Non évalué",
            "last_evaluated": user.date_evaluated,
        }
        for user in users
    ]
    return Response(data)

# ================== Évaluation d'un utilisateur via Groq ==================
@api_view(['POST'])
def evaluate_user(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    # Récupération des stats de l'artiste
    artworks = Artwork.objects.filter(artist=user)
    uploads = artworks.count()
    total_likes = sum(a.likes.count() for a in artworks)
    total_views = sum(a.views for a in artworks)

    # Prompt envoyé à l’IA
    prompt = f"""
    Tu es un assistant d'évaluation artistique IA.
    Voici les statistiques d'un artiste :
    - Nombre d'œuvres publiées : {uploads}
    - Total de likes reçus : {total_likes}
    - Total de vues : {total_views}

    Donne un score sur 100 et attribue un badge créatif.
    Retourne le résultat uniquement sous ce format JSON :
    {{
        "score": <nombre>,
        "badge": "<texte court>",
        "description": "<phrase valorisante>"
    }}
    """

    try:
        completion = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "Tu es un assistant d'évaluation artistique IA."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )

        ai_response = completion.choices[0].message.content.strip()

        # 🔹 Extraire le JSON depuis la réponse brute
        json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
        if not json_match:
            print("Impossible de trouver un bloc JSON dans la réponse IA:", ai_response)
            return Response({'error': 'La réponse IA ne contient pas de JSON valide'}, status=500)

        ai_data = json.loads(json_match.group())

        score = ai_data.get("score", 0)
        badge = ai_data.get("badge", "🎨 Artiste en herbe")
        description = ai_data.get("description", "Un talent prometteur !")

    except Exception as e:
        print("Erreur IA:", e)
        return Response({'error': 'Erreur lors de la communication avec Groq'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Mise à jour ou création de l’évaluation
    Evaluation.objects.update_or_create(
        user=user,
        defaults={
            'score': score,
            'badge': badge,
            'description': description
        }
    )

    return Response({
        'user': user.username,
        'score': score,
        'badge': badge,
        'description': description
    })