import os
import json
from groq import Groq

def call_groq_ai(prompt, model="llama-3.1-8b-instant", temperature=0.7, max_tokens=500):
    """
    Appelle l'API Groq pour générer une réponse AI
    
    Args:
        prompt (str): Le prompt à envoyer à l'AI
        model (str): Le modèle Groq à utiliser
        temperature (float): Température de génération (0-1)
        max_tokens (int): Nombre maximum de tokens
        
    Returns:
        str: La réponse de l'AI
    """
    try:
        # Récupérer la clé API depuis les variables d'environnement
        api_key = os.getenv('GROQ_API_KEY')
        
        if not api_key:
            print("Warning: GROQ_API_KEY not found in environment variables")
            # Retourner une réponse par défaut si pas de clé
            return json.dumps({
                "response": "I'd be happy to help you find the perfect artwork!",
                "keywords": ["abstract", "colorful", "modern"]
            })
        
        # Initialiser le client Groq
        client = Groq(api_key=api_key)
        
        # Créer la completion
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful art curator assistant. Always respond with valid JSON only, no markdown, no code blocks, no explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        # Extraire la réponse
        response = chat_completion.choices[0].message.content.strip()
        
        # Nettoyer la réponse (enlever les markdown code blocks si présents)
        if response.startswith("```json"):
            response = response.replace("```json", "").replace("```", "").strip()
        elif response.startswith("```"):
            response = response.replace("```", "").strip()
        
        return response
        
    except Exception as e:
        print(f"Error calling Groq AI: {str(e)}")
        # Retourner une réponse par défaut en cas d'erreur
        return json.dumps({
            "response": "Let me help you discover some amazing artworks!",
            "keywords": ["popular", "trending", "featured"]
        })


def extract_keywords_from_text(text, max_keywords=5):
    """
    Extrait des mots-clés d'un texte pour la recherche d'artworks
    
    Args:
        text (str): Le texte à analyser
        max_keywords (int): Nombre maximum de mots-clés
        
    Returns:
        list: Liste de mots-clés
    """
    # Liste de termes artistiques communs
    art_terms = [
        # Styles
        'abstract', 'modern', 'contemporary', 'classic', 'impressionist',
        'minimalist', 'expressionist', 'cubist', 'surreal', 'realistic',
        'pop art', 'street art', 'digital', 'traditional',
        
        # Couleurs
        'colorful', 'vibrant', 'bright', 'dark', 'light', 'warm', 'cold',
        'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange',
        'black', 'white', 'grey', 'brown', 'gold', 'silver',
        
        # Émotions/Ambiance
        'happy', 'sad', 'calm', 'energetic', 'peaceful', 'dramatic',
        'mysterious', 'romantic', 'melancholic', 'joyful', 'serene',
        
        # Sujets
        'landscape', 'portrait', 'still life', 'nature', 'urban',
        'animal', 'people', 'architecture', 'flowers', 'sea', 'sky',
        
        # Techniques
        'painting', 'drawing', 'sculpture', 'photography', 'mixed media',
        'watercolor', 'oil', 'acrylic', 'digital art', 'collage'
    ]
    
    # Convertir en minuscules et diviser
    words = text.lower().split()
    
    # Extraire les mots-clés pertinents
    keywords = []
    for word in words:
        # Nettoyer la ponctuation
        clean_word = word.strip('.,!?;:()"\'')
        
        # Vérifier si c'est un terme artistique
        if clean_word in art_terms and clean_word not in keywords:
            keywords.append(clean_word)
            
        # Vérifier les termes composés
        if len(keywords) < max_keywords:
            for term in art_terms:
                if ' ' in term and term in text.lower() and term not in keywords:
                    keywords.append(term)
    
    # Si pas assez de mots-clés, retourner des termes génériques
    if len(keywords) < 2:
        keywords.extend(['popular', 'featured'])
    
    return keywords[:max_keywords]