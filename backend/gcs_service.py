import os
import uuid
from datetime import datetime
from typing import Optional
from google.cloud import storage
from google.cloud.exceptions import NotFound
import mimetypes

class GCSService:
    def __init__(self):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME", "portfolio-blog-images")
        self.project_id = os.getenv("GCS_PROJECT_ID")
        
        # Initialize GCS client with error handling
        try:
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                # Use service account key file
                self.client = storage.Client()
            else:
                # Use default credentials (for local development)
                self.client = storage.Client()
            
            self.bucket = self.client.bucket(self.bucket_name)
            self.gcs_available = True
        except Exception as e:
            print(f"⚠️  GCS not available: {e}")
            print("📝 Image uploads will be disabled. Set up GCS credentials to enable.")
            self.gcs_available = False
            self.client = None
            self.bucket = None
    
    def upload_image(self, file_data: bytes, filename: str, content_type: Optional[str] = None) -> str:
        """
        Upload an image to GCS and return the public URL
        
        Args:
            file_data: Image file bytes
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            Public URL of the uploaded image
        """
        if not self.gcs_available:
            raise Exception("GCS is not available. Please set up GCS credentials.")
        
        # Generate unique filename
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"blog-images/{datetime.now().strftime('%Y/%m')}/{uuid.uuid4()}{file_extension}"
        
        # Create blob
        blob = self.bucket.blob(unique_filename)
        
        # Set content type if provided
        if content_type:
            blob.content_type = content_type
        else:
            # Try to guess content type
            guessed_type, _ = mimetypes.guess_type(filename)
            if guessed_type:
                blob.content_type = guessed_type
        
        # Upload file
        blob.upload_from_string(file_data)
        
        # Make blob publicly readable
        blob.make_public()
        
        return blob.public_url
    
    def delete_image(self, image_url: str) -> bool:
        """
        Delete an image from GCS
        
        Args:
            image_url: Public URL of the image to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.gcs_available:
            return False
            
        try:
            # Extract blob name from URL
            # URL format: https://storage.googleapis.com/BUCKET_NAME/BLOB_NAME
            blob_name = image_url.split(f"{self.bucket_name}/")[1]
            blob = self.bucket.blob(blob_name)
            blob.delete()
            return True
        except (IndexError, NotFound):
            return False
    
    def get_image_url(self, image_url: str) -> str:
        """
        Get the public URL for an image (for backward compatibility)
        
        Args:
            image_url: Image URL (could be GCS URL or other)
            
        Returns:
            Public URL
        """
        return image_url
    
    def validate_image_file(self, filename: str, max_size_mb: int = 5) -> tuple[bool, str]:
        """
        Validate image file
        
        Args:
            filename: Name of the file
            max_size_mb: Maximum file size in MB
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        file_extension = os.path.splitext(filename.lower())[1]
        
        if file_extension not in allowed_extensions:
            return False, f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        
        return True, ""

# Global GCS service instance
gcs_service = GCSService() 