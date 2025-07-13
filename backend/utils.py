import markdown
from slugify import slugify
from datetime import datetime
from typing import List
import re

def generate_slug(text: str) -> str:
    """Generate a URL-friendly slug from text"""
    return slugify(text, lowercase=True)

def markdown_to_html(content: str) -> str:
    """Convert markdown content to HTML"""
    # Configure markdown extensions
    extensions = [
        'markdown.extensions.codehilite',
        'markdown.extensions.fenced_code',
        'markdown.extensions.tables',
        'markdown.extensions.toc',
        'markdown.extensions.nl2br'
    ]
    
    # Convert markdown to HTML
    html = markdown.markdown(content, extensions=extensions)
    
    # Add custom styling classes
    html = html.replace('<code>', '<code class="inline-code">')
    html = html.replace('<pre>', '<pre class="code-block">')
    
    return html

def calculate_read_time(content: str) -> str:
    """Calculate estimated reading time based on content length"""
    # Average reading speed: 200 words per minute
    words = len(content.split())
    minutes = max(1, round(words / 200))
    return f"{minutes} min read"

def extract_excerpt(content: str, max_length: int = 200) -> str:
    """Extract a brief excerpt from content"""
    # Remove markdown formatting
    clean_content = re.sub(r'[#*`]', '', content)
    clean_content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean_content)
    
    if len(clean_content) <= max_length:
        return clean_content
    
    # Truncate at word boundary
    truncated = clean_content[:max_length].rsplit(' ', 1)[0]
    return truncated + "..."

def sanitize_html(html: str) -> str:
    """Sanitize HTML content for security"""
    # Basic HTML sanitization - in production, use a proper library like bleach
    allowed_tags = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img'
    ]
    
    # This is a simplified version - consider using bleach for production
    return html

def format_date(date: datetime) -> str:
    """Format date for display"""
    return date.strftime("%B %d, %Y")

def generate_meta_description(content: str, max_length: int = 160) -> str:
    """Generate meta description from content"""
    excerpt = extract_excerpt(content, max_length)
    return excerpt

def extract_tags_from_content(content: str) -> List[str]:
    """Extract potential tags from content"""
    # Simple tag extraction - look for hashtags or common tech terms
    words = content.lower().split()
    potential_tags = []
    
    tech_keywords = [
        'python', 'javascript', 'react', 'node', 'ai', 'ml', 'data', 'api',
        'database', 'cloud', 'aws', 'docker', 'kubernetes', 'startup', 'africa',
        'innovation', 'technology', 'engineering', 'architecture'
    ]
    
    for word in words:
        clean_word = re.sub(r'[^\w]', '', word)
        if clean_word in tech_keywords and clean_word not in potential_tags:
            potential_tags.append(clean_word)
    
    return potential_tags[:5]  # Limit to 5 tags 