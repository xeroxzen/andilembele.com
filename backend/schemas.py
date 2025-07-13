from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    slug: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Tag schemas
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    slug: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Post schemas
class PostBase(BaseModel):
    title: str
    excerpt: str
    content: str
    image_emoji: str = "📝"
    image_url: Optional[str] = None
    read_time: str = "5 min read"
    is_published: bool = False

class PostCreate(PostBase):
    category_id: int
    tag_names: List[str] = []

class PostUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    image_emoji: Optional[str] = None
    image_url: Optional[str] = None
    read_time: Optional[str] = None
    is_published: Optional[bool] = None
    category_id: Optional[int] = None
    tag_names: Optional[List[str]] = None

class Post(PostBase):
    id: int
    slug: str
    content_html: str
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    author: User
    category: Category
    tags: List[Tag]
    
    class Config:
        from_attributes = True

class PostList(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: str
    image_emoji: str
    read_time: str
    published_at: Optional[datetime]
    created_at: datetime
    category: Category
    tags: List[Tag]
    
    class Config:
        from_attributes = True

# API Response schemas
class BlogResponse(BaseModel):
    posts: List[PostList]
    total: int
    page: int
    pages: int
    categories: List[Category]
    tags: List[Tag]

class PostResponse(BaseModel):
    post: Post
    related_posts: List[PostList] 