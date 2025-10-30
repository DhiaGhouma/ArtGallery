"""
AI Service for generating artwork descriptions using Groq API
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Utiliser VOTRE clé pour les descriptions
client = OpenAI(
    api_key=os.getenv('GROQ_API_KEY_DESCRIPTION'),  # ← Votre clé
    base_url='https://api.groq.com/openai/v1'
)

AI_MODEL = os.getenv('AI_MODEL', 'llama-3.3-70b-versatile')


def generate_artwork_description(title: str, category: str = None, style: str = None, max_length: int = 150) -> str:
    """
    Generate an attractive description for an artwork
    
    Args:
        title: The artwork title
        category: Category of the artwork (optional)
        style: Style of the artwork (optional)
        max_length: Maximum description length in characters
    
    Returns:
        Generated description as string
    """
    
    system_prompt = """You are a professional art gallery curator writing engaging artwork descriptions.
Create compelling, artistic descriptions that:
- Are concise but evocative (2-3 sentences)
- Capture the essence and mood of the artwork
- Use vivid, sensory language
- Appeal to potential buyers
- Sound natural and authentic
- Avoid clichés and overly technical jargon"""

    category_part = f" in the {category} category" if category else ""
    style_part = f" with a {style} style" if style else ""
    
    user_prompt = f"""Generate a captivating marketplace description for an artwork titled "{title}"{category_part}{style_part}.

Write a description that will make people want to see and purchase this piece. Maximum {max_length} characters."""

    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=200,
            timeout=10
        )
        
        description = response.choices[0].message.content.strip()
        
        # Trim to max length if needed
        if len(description) > max_length:
            description = description[:max_length].rsplit(' ', 1)[0] + '...'
        
        return description
        
    except Exception as e:
        print(f"AI description generation error: {str(e)}")
        return f"A captivating {style or ''} artwork titled '{title}'{category_part}."


def generate_multiple_descriptions(title: str, category: str = None, style: str = None, count: int = 3) -> list:
    """
    Generate multiple description options
    
    Returns:
        List of description strings
    """
    descriptions = []
    for _ in range(count):
        desc = generate_artwork_description(title, category, style)
        if desc and desc not in descriptions:
            descriptions.append(desc)
    
    return descriptions