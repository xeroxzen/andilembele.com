#!/usr/bin/env python3
"""
Simple script to add blog posts to the database
"""

import os
import sys
from datetime import datetime
from sqlalchemy.orm import Session

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, User, Category, Tag, Post
from auth import get_password_hash
from utils import generate_slug, markdown_to_html, calculate_read_time

def get_or_create_category(db: Session, name: str):
    """Get existing category or create new one"""
    category = db.query(Category).filter(Category.name == name).first()
    if not category:
        category = Category(
            name=name,
            slug=generate_slug(name),
            description=f"Category for {name}"
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        print(f"Created category: {name}")
    return category

def get_or_create_tag(db: Session, name: str):
    """Get existing tag or create new one"""
    tag = db.query(Tag).filter(Tag.name == name).first()
    if not tag:
        tag = Tag(
            name=name,
            slug=generate_slug(name)
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)
        print(f"Created tag: {name}")
    return tag

def add_post(title, excerpt, content, category_name, tag_names, image_emoji="📝", is_published=True):
    """Add a new blog post"""
    db = SessionLocal()
    try:
        # Get admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("❌ Admin user not found. Run setup_db.py first.")
            return
        
        # Get or create category
        category = get_or_create_category(db, category_name)
        
        # Generate slug
        slug = generate_slug(title)
        
        # Check if slug already exists
        existing_post = db.query(Post).filter(Post.slug == slug).first()
        if existing_post:
            print(f"❌ Post with title '{title}' already exists")
            return
        
        # Convert markdown to HTML
        content_html = markdown_to_html(content)
        
        # Calculate read time
        read_time = calculate_read_time(content)
        
        # Create post
        post = Post(
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content,
            content_html=content_html,
            image_emoji=image_emoji,
            read_time=read_time,
            is_published=is_published,
            author_id=admin.id,
            category_id=category.id
        )
        
        # Handle tags
        for tag_name in tag_names:
            tag = get_or_create_tag(db, tag_name)
            post.tags.append(tag)
        
        # Set published date if publishing
        if is_published:
            post.published_at = datetime.utcnow()
        
        db.add(post)
        db.commit()
        db.refresh(post)
        
        print(f"✅ Post created successfully: {title}")
        print(f"   Slug: {slug}")
        print(f"   Category: {category_name}")
        print(f"   Tags: {', '.join(tag_names)}")
        print(f"   Published: {is_published}")
        
    except Exception as e:
        print(f"❌ Error creating post: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Interactive post creation"""
    print("📝 Blog Post Creator")
    print("=" * 50)
    
    title = input("Post title: ").strip()
    if not title:
        print("❌ Title is required")
        return
    
    excerpt = input("Post excerpt: ").strip()
    if not excerpt:
        print("❌ Excerpt is required")
        return
    
    print("\nEnter post content (markdown supported):")
    print("Type 'END' on a new line when finished:")
    content_lines = []
    while True:
        line = input()
        if line.strip() == "END":
            break
        content_lines.append(line)
    
    content = "\n".join(content_lines)
    if not content:
        print("❌ Content is required")
        return
    
    category = input("Category (e.g., Technology, AI & ML, Startup): ").strip()
    if not category:
        category = "Technology"
    
    tags_input = input("Tags (comma-separated, e.g., Python, AI, Innovation): ").strip()
    tag_names = [tag.strip() for tag in tags_input.split(",") if tag.strip()]
    
    image_emoji = input("Image emoji (default: 📝): ").strip() or "📝"
    
    publish = input("Publish immediately? (y/n, default: y): ").strip().lower()
    is_published = publish != "n"
    
    print("\n" + "=" * 50)
    add_post(title, excerpt, content, category, tag_names, image_emoji, is_published)

if __name__ == "__main__":
    main() 