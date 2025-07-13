from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os

from database import get_db, User, Post, Category, Tag
from schemas import PostCreate, PostUpdate, Post as PostSchema, PostList, BlogResponse, PostResponse
from auth import get_current_admin_user, create_access_token, verify_password, get_password_hash
from utils import generate_slug, markdown_to_html, calculate_read_time, extract_excerpt
from gcs_service import gcs_service

app = FastAPI(
    title="Andile Mbele Blog API",
    description="API for managing blog content",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve admin interface
@app.get("/admin")
async def admin_interface():
    """Serve the admin interface"""
    from fastapi.responses import FileResponse
    return FileResponse("static/admin.html")

# Blog API endpoints
@app.get("/api/blog", response_model=BlogResponse)
async def get_blog_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(6, ge=1, le=20),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get paginated blog posts with filtering"""
    query = db.query(Post).filter(Post.is_published == True)
    
    # Apply filters
    if category:
        query = query.join(Category).filter(Category.slug == category)
    
    if tag:
        query = query.join(Post.tags).filter(Tag.slug == tag)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Post.title.ilike(search_filter)) |
            (Post.excerpt.ilike(search_filter)) |
            (Post.content.ilike(search_filter))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    posts = query.order_by(Post.published_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    # Get categories and tags for sidebar
    categories = db.query(Category).all()
    tags = db.query(Tag).all()
    
    return BlogResponse(
        posts=posts,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit,
        categories=categories,
        tags=tags
    )

@app.get("/api/blog/{slug}", response_model=PostResponse)
async def get_blog_post(slug: str, db: Session = Depends(get_db)):
    """Get a single blog post by slug"""
    post = db.query(Post).filter(Post.slug == slug, Post.is_published == True).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get related posts (same category, excluding current post)
    related_posts = db.query(Post).filter(
        Post.category_id == post.category_id,
        Post.id != post.id,
        Post.is_published == True
    ).order_by(Post.published_at.desc()).limit(3).all()
    
    return PostResponse(post=post, related_posts=related_posts)

print("Registering featured posts endpoint")
@app.get("/api/blog/featured", response_model=List[PostList])
async def get_featured_posts(db: Session = Depends(get_db)):
    """Get featured blog posts for homepage"""
    posts = db.query(Post).filter(
        Post.is_published == True
    ).order_by(Post.published_at.desc()).limit(3).all()
    
    return posts

# Admin endpoints
@app.post("/api/admin/login")
async def admin_login(username: str = Query(...), password: str = Query(...), db: Session = Depends(get_db)):
    """Admin login endpoint"""
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/admin/posts", response_model=PostSchema)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new blog post"""
    # Generate slug
    slug = generate_slug(post_data.title)
    
    # Check if slug already exists
    existing_post = db.query(Post).filter(Post.slug == slug).first()
    if existing_post:
        raise HTTPException(status_code=400, detail="Post with this title already exists")
    
    # Convert markdown to HTML
    content_html = markdown_to_html(post_data.content)
    
    # Calculate read time
    read_time = calculate_read_time(post_data.content)
    
    # Create post
    post = Post(
        title=post_data.title,
        slug=slug,
        excerpt=post_data.excerpt,
        content=post_data.content,
        content_html=content_html,
        image_emoji=post_data.image_emoji,
        image_url=post_data.image_url,
        read_time=read_time,
        is_published=post_data.is_published,
        author_id=current_user.id,
        category_id=post_data.category_id
    )
    
    # Handle tags
    for tag_name in post_data.tag_names:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name, slug=generate_slug(tag_name))
            db.add(tag)
        post.tags.append(tag)
    
    # Set published date if publishing
    if post_data.is_published:
        post.published_at = datetime.utcnow()
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    return post

@app.put("/api/admin/posts/{post_id}", response_model=PostSchema)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update an existing blog post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Update fields
    if post_data.title is not None:
        post.title = post_data.title
        post.slug = generate_slug(post_data.title)
    
    if post_data.excerpt is not None:
        post.excerpt = post_data.excerpt
    
    if post_data.content is not None:
        post.content = post_data.content
        post.content_html = markdown_to_html(post_data.content)
        post.read_time = calculate_read_time(post_data.content)
    
    if post_data.image_emoji is not None:
        post.image_emoji = post_data.image_emoji
    
    if post_data.read_time is not None:
        post.read_time = post_data.read_time
    
    if post_data.category_id is not None:
        post.category_id = post_data.category_id
    
    # Handle publishing
    if post_data.is_published is not None:
        post.is_published = post_data.is_published
        if post_data.is_published and not post.published_at:
            post.published_at = datetime.utcnow()
    
    # Handle tags
    if post_data.tag_names is not None:
        post.tags.clear()
        for tag_name in post_data.tag_names:
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name, slug=generate_slug(tag_name))
                db.add(tag)
            post.tags.append(tag)
    
    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)
    
    return post

@app.delete("/api/admin/posts/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a blog post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}

@app.get("/api/admin/posts", response_model=List[PostSchema])
async def get_all_posts(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all posts (including drafts) for admin"""
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return posts

# Category management
@app.post("/api/admin/categories")
async def create_category(
    name: str,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    slug = generate_slug(name)
    
    existing_category = db.query(Category).filter(Category.slug == slug).first()
    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category = Category(name=name, slug=slug, description=description)
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category

# Image upload endpoint
@app.post("/api/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user)
):
    """Upload an image to GCS"""
    try:
        # Validate file
        is_valid, error_message = gcs_service.validate_image_file(file.filename)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Check file size (5MB limit)
        file_data = await file.read()
        if len(file_data) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="File size too large. Maximum 5MB allowed.")
        
        # Upload to GCS
        image_url = gcs_service.upload_image(
            file_data=file_data,
            filename=file.filename,
            content_type=file.content_type
        )
        
        return {"image_url": image_url, "filename": file.filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# Health check
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 