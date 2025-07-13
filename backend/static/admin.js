// Admin interface for managing blog content
class AdminManager {
  constructor() {
    this.apiBaseURL = "http://localhost:8001/api";
    this.token = localStorage.getItem("admin_token");
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById("adminLoginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.login();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.logout();
      });
    }

    // Tab switching
    const tabs = document.querySelectorAll(".admin-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // New post form
    const newPostForm = document.getElementById("newPostForm");
    if (newPostForm) {
      newPostForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.createPost();
      });
    }

    // Image upload
    const imageFileInput = document.getElementById("postImageFile");
    if (imageFileInput) {
      imageFileInput.addEventListener("change", (e) => {
        this.handleImageUpload(e.target.files[0]);
      });
    }

    // New category form
    const newCategoryForm = document.getElementById("newCategoryForm");
    if (newCategoryForm) {
      newCategoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.createCategory();
      });
    }
  }

  checkAuth() {
    if (this.token) {
      this.showAdminInterface();
      this.loadPosts();
      this.loadCategories();
    } else {
      this.showLoginForm();
    }
  }

  async login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch(
        `${this.apiBaseURL}/admin/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem("admin_token", this.token);

      this.showAdminInterface();
      this.loadPosts();
      this.loadCategories();
    } catch (error) {
      alert("Login failed. Please check your credentials.");
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem("admin_token");
    this.showLoginForm();
  }

  showLoginForm() {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("adminInterface").style.display = "none";
  }

  showAdminInterface() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("adminInterface").style.display = "block";
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".admin-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update content
    document.querySelectorAll(".admin-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${tabName}Tab`).classList.add("active");
  }

  async loadPosts() {
    try {
      const response = await fetch(`${this.apiBaseURL}/admin/posts`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load posts");
      }

      const posts = await response.json();
      this.renderPosts(posts);
    } catch (error) {
      console.error("Error loading posts:", error);
      this.showError("Failed to load posts");
    }
  }

  renderPosts(posts) {
    const postsList = document.getElementById("postsList");
    if (!postsList) return;

    if (posts.length === 0) {
      postsList.innerHTML = `
                <div class="post-item">
                    <div class="post-info">
                        <h3>No posts found</h3>
                        <div class="post-meta">Create your first post!</div>
                    </div>
                </div>
            `;
      return;
    }

    postsList.innerHTML = posts
      .map(
        (post) => `
            <div class="post-item">
                <div class="post-info">
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                        ${post.is_published ? "✅ Published" : "📝 Draft"} • 
                        ${post.category ? post.category.name : "No category"} • 
                        ${new Date(post.created_at).toLocaleDateString()}
                    </div>
                </div>
                <div class="post-actions">
                    <button class="btn btn-small btn-secondary" onclick="adminManager.editPost(${
                      post.id
                    })">
                        Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="adminManager.deletePost(${
                      post.id
                    })">
                        Delete
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  async loadCategories() {
    try {
      const response = await fetch(`${this.apiBaseURL}/blog`);
      if (!response.ok) {
        throw new Error("Failed to load categories");
      }

      const data = await response.json();
      this.renderCategoryOptions(data.categories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  renderCategoryOptions(categories) {
    const categorySelect = document.getElementById("postCategory");
    if (!categorySelect) return;

    categorySelect.innerHTML =
      '<option value="">Select category</option>' +
      categories
        .map(
          (category) =>
            `<option value="${category.id}">${category.name}</option>`
        )
        .join("");
  }

  async createPost() {
    const formData = new FormData(document.getElementById("newPostForm"));

    const postData = {
      title: formData.get("title"),
      excerpt: formData.get("excerpt"),
      content: formData.get("content"),
      image_emoji: formData.get("image_emoji"),
      image_url: this.currentImageUrl || null,
      category_id: parseInt(formData.get("category_id")),
      tag_names: formData
        .get("tag_names")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      is_published: formData.get("is_published") === "on",
    };

    try {
      const response = await fetch(`${this.apiBaseURL}/admin/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      alert("Post created successfully!");
      this.clearForm();
      this.loadPosts();
      this.switchTab("posts");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  }

  async createCategory() {
    const formData = new FormData(document.getElementById("newCategoryForm"));

    const categoryData = {
      name: formData.get("name"),
      description: formData.get("description"),
    };

    try {
      const response = await fetch(`${this.apiBaseURL}/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.token}`,
        },
        body: `name=${encodeURIComponent(
          categoryData.name
        )}&description=${encodeURIComponent(categoryData.description || "")}`,
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      alert("Category created successfully!");
      document.getElementById("newCategoryForm").reset();
      this.loadCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    }
  }

  async deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseURL}/admin/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      alert("Post deleted successfully!");
      this.loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  }

  async handleImageUpload(file) {
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Maximum 5MB allowed.");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert(
        "File type not allowed. Please upload JPG, PNG, GIF, or WebP images."
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${this.apiBaseURL}/admin/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      // Show preview
      this.showImagePreview(data.image_url, file.name);

      // Store image URL for form submission
      this.currentImageUrl = data.image_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }
  }

  showImagePreview(imageUrl, filename) {
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    const imageUrlText = document.getElementById("imageUrl");

    previewImg.src = imageUrl;
    imageUrlText.textContent = `Uploaded: ${filename}`;
    preview.style.display = "block";
  }

  clearForm() {
    document.getElementById("newPostForm").reset();
    document.getElementById("imagePreview").style.display = "none";
    this.currentImageUrl = null;
  }

  showError(message) {
    const postsList = document.getElementById("postsList");
    if (postsList) {
      postsList.innerHTML = `
                <div class="post-item">
                    <div class="post-info">
                        <h3>Error</h3>
                        <div class="post-meta">${message}</div>
                    </div>
                </div>
            `;
    }
  }
}

// Initialize admin manager
let adminManager;
document.addEventListener("DOMContentLoaded", () => {
  adminManager = new AdminManager();
});
