#!/usr/bin/env python3
"""
Database setup script for Andile Mbele's blog
This script initializes the database with sample data and creates an admin user.
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

def create_admin_user(db: Session):
    """Create an admin user"""
    # Check if admin user already exists
    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        print("Admin user already exists")
        return admin
    
    # Create admin user
    admin = User(
        username="admin",
        email="andilembele020@gmail.com",
        hashed_password=get_password_hash("admin123"),  # Change this in production!
        is_active=True,
        is_admin=True
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Created admin user: {admin.username}")
    return admin

def create_categories(db: Session):
    """Create default categories"""
    categories_data = [
        {"name": "Technology", "description": "General technology topics"},
        {"name": "AI & ML", "description": "Artificial Intelligence and Machine Learning"},
        {"name": "Startup", "description": "Entrepreneurship and startup experiences"},
        {"name": "Engineering", "description": "Technical engineering topics"},
        {"name": "Africa Tech", "description": "African technology and innovation"}
    ]
    
    categories = {}
    for cat_data in categories_data:
        # Check if category already exists
        existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if existing:
            categories[cat_data["name"]] = existing
            continue
        
        category = Category(
            name=cat_data["name"],
            slug=generate_slug(cat_data["name"]),
            description=cat_data["description"]
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        categories[cat_data["name"]] = category
        print(f"Created category: {category.name}")
    
    return categories

def create_tags(db: Session):
    """Create default tags"""
    tags_data = [
        "Python", "JavaScript", "React", "Node.js", "AI", "ML", "Data Engineering",
        "Startup", "Africa", "Innovation", "Technology", "Engineering", "API",
        "Database", "Cloud", "AWS", "Docker", "Kubernetes"
    ]
    
    tags = {}
    for tag_name in tags_data:
        # Check if tag already exists
        existing = db.query(Tag).filter(Tag.name == tag_name).first()
        if existing:
            tags[tag_name] = existing
            continue
        
        tag = Tag(
            name=tag_name,
            slug=generate_slug(tag_name)
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)
        tags[tag_name] = tag
        print(f"Created tag: {tag.name}")
    
    return tags

def create_sample_posts(db: Session, admin: User, categories: dict, tags: dict):
    """Create sample blog posts"""
    sample_posts = [
        {
            "title": "Building AI-Powered Solutions in Africa: Challenges and Opportunities",
            "excerpt": "Exploring the unique challenges and immense opportunities of implementing AI solutions in African markets, from healthcare to fintech.",
            "content": """# The African AI Landscape

Africa presents a unique opportunity for AI innovation. With a young, tech-savvy population and pressing challenges in healthcare, agriculture, and financial inclusion, the continent is ripe for AI-powered solutions.

## Key Challenges

- **Infrastructure**: Limited internet connectivity and computing resources
- **Data Quality**: Scarce, unstructured, and often unreliable data
- **Regulatory Environment**: Evolving and sometimes unclear AI regulations
- **Talent Gap**: Shortage of AI/ML specialists in the region

## Opportunities

Despite these challenges, Africa offers tremendous opportunities for AI innovation:

- Leapfrogging traditional infrastructure with mobile-first solutions
- Solving real-world problems with immediate impact
- Building solutions that can scale globally
- Creating employment opportunities in the tech sector

> "The best AI solutions in Africa are those that solve real problems for real people, not just impressive technical demonstrations."

## Case Study: Project Lumina

Our AI healthcare assistant, Lumina, demonstrates how AI can be effectively deployed in African contexts:

- Multilingual support (English, Shona, Ndebele)
- Low-bandwidth optimization
- Integration with existing healthcare infrastructure
- 87% concordance with medical professionals""",
            "category": "AI & ML",
            "tags": ["AI", "Healthcare", "Africa", "Innovation"],
            "image_emoji": "🤖"
        },
        {
            "title": "The Future of Data Engineering: From ETL to Real-Time Analytics",
            "excerpt": "How modern data engineering is evolving from traditional batch processing to real-time streaming and what this means for businesses.",
            "content": """# The Evolution of Data Engineering

Data engineering has come a long way from simple ETL pipelines. Today's data engineers are building complex, real-time systems that power everything from recommendation engines to fraud detection.

## From Batch to Streaming

The traditional batch processing model is giving way to real-time streaming architectures. This shift enables businesses to make decisions based on current data rather than yesterday's information.

## Key Technologies

- **Apache Kafka**: Distributed streaming platform
- **Apache Spark**: Unified analytics engine
- **Delta Lake**: ACID transactions for data lakes
- **Apache Airflow**: Workflow orchestration

## Real-World Impact

At District 4 Labs, we processed over 40 billion records with 90%+ PII extraction accuracy. The migration to cloud-native architecture reduced query latency by 70% and saved $120K annually.

```python
# Example: Real-time data pipeline
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \\
    .appName("RealTimeAnalytics") \\
    .getOrCreate()

# Stream processing
streaming_df = spark.readStream \\
    .format("kafka") \\
    .option("kafka.bootstrap.servers", "localhost:9092") \\
    .option("subscribe", "user-events") \\
    .load()

# Real-time aggregations
windowed_counts = streaming_df \\
    .groupBy(window("timestamp", "5 minutes")) \\
    .count()
```""",
            "category": "Engineering",
            "tags": ["Data Engineering", "Real-time", "Apache Spark", "Analytics"],
            "image_emoji": "📊"
        },
        {
            "title": "Startup Lessons: Building Optimeer Labs from Zero to Impact",
            "excerpt": "The journey of building Optimeer Labs, the challenges we faced, and the lessons learned in creating a product innovation company.",
            "content": """# The Genesis of Optimeer Labs

Optimeer Labs was born from a simple observation: businesses were struggling with inefficient internal processes, and existing solutions were either too expensive or too complex.

## Identifying the Problem

We started by talking to business owners and operations managers. The common pain points were:

- Manual, repetitive tasks consuming valuable time
- Disconnected systems creating data silos
- High costs of enterprise software
- Complex implementations requiring extensive training

## Our Approach

Instead of building generic solutions, we focused on creating specialized tools for specific industries and use cases. This allowed us to:

- Deliver faster implementation times
- Provide better user experience
- Charge competitive prices
- Build long-term relationships

## Key Success Factors

1. **Customer Development**: We spent more time understanding problems than building solutions
2. **Iterative Development**: Rapid prototyping and continuous feedback loops
3. **Strategic Partnerships**: Collaborating with complementary service providers
4. **Focus on Impact**: Measuring success by client outcomes, not just revenue

> "The best business ideas come from solving real problems that you've experienced firsthand." """,
            "category": "Startup",
            "tags": ["Startup", "Business", "Innovation", "Product Development"],
            "image_emoji": "🚀"
        }
    ]
    
    for post_data in sample_posts:
        # Check if post already exists
        existing = db.query(Post).filter(Post.title == post_data["title"]).first()
        if existing:
            print(f"Post already exists: {post_data['title']}")
            continue
        
        # Convert markdown to HTML
        content_html = markdown_to_html(post_data["content"])
        
        # Calculate read time
        read_time = calculate_read_time(post_data["content"])
        
        # Create post
        post = Post(
            title=post_data["title"],
            slug=generate_slug(post_data["title"]),
            excerpt=post_data["excerpt"],
            content=post_data["content"],
            content_html=content_html,
            image_emoji=post_data["image_emoji"],
            read_time=read_time,
            is_published=True,
            published_at=datetime.utcnow(),
            author_id=admin.id,
            category_id=categories[post_data["category"]].id
        )
        
        # Add tags
        for tag_name in post_data["tags"]:
            if tag_name in tags:
                post.tags.append(tags[tag_name])
        
        db.add(post)
        db.commit()
        db.refresh(post)
        print(f"Created post: {post.title}")

def main():
    """Main setup function"""
    print("Setting up Andile Mbele's blog database...")
    
    db = SessionLocal()
    try:
        # Create admin user
        admin = create_admin_user(db)
        
        # Create categories
        categories = create_categories(db)
        
        # Create tags
        tags = create_tags(db)
        
        # Create sample posts
        create_sample_posts(db, admin, categories, tags)
        
        print("\n✅ Database setup completed successfully!")
        print("\n📝 Admin credentials:")
        print("   Username: admin")
        print("   Password: admin123")
        print("   ⚠️  Change this password in production!")
        
        print("\n🚀 Next steps:")
        print("   1. Start the API server: python main.py")
        print("   2. Access the API docs: http://localhost:8000/docs")
        print("   3. Update your frontend to use the API endpoints")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main() 