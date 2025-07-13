// Blog API client for fetching data from the backend
class BlogAPI {
  constructor() {
    this.baseURL = "http://localhost:8001/api";
    this.currentPage = 1;
    this.currentCategory = "all";
    this.currentTag = null;
    this.searchQuery = null;
  }

  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async getBlogPosts(
    page = 1,
    limit = 6,
    category = null,
    tag = null,
    search = null
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category && category !== "all") {
      params.append("category", category);
    }

    if (tag) {
      params.append("tag", tag);
    }

    if (search) {
      params.append("search", search);
    }

    const url = `${this.baseURL}/blog?${params.toString()}`;
    return await this.fetchWithErrorHandling(url);
  }

  async getFeaturedPosts() {
    const url = `${this.baseURL}/blog/featured`;
    return await this.fetchWithErrorHandling(url);
  }

  async getBlogPost(slug) {
    const url = `${this.baseURL}/blog/${slug}`;
    return await this.fetchWithErrorHandling(url);
  }

  async searchPosts(query) {
    return await this.getBlogPosts(1, 6, null, null, query);
  }
}

// Blog manager using API
class BlogManagerAPI {
  constructor() {
    this.api = new BlogAPI();
    this.currentPage = 1;
    this.currentCategory = "all";
    this.currentTag = null;
    this.searchQuery = null;
    this.blogData = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadBlogData();
  }

  setupEventListeners() {
    // Category filter buttons
    const filterButtons = document.querySelectorAll(".blog-filter");
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.setActiveFilter(button);
        this.filterPosts(button.dataset.category);
      });
    });

    // Search functionality
    const searchInput = document.getElementById("blogSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.debounce(() => this.performSearch(), 500)();
      });
    }

    // Handle blog card clicks
    document.addEventListener("click", (e) => {
      if (e.target.closest(".blog-card")) {
        const card = e.target.closest(".blog-card");
        const slug = card.dataset.slug;
        if (slug) {
          this.showPost(slug);
        }
      }
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  setActiveFilter(activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll(".blog-filter").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Add active class to clicked button
    activeButton.classList.add("active");
  }

  async filterPosts(category) {
    this.currentCategory = category;
    this.currentPage = 1;
    await this.loadBlogData();
  }

  async performSearch() {
    if (!this.searchQuery || this.searchQuery.trim() === "") {
      await this.loadBlogData();
      return;
    }

    try {
      const searchResults = await this.api.searchPosts(this.searchQuery);
      this.renderPosts(searchResults);
      this.renderPagination(searchResults);
    } catch (error) {
      this.showError("Search failed. Please try again.");
    }
  }

  async loadBlogData() {
    try {
      this.showLoading();

      const data = await this.api.getBlogPosts(
        this.currentPage,
        6,
        this.currentCategory === "all" ? null : this.currentCategory,
        this.currentTag,
        this.searchQuery
      );

      this.blogData = data;
      this.renderPosts(data);
      this.renderPagination(data);
      this.renderSidebar(data);
    } catch (error) {
      this.showError("Failed to load blog posts. Please try again.");
    }
  }

  showLoading() {
    const blogGrid = document.getElementById("blogGrid");
    if (blogGrid) {
      blogGrid.innerHTML = `
                <div class="blog-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading articles...</p>
                </div>
            `;
    }
  }

  showError(message) {
    const blogGrid = document.getElementById("blogGrid");
    if (blogGrid) {
      blogGrid.innerHTML = `
                <div class="blog-loading">
                    <p style="color: #ef4444;">${message}</p>
                    <button onclick="blogManager.loadBlogData()" class="btn btn-primary">Retry</button>
                </div>
            `;
    }
  }

  renderPosts(data) {
    const blogGrid = document.getElementById("blogGrid");
    if (!blogGrid) return;

    if (!data.posts || data.posts.length === 0) {
      blogGrid.innerHTML = `
                <div class="blog-loading">
                    <p>No posts found in this category.</p>
                </div>
            `;
      return;
    }

    blogGrid.innerHTML = data.posts
      .map((post) => this.createPostCard(post))
      .join("");
  }

  createPostCard(post) {
    const date = new Date(
      post.published_at || post.created_at
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
            <div class="blog-card" data-slug="${post.slug}">
                <div class="blog-image">
                    ${post.image_emoji}
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-category">${post.category.name}</span>
                        <span>${date}</span>
                        <span>${post.read_time}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <div class="blog-tags">
                        ${post.tags
                          .map(
                            (tag) => `<span class="blog-tag">${tag.name}</span>`
                          )
                          .join("")}
                    </div>
                    <a href="#" class="blog-read-more">Read More →</a>
                </div>
            </div>
        `;
  }

  renderPagination(data) {
    const paginationContainer = document.getElementById("blogPagination");
    if (!paginationContainer) return;

    const totalPages = data.pages;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let paginationHTML = "";

    // Previous button
    paginationHTML += `
            <button class="pagination-btn" ${
              this.currentPage === 1 ? "disabled" : ""
            } 
                    onclick="blogManager.goToPage(${this.currentPage - 1})">
                Previous
            </button>
        `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= this.currentPage - 1 && i <= this.currentPage + 1)
      ) {
        paginationHTML += `
                    <button class="pagination-btn ${
                      i === this.currentPage ? "active" : ""
                    }" 
                            onclick="blogManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        paginationHTML += '<span class="pagination-btn">...</span>';
      }
    }

    // Next button
    paginationHTML += `
            <button class="pagination-btn" ${
              this.currentPage === totalPages ? "disabled" : ""
            } 
                    onclick="blogManager.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;

    paginationContainer.innerHTML = paginationHTML;
  }

  renderSidebar(data) {
    // Render categories and tags if sidebar exists
    const categoriesContainer = document.getElementById("blogCategories");
    const tagsContainer = document.getElementById("blogTags");

    if (categoriesContainer && data.categories) {
      categoriesContainer.innerHTML = data.categories
        .map(
          (category) => `
                <a href="#" class="sidebar-item" onclick="blogManager.filterPosts('${category.slug}')">
                    ${category.name}
                </a>
            `
        )
        .join("");
    }

    if (tagsContainer && data.tags) {
      tagsContainer.innerHTML = data.tags
        .map(
          (tag) => `
                <a href="#" class="sidebar-item" onclick="blogManager.filterByTag('${tag.slug}')">
                    ${tag.name}
                </a>
            `
        )
        .join("");
    }
  }

  async goToPage(page) {
    const totalPages = this.blogData ? this.blogData.pages : 1;
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      await this.loadBlogData();

      // Scroll to top of blog grid
      const blogGrid = document.getElementById("blogGrid");
      if (blogGrid) {
        blogGrid.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }

  async filterByTag(tagSlug) {
    this.currentTag = tagSlug;
    this.currentPage = 1;
    await this.loadBlogData();
  }

  async showPost(slug) {
    try {
      const data = await this.api.getBlogPost(slug);
      this.showPostModal(data);
    } catch (error) {
      this.showError("Failed to load post. Please try again.");
    }
  }

  showPostModal(data) {
    const modal = document.createElement("div");
    modal.className = "blog-modal";
    modal.innerHTML = `
            <div class="blog-modal-content">
                <div class="blog-modal-header">
                    <button class="blog-modal-close">&times;</button>
                </div>
                <div class="blog-post">
                    <div class="blog-post-header">
                        <h1>${data.post.title}</h1>
                        <div class="blog-post-meta">
                            <span>${data.post.category.name}</span>
                            <span>${new Date(
                              data.post.published_at || data.post.created_at
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}</span>
                            <span>${data.post.read_time}</span>
                        </div>
                    </div>
                    <div class="blog-post-content">
                        ${data.post.content_html}
                    </div>
                    ${
                      data.related_posts.length > 0
                        ? `
                        <div class="related-posts">
                            <h3>Related Posts</h3>
                            <div class="related-posts-grid">
                                ${data.related_posts
                                  .map(
                                    (post) => `
                                    <div class="related-post-card" onclick="blogManager.showPost('${post.slug}')">
                                        <h4>${post.title}</h4>
                                        <p>${post.excerpt}</p>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;

    // Add modal styles if not already present
    if (!document.getElementById("blog-modal-styles")) {
      const style = document.createElement("style");
      style.id = "blog-modal-styles";
      style.textContent = `
                .blog-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                
                .blog-modal-content {
                    background-color: var(--bg-primary);
                    border-radius: 1rem;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    width: 100%;
                }
                
                .blog-modal-header {
                    position: sticky;
                    top: 0;
                    background-color: var(--bg-primary);
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    text-align: right;
                }
                
                .blog-modal-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: var(--text-secondary);
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }
                
                .blog-modal-close:hover {
                    background-color: var(--bg-secondary);
                    color: var(--text-primary);
                }

                .blog-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .blog-tag {
                    background-color: var(--accent-tertiary);
                    color: var(--accent-primary);
                    padding: 0.25rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .related-posts {
                    margin-top: 3rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border-color);
                }

                .related-posts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .related-post-card {
                    background-color: var(--bg-secondary);
                    padding: 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .related-post-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
            `;
      document.head.appendChild(style);
    }

    // Add event listeners
    modal.querySelector(".blog-modal-close").addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document.body.appendChild(modal);
  }
}

// Main page blog integration
class MainPageBlogAPI {
  constructor() {
    this.api = new BlogAPI();
    this.init();
  }

  init() {
    // Only run on main page
    if (!document.getElementById("blogGrid")) return;

    this.loadFeaturedPosts();
  }

  async loadFeaturedPosts() {
    try {
      const posts = await this.api.getFeaturedPosts();
      this.renderFeaturedPosts(posts);
    } catch (error) {
      console.error("Failed to load featured posts:", error);
      this.showError();
    }
  }

  renderFeaturedPosts(posts) {
    const blogGrid = document.getElementById("blogGrid");
    if (!blogGrid) return;

    blogGrid.innerHTML = posts
      .map((post) => this.createPostCard(post))
      .join("");
  }

  createPostCard(post) {
    const date = new Date(
      post.published_at || post.created_at
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
            <div class="blog-card" onclick="window.location.href='blog.html'">
                <div class="blog-image">
                    ${post.image_emoji}
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-category">${post.category.name}</span>
                        <span>${date}</span>
                        <span>${post.read_time}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <a href="blog.html" class="blog-read-more">Read More →</a>
                </div>
            </div>
        `;
  }

  showError() {
    const blogGrid = document.getElementById("blogGrid");
    if (blogGrid) {
      blogGrid.innerHTML = `
                <div class="blog-loading">
                    <p>Unable to load featured posts.</p>
                </div>
            `;
    }
  }
}

// Initialize blog managers when DOM is loaded
let blogManager;
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on the blog page
  if (
    document.getElementById("blogGrid") &&
    window.location.pathname.includes("blog")
  ) {
    blogManager = new BlogManagerAPI();
  } else {
    new MainPageBlogAPI();
  }
});
