import requests
from django.conf import settings

def call_grock_api(user, uploads, total_likes, total_views):
    payload = {
        "username": user.username,
        "uploads": uploads,
        "likes": total_likes,
        "views": total_views,
        "prompt": "Évalue cet utilisateur et donne un score et un badge"
    }
    
    headers = {
        "Authorization": f"Bearer {settings.GROCK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.post("https://api.grock.ai/v1/evaluate", json=payload, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Grock API error: {response.text}")
