"""
AI Service for generating comment suggestions using Groq API
Uses Llama 3.1 for intelligent, context-aware comment generation
"""

import os
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict

# Load environment variables
load_dotenv()

# Initialize Groq client (uses OpenAI-compatible API)
client = OpenAI(
    api_key=os.getenv('GROQ_API_KEY'),
    base_url='https://api.groq.com/openai/v1'
)

# Get model from environment or use default
AI_MODEL = os.getenv('AI_MODEL', 'llama-3.3-70b-versatile')

# Fallback models if primary fails
FALLBACK_MODELS = [
    'llama-3.3-70b-versatile',  # Latest Llama 3.3
    'llama-3.1-8b-instant',      # Fast and reliable
    'mixtral-8x7b-32768',        # Good alternative
]


def generate_comment_suggestions(
    artwork_title: str,
    artwork_description: str,
    artwork_style: str,
    num_suggestions: int = 3,
    timeout: int = 10
) -> List[str]:
    """
    Generate AI-powered comment suggestions for an artwork
    
    Args:
        artwork_title: The title of the artwork
        artwork_description: Description of the artwork
        artwork_style: Style/category of the artwork
        num_suggestions: Number of suggestions to generate (default: 3)
        timeout: API timeout in seconds (default: 10)
    
    Returns:
        List of comment suggestions as strings
    
    Raises:
        Exception: If API call fails or times out
    """
    
    # Create the system prompt
    system_prompt = """You are a regular art gallery visitor writing genuine, casual comments on artworks.
Generate simple, authentic comments that sound like real people - not art critics:
- Keep it short and casual (1-2 sentences max)
- Sound like a normal person impressed by art
- Use everyday language, not fancy art terms
- Be enthusiastic but natural
- Focus on feelings and first impressions
- Vary the style (some excited, some thoughtful, some simple compliments)

Examples of good comments:
- "Wow, this is stunning! The colors really pop."
- "I love this! It makes me feel so peaceful."
- "This is amazing work, I could stare at it for hours!"
- "Beautiful piece! Really captures the mood perfectly."
- "So cool! Love the style."

Generate diverse, genuine-sounding comments that feel like they're from real gallery visitors."""

    # Create the user prompt with artwork details
    user_prompt = f"""Generate {num_suggestions} casual, enthusiastic comments for this artwork from regular people (not art experts):

Title: "{artwork_title}"
Description: {artwork_description}
Style: {artwork_style}

Write natural, simple comments. One per line, no numbering."""

    # Try primary model first, then fallbacks
    models_to_try = [AI_MODEL] + [m for m in FALLBACK_MODELS if m != AI_MODEL]
    last_error = None
    
    for model in models_to_try:
        try:
            # Call Groq API
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,  # Higher temperature for more creative/diverse suggestions
                max_tokens=300,
                timeout=timeout
            )
            
            # Extract suggestions from response
            suggestions_text = response.choices[0].message.content.strip()
            
            # Split into individual suggestions and clean them
            suggestions = [
                line.strip().lstrip('123456789.-•*) ').strip('"')
                for line in suggestions_text.split('\n')
                if line.strip() and len(line.strip()) > 10
            ]
            
            # Return requested number of suggestions
            return suggestions[:num_suggestions]
        
        except Exception as e:
            last_error = e
            print(f"Model {model} failed: {str(e)}")
            # Continue to next model
            continue
    
    # If all models failed, raise the last error
    print(f"All models failed. Last error: {str(last_error)}")
    raise Exception(f"Failed to generate suggestions: {str(last_error)}")


def generate_quick_suggestions(artwork_data: Dict) -> List[str]:
    """
    Convenience function to generate suggestions from artwork dictionary
    
    Args:
        artwork_data: Dictionary containing artwork information
    
    Returns:
        List of comment suggestions
    """
    return generate_comment_suggestions(
        artwork_title=artwork_data.get('title', 'Untitled'),
        artwork_description=artwork_data.get('description', 'An artwork'),
        artwork_style=artwork_data.get('style', 'Abstract'),
        num_suggestions=3
    )


def generate_tutorial(
    topic: str,
    skill_level: str = 'beginner',
    language: str = 'en',
    timeout: int = 30
) -> Dict[str, any]:
    """
    Generate AI-powered art tutorial
    
    Args:
        topic: The tutorial topic (e.g., "portrait drawing", "color mixing")
        skill_level: Target skill level - 'beginner', 'intermediate', or 'advanced'
        language: Tutorial language - 'en' (English), 'ar' (Arabic), or 'fr' (French)
        timeout: API timeout in seconds (default: 30)
    
    Returns:
        Dictionary containing tutorial data:
        {
            'title': str,
            'introduction': str,
            'materials': List[str],
            'steps': List[Dict[str, str]],
            'tips': List[str],
            'conclusion': str
        }
    
    Raises:
        Exception: If API call fails or times out
    """
    
    # Language configuration
    language_config = {
        'en': {
            'name': 'English',
            'instruction': 'Write the entire tutorial in English.',
        },
        'ar': {
            'name': 'Arabic',
            'instruction': 'Write the entire tutorial in Arabic (العربية). Use proper Arabic grammar and right-to-left text formatting.',
        },
        'fr': {
            'name': 'French',
            'instruction': 'Write the entire tutorial in French (Français). Use proper French grammar and accents.',
        }
    }
    
    lang_config = language_config.get(language, language_config['en'])
    
    # Create the system prompt
    system_prompt = f"""You are a master art instructor with 20+ years of teaching experience, creating in-depth, professional tutorials.

Your tutorials must be:
- Highly detailed and comprehensive with professional insights
- Include specific techniques, measurements, and technical details
- Provide expert tips that beginners won't find in basic guides
- Reference real-world examples and common mistakes to avoid
- Use precise terminology appropriate for the skill level
- Include progressive difficulty within the tutorial
- Explain the "why" behind each step, not just the "how"

IMPORTANT: {lang_config['instruction']}

Format your response as JSON with this exact structure:
{{
  "title": "Tutorial title",
  "introduction": "Engaging introduction (3-4 sentences) that explains what they'll learn and why it's important",
  "materials": ["Material 1 with specific details (e.g., '2B pencil for sketching', 'Smooth Bristol paper 11x14')", "Material 2", ...],
  "steps": [
    {{"step": 1, "title": "Step title", "description": "Detailed description (4-6 sentences) with specific techniques, measurements, common pitfalls, and professional tips"}},
    {{"step": 2, "title": "Step title", "description": "Detailed description with actionable instructions"}}
  ],
  "tips": ["Professional tip with specific details and reasoning", "Tip 2", ...],
  "conclusion": "Motivating conclusion (3-4 sentences) with next steps and practice recommendations"
}}"""

    # Create the user prompt with skill-level specific instructions
    skill_instructions = {
        'beginner': 'Focus on fundamentals, explain basic concepts clearly, avoid jargon, include encouragement',
        'intermediate': 'Assume basic knowledge, introduce advanced techniques, explain nuances, reference professional practices',
        'advanced': 'Deep technical details, professional workflows, advanced theory, industry standards, and expert-level techniques'
    }

    user_prompt = f"""Create a comprehensive, professional-quality {skill_level}-level tutorial on: {topic}

Requirements:
- 7-10 detailed steps (each with 4-6 sentences of specific instructions)
- 5-8 specific materials with details (brands, sizes, alternatives)
- 5-7 professional tips with reasoning
- {skill_instructions[skill_level]}
- Include specific measurements, ratios, or percentages where applicable
- Mention common mistakes and how to avoid them
- Add professional insights and industry practices

LANGUAGE: Write everything in {lang_config['name']}.
Make this tutorial worthy of a professional art school curriculum.
Respond ONLY with valid JSON, no additional text."""

    # Try primary model first, then fallbacks
    models_to_try = [AI_MODEL] + [m for m in FALLBACK_MODELS if m != AI_MODEL]
    last_error = None
    
    for model in models_to_try:
        try:
            # Call Groq API
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,  # Higher creativity for more detailed content
                max_tokens=4000,  # Increased for detailed tutorials
                timeout=timeout
            )
            
            # Extract and parse JSON response
            import json
            tutorial_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if tutorial_text.startswith('```'):
                tutorial_text = tutorial_text.split('```')[1]
                if tutorial_text.startswith('json'):
                    tutorial_text = tutorial_text[4:]
                tutorial_text = tutorial_text.strip()
            
            tutorial_data = json.loads(tutorial_text)
            
            # Add metadata
            tutorial_data['topic'] = topic
            tutorial_data['skill_level'] = skill_level
            tutorial_data['language'] = language
            tutorial_data['generated_by'] = 'AI'
            
            return tutorial_data
        
        except Exception as e:
            last_error = e
            print(f"Model {model} failed for tutorial generation: {str(e)}")
            continue
    
    # If all models failed, raise the last error
    print(f"All models failed for tutorial. Last error: {str(last_error)}")
    raise Exception(f"Failed to generate tutorial: {str(last_error)}")


def get_tutorial_categories() -> List[Dict[str, str]]:
    """
    Get predefined tutorial categories
    
    Returns:
        List of tutorial categories with topics
    """
    return [
        {
            'id': 'drawing-basics',
            'name': 'Drawing Basics',
            'icon': '✏️',
            'topics': [
                'Basic shapes and forms',
                'Line control and confidence',
                'Shading techniques',
                'Proportions and measurements'
            ]
        },
        {
            'id': 'color-theory',
            'name': 'Color Theory',
            'icon': '🌈',
            'topics': [
                'Color wheel fundamentals',
                'Color mixing basics',
                'Complementary colors',
                'Warm and cool colors'
            ]
        },
        {
            'id': 'perspective',
            'name': 'Perspective',
            'icon': '📐',
            'topics': [
                'One-point perspective',
                'Two-point perspective',
                'Three-point perspective',
                'Atmospheric perspective'
            ]
        },
        {
            'id': 'portraits',
            'name': 'Portrait Drawing',
            'icon': '👤',
            'topics': [
                'Facial proportions',
                'Drawing eyes',
                'Drawing noses and mouths',
                'Hair rendering'
            ]
        },
        {
            'id': 'digital-art',
            'name': 'Digital Art',
            'icon': '🎨',
            'topics': [
                'Digital brush techniques',
                'Layer management',
                'Digital coloring',
                'Blending modes'
            ]
        },
        {
            'id': 'painting',
            'name': 'Painting',
            'icon': '🖌️',
            'topics': [
                'Brush control',
                'Paint consistency',
                'Wet-on-wet technique',
                'Glazing and layering'
            ]
        }
    ]


# Test function (for development/debugging)
if __name__ == "__main__":
    # Test the service
    test_suggestions = generate_comment_suggestions(
        artwork_title="Abstract Dreams",
        artwork_description="A vibrant abstract piece featuring flowing colors and dynamic shapes",
        artwork_style="Abstract"
    )
    
    print("Generated Suggestions:")
    for i, suggestion in enumerate(test_suggestions, 1):
        print(f"{i}. {suggestion}")
