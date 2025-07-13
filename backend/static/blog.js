// Blog data - In a real app, this would come from a CMS or API
const blogPosts = [
  {
    id: 1,
    title:
      "Building AI-Powered Solutions in Africa: Challenges and Opportunities",
    excerpt:
      "Exploring the unique challenges and immense opportunities of implementing AI solutions in African markets, from healthcare to fintech.",
    content: `
            <h2>The African AI Landscape</h2>
            <p>Africa presents a unique opportunity for AI innovation. With a young, tech-savvy population and pressing challenges in healthcare, agriculture, and financial inclusion, the continent is ripe for AI-powered solutions.</p>
            
            <h3>Key Challenges</h3>
            <ul>
                <li><strong>Infrastructure:</strong> Limited internet connectivity and computing resources</li>
                <li><strong>Data Quality:</strong> Scarce, unstructured, and often unreliable data</li>
                <li><strong>Regulatory Environment:</strong> Evolving and sometimes unclear AI regulations</li>
                <li><strong>Talent Gap:</strong> Shortage of AI/ML specialists in the region</li>
            </ul>
            
            <h3>Opportunities</h3>
            <p>Despite these challenges, Africa offers tremendous opportunities for AI innovation:</p>
            <ul>
                <li>Leapfrogging traditional infrastructure with mobile-first solutions</li>
                <li>Solving real-world problems with immediate impact</li>
                <li>Building solutions that can scale globally</li>
                <li>Creating employment opportunities in the tech sector</li>
            </ul>
            
            <blockquote>
                "The best AI solutions in Africa are those that solve real problems for real people, not just impressive technical demonstrations."
            </blockquote>
            
            <h3>Case Study: Project Lumina</h3>
            <p>Our AI healthcare assistant, Lumina, demonstrates how AI can be effectively deployed in African contexts:</p>
            <ul>
                <li>Multilingual support (English, Shona, Ndebele)</li>
                <li>Low-bandwidth optimization</li>
                <li>Integration with existing healthcare infrastructure</li>
                <li>87% concordance with medical professionals</li>
            </ul>
        `,
    category: "ai",
    date: "2024-12-15",
    readTime: "8 min read",
    image: "🤖",
    tags: ["AI", "Healthcare", "Africa", "Innovation"],
  },
  {
    id: 2,
    title: "The Future of Data Engineering: From ETL to Real-Time Analytics",
    excerpt:
      "How modern data engineering is evolving from traditional batch processing to real-time streaming and what this means for businesses.",
    content: `
            <h2>The Evolution of Data Engineering</h2>
            <p>Data engineering has come a long way from simple ETL pipelines. Today's data engineers are building complex, real-time systems that power everything from recommendation engines to fraud detection.</p>
            
            <h3>From Batch to Streaming</h3>
            <p>The traditional batch processing model is giving way to real-time streaming architectures. This shift enables businesses to make decisions based on current data rather than yesterday's information.</p>
            
            <h3>Key Technologies</h3>
            <ul>
                <li><strong>Apache Kafka:</strong> Distributed streaming platform</li>
                <li><strong>Apache Spark:</strong> Unified analytics engine</li>
                <li><strong>Delta Lake:</strong> ACID transactions for data lakes</li>
                <li><strong>Apache Airflow:</strong> Workflow orchestration</li>
            </ul>
            
            <h3>Real-World Impact</h3>
            <p>At District 4 Labs, we processed over 40 billion records with 90%+ PII extraction accuracy. The migration to cloud-native architecture reduced query latency by 70% and saved $120K annually.</p>
            
            <pre><code># Example: Real-time data pipeline
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
</code></pre>
        `,
    category: "engineering",
    date: "2024-12-10",
    readTime: "12 min read",
    image: "📊",
    tags: ["Data Engineering", "Real-time", "Apache Spark", "Analytics"],
  },
  {
    id: 3,
    title: "Startup Lessons: Building Optimeer Labs from Zero to Impact",
    excerpt:
      "The journey of building Optimeer Labs, the challenges we faced, and the lessons learned in creating a product innovation company.",
    content: `
            <h2>The Genesis of Optimeer Labs</h2>
            <p>Optimeer Labs was born from a simple observation: businesses were struggling with inefficient internal processes, and existing solutions were either too expensive or too complex.</p>
            
            <h3>Identifying the Problem</h3>
            <p>We started by talking to business owners and operations managers. The common pain points were:</p>
            <ul>
                <li>Manual, repetitive tasks consuming valuable time</li>
                <li>Disconnected systems creating data silos</li>
                <li>High costs of enterprise software</li>
                <li>Complex implementations requiring extensive training</li>
            </ul>
            
            <h3>Our Approach</h3>
            <p>Instead of building generic solutions, we focused on creating specialized tools for specific industries and use cases. This allowed us to:</p>
            <ul>
                <li>Deliver faster implementation times</li>
                <li>Provide better user experience</li>
                <li>Charge competitive prices</li>
                <li>Build long-term relationships</li>
            </ul>
            
            <h3>Key Success Factors</h3>
            <ol>
                <li><strong>Customer Development:</strong> We spent more time understanding problems than building solutions</li>
                <li><strong>Iterative Development:</strong> Rapid prototyping and continuous feedback loops</li>
                <li><strong>Strategic Partnerships:</strong> Collaborating with complementary service providers</li>
                <li><strong>Focus on Impact:</strong> Measuring success by client outcomes, not just revenue</li>
            </ol>
            
            <blockquote>
                "The best business ideas come from solving real problems that you've experienced firsthand."
            </blockquote>
        `,
    category: "startup",
    date: "2024-12-05",
    readTime: "10 min read",
    image: "🚀",
    tags: ["Startup", "Business", "Innovation", "Product Development"],
  },
  {
    id: 4,
    title: "The Rise of African Tech: Opportunities for Global Impact",
    excerpt:
      "How African startups are solving global problems and creating opportunities for international collaboration and investment.",
    content: `
            <h2>Africa's Tech Renaissance</h2>
            <p>Africa is experiencing a tech renaissance, with startups across the continent solving problems that have global implications. From mobile money to renewable energy, African innovations are reshaping industries worldwide.</p>
            
            <h3>Mobile-First Innovation</h3>
            <p>Africa's mobile-first approach has led to innovations that are now being adopted globally:</p>
            <ul>
                <li><strong>Mobile Money:</strong> M-Pesa revolutionized digital payments</li>
                <li><strong>Off-Grid Energy:</strong> Solar home systems for rural communities</li>
                <li><strong>E-commerce:</strong> Social commerce and community-based delivery</li>
                <li><strong>Healthcare:</strong> Telemedicine and mobile health solutions</li>
            </ul>
            
            <h3>Global Opportunities</h3>
            <p>African tech companies are increasingly looking beyond their borders:</p>
            <ul>
                <li>Expanding to other emerging markets</li>
                <li>Partnering with global tech companies</li>
                <li>Attracting international investment</li>
                <li>Exporting solutions to developed markets</li>
            </ul>
            
            <h3>Challenges and Solutions</h3>
            <p>While opportunities abound, challenges remain:</p>
            <ul>
                <li><strong>Funding:</strong> Limited access to venture capital</li>
                <li><strong>Infrastructure:</strong> Internet connectivity and power reliability</li>
                <li><strong>Regulation:</strong> Complex and sometimes conflicting regulations</li>
                <li><strong>Talent:</strong> Brain drain to developed markets</li>
            </ul>
            
            <p>However, these challenges are also creating opportunities for innovative solutions and partnerships.</p>
        `,
    category: "africa",
    date: "2024-11-30",
    readTime: "7 min read",
    image: "🌍",
    tags: ["Africa", "Innovation", "Global Tech", "Mobile"],
  },
  {
    id: 5,
    title: "Building Scalable Systems: Lessons from Processing 40B+ Records",
    excerpt:
      "Technical insights and architectural decisions from building systems that process massive amounts of data efficiently and reliably.",
    content: `
            <h2>Scaling Data Processing Systems</h2>
            <p>Processing 40 billion records requires more than just powerful hardware. It requires careful architectural decisions, optimization strategies, and a deep understanding of data processing patterns.</p>
            
            <h3>Architecture Principles</h3>
            <ul>
                <li><strong>Horizontal Scaling:</strong> Design for distributed processing from day one</li>
                <li><strong>Fault Tolerance:</strong> Build systems that can handle failures gracefully</li>
                <li><strong>Data Locality:</strong> Minimize data movement across the network</li>
                <li><strong>Monitoring:</strong> Comprehensive observability for debugging and optimization</li>
            </ul>
            
            <h3>Performance Optimization</h3>
            <p>Key strategies for processing large datasets efficiently:</p>
            <ul>
                <li><strong>Partitioning:</strong> Divide data into manageable chunks</li>
                <li><strong>Caching:</strong> Store frequently accessed data in memory</li>
                <li><strong>Compression:</strong> Reduce storage and I/O costs</li>
                <li><strong>Parallel Processing:</strong> Utilize multiple cores and nodes</li>
            </ul>
            
            <h3>Real-World Example</h3>
            <p>Our ETL pipeline at District 4 Labs achieved 1 million records/hour processing by implementing:</p>
            <pre><code># Optimized data processing pipeline
def process_chunk(data_chunk):
    # Parallel processing within each chunk
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(process_record, data_chunk))
    return results

def optimize_storage(df):
    # Reduce memory usage through data type optimization
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].astype('category')
    return df
</code></pre>
            
            <h3>Lessons Learned</h3>
            <ol>
                <li>Start with the simplest solution that works</li>
                <li>Measure performance before optimizing</li>
                <li>Design for failure and recovery</li>
                <li>Document everything, especially failure scenarios</li>
            </ol>
        `,
    category: "engineering",
    date: "2024-11-25",
    readTime: "15 min read",
    image: "⚡",
    tags: ["Scalability", "Data Processing", "Performance", "Architecture"],
  },
];

// Blog management class
class BlogManager {
  constructor() {
    this.currentPage = 1;
    this.postsPerPage = 6;
    this.currentCategory = "all";
    this.filteredPosts = [...blogPosts];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderPosts();
    this.renderPagination();
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

    // Handle blog card clicks
    document.addEventListener("click", (e) => {
      if (e.target.closest(".blog-card")) {
        const card = e.target.closest(".blog-card");
        const postId = parseInt(card.dataset.postId);
        this.showPost(postId);
      }
    });
  }

  setActiveFilter(activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll(".blog-filter").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Add active class to clicked button
    activeButton.classList.add("active");
  }

  filterPosts(category) {
    this.currentCategory = category;
    this.currentPage = 1;

    if (category === "all") {
      this.filteredPosts = [...blogPosts];
    } else {
      this.filteredPosts = blogPosts.filter(
        (post) => post.category === category
      );
    }

    this.renderPosts();
    this.renderPagination();
  }

  renderPosts() {
    const blogGrid = document.getElementById("blogGrid");
    const startIndex = (this.currentPage - 1) * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    const postsToShow = this.filteredPosts.slice(startIndex, endIndex);

    if (postsToShow.length === 0) {
      blogGrid.innerHTML = `
                <div class="blog-loading">
                    <p>No posts found in this category.</p>
                </div>
            `;
      return;
    }

    blogGrid.innerHTML = postsToShow
      .map((post) => this.createPostCard(post))
      .join("");
  }

  createPostCard(post) {
    const date = new Date(post.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
            <div class="blog-card" data-post-id="${post.id}">
                <div class="blog-image">
                    ${post.image}
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-category">${this.getCategoryName(
                          post.category
                        )}</span>
                        <span>${date}</span>
                        <span>${post.readTime}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <a href="#" class="blog-read-more">Read More →</a>
                </div>
            </div>
        `;
  }

  getCategoryName(category) {
    const categories = {
      technology: "Technology",
      ai: "AI & ML",
      startup: "Startup",
      engineering: "Engineering",
      africa: "Africa Tech",
    };
    return categories[category] || category;
  }

  renderPagination() {
    const paginationContainer = document.getElementById("blogPagination");
    const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);

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

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderPosts();
      this.renderPagination();

      // Scroll to top of blog grid
      document.getElementById("blogGrid").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  showPost(postId) {
    const post = blogPosts.find((p) => p.id === postId);
    if (!post) return;

    // Create modal for blog post
    const modal = document.createElement("div");
    modal.className = "blog-modal";
    modal.innerHTML = `
            <div class="blog-modal-content">
                <div class="blog-modal-header">
                    <button class="blog-modal-close">&times;</button>
                </div>
                <div class="blog-post">
                    <div class="blog-post-header">
                        <h1>${post.title}</h1>
                        <div class="blog-post-meta">
                            <span>${this.getCategoryName(post.category)}</span>
                            <span>${new Date(post.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}</span>
                            <span>${post.readTime}</span>
                        </div>
                    </div>
                    <div class="blog-post-content">
                        ${post.content}
                    </div>
                </div>
            </div>
        `;

    // Add modal styles
    const style = document.createElement("style");
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
        `;
    document.head.appendChild(style);

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

// Initialize blog manager when DOM is loaded
let blogManager;
document.addEventListener("DOMContentLoaded", () => {
  blogManager = new BlogManager();
});

// Add blog functionality to main page
class MainPageBlog {
  constructor() {
    this.init();
  }

  init() {
    // Only run on main page
    if (!document.getElementById("blogGrid")) return;

    this.loadFeaturedPosts();
  }

  loadFeaturedPosts() {
    const blogGrid = document.getElementById("blogGrid");
    const featuredPosts = blogPosts.slice(0, 3); // Show latest 3 posts

    blogGrid.innerHTML = featuredPosts
      .map((post) => this.createPostCard(post))
      .join("");
  }

  createPostCard(post) {
    const date = new Date(post.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
            <div class="blog-card" onclick="window.location.href='blog.html'">
                <div class="blog-image">
                    ${post.image}
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-category">${this.getCategoryName(
                          post.category
                        )}</span>
                        <span>${date}</span>
                        <span>${post.readTime}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <a href="blog.html" class="blog-read-more">Read More →</a>
                </div>
            </div>
        `;
  }

  getCategoryName(category) {
    const categories = {
      technology: "Technology",
      ai: "AI & ML",
      startup: "Startup",
      engineering: "Engineering",
      africa: "Africa Tech",
    };
    return categories[category] || category;
  }
}

// Initialize main page blog
document.addEventListener("DOMContentLoaded", () => {
  new MainPageBlog();
});
