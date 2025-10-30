"""
AI Service for generating comment suggestions using Groq API
Uses Llama 3.1 for intelligent, context-aware comment generation
"""

import os
#from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict

# Load environment variables
load_dotenv()

# Initialize Groq client (uses OpenAI-compatible API)
#client = OpenAI(
 #   api_key=os.getenv('GROQ_API_KEY'),
  #  base_url='https://api.groq.com/openai/v1'
#)

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
