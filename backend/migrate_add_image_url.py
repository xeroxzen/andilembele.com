#!/usr/bin/env python3
"""
Migration script to add image_url column to posts table
"""

import os
import sys
from sqlalchemy import text

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

def migrate_add_image_url():
    """Add image_url column to posts table"""
    print("🔄 Adding image_url column to posts table...")
    
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'posts' AND column_name = 'image_url'
            """))
            
            if result.fetchone():
                print("✅ image_url column already exists")
                return
            
            # Add the column
            conn.execute(text("ALTER TABLE posts ADD COLUMN image_url VARCHAR"))
            conn.commit()
            
            print("✅ Successfully added image_url column to posts table")
            
    except Exception as e:
        print(f"❌ Error adding image_url column: {e}")
        raise

if __name__ == "__main__":
    migrate_add_image_url() 