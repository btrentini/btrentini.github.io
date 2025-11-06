/* static/js/blog.js */

class BlogManager {
  constructor() {
    this.posts = [];
    this.filteredPosts = [];
    this.currentPage = 1;
    // Set posts per page based on screen size (mobile: 2, desktop: 5)
    this.postsPerPage = this.isMobile() ? 2 : 5;
    this.currentFilter = 'all'; // 'all', or specific topic
    this.searchQuery = '';
    this.blogList = document.getElementById('blogList');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.pageInfo = document.getElementById('pageInfo');
    this.searchInput = document.getElementById('blogSearch');
    this.clearSearchBtn = document.getElementById('clearSearch');
    this.filterContainer = null;

    // Domain logo mapping with better image handling
    this.domainLogos = {
      'medium.com': 'https://logo.clearbit.com/medium.com',
      'developer.nvidia.com': 'https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/01-nvidia-logo-vert-500x200-2c50-d.png',
      'www.youtube.com': 'https://logo.clearbit.com/youtube.com',
      'www.linkedin.com': 'https://logo.clearbit.com/linkedin.com',
      'docs.google.com': 'https://logo.clearbit.com/google.com',
      'drive.google.com': 'https://logo.clearbit.com/google.com'
    };
  }

  isMobile() {
    // Check if screen width is less than 768px (typical mobile breakpoint)
    return window.innerWidth < 768;
  }

  async init() {
    await this.loadPosts();
    this.createFilters();
    this.setupEventListeners();
    this.setupSearchListener();
    this.applyFilter();
  }

  async loadPosts() {
    // Load external blog posts from JSON file
    const externalPosts = await this.loadExternalPosts();

    // Add thumbnails to external posts (prioritize hero, then enhanced thumbnails)
    for (const post of externalPosts) {
      post.thumbnail = post.hero || await this.getEnhancedThumbnail(post);
    }

    // Load internal posts from posts folder if it exists
    try {
      const internalPosts = await this.loadInternalPosts();
      this.posts = [...internalPosts, ...externalPosts];
    } catch (error) {
      console.warn('Could not load internal posts:', error);
      this.posts = externalPosts;
    }

    // Sort by date (newest first)
    this.posts.sort((a, b) => new Date(b.date || '2020-01-01') - new Date(a.date || '2020-01-01'));

    // Initialize filtered posts
    this.filteredPosts = [...this.posts];
  }

  getDefaultLogo(domain) {
    // Return a generic logo based on domain or a default
    return `https://logo.clearbit.com/${domain}`;
  }

  async getEnhancedThumbnail(post) {
    const url = post.url;

    // Check if post has a custom thumbnail specified
    if (post.thumbnail) {
      return post.thumbnail;
    }

    // YouTube: Get actual video thumbnail
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeVideoId(url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // Google Drive: Try to get preview image
    if (url.includes('drive.google.com')) {
      const fileId = this.extractGoogleDriveFileId(url);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
      }
    }

    // Use domain logo
    const urlObj = new URL(url);
    const logoUrl = this.domainLogos[urlObj.hostname] || `https://logo.clearbit.com/${urlObj.hostname}`;

    // For known logos, return immediately without testing
    if (this.domainLogos[urlObj.hostname]) {
      return logoUrl;
    }

    // For Clearbit logos, test if they exist with a short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(logoUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return logoUrl;
      }
    } catch (error) {
      // Ignore errors, just fall back
    }

    // Final fallback
    return '/static/images/trentinipine.png';
  }

  extractYouTubeVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  extractGoogleDriveFileId(url) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  async loadExternalPosts() {
    try {
      const response = await fetch('/posts/external-posts.json');
      if (!response.ok) {
        throw new Error('Failed to load external posts');
      }
      return await response.json();
    } catch (error) {
      console.warn('Could not load external posts:', error);
      return [];
    }
  }

  async loadInternalPosts() {
    // Check if posts folder exists and load internal-posts.json
    try {
      const response = await fetch('/posts/internal-posts.json');
      if (!response.ok) {
        return []; // No internal posts available
      }
      const postsData = await response.json();

      // Process internal posts to add full URL paths and load config headers
      const processedPosts = await Promise.all(postsData.map(async (post) => {
        const slug = post.slug;

        // Use metadata from JSON (always available now)
        let metadata = {
          title: post.title,
          description: post.description,
          date: post.date,
          author: post.author,
          tags: post.tags,
          hero: post.hero
        };
        let content = post.content || ''; // Use content from JSON if available

        // Fallback for missing metadata
        if (!metadata.title) {
          metadata.title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        if (!metadata.description) {
          metadata.description = `Blog post about ${slug.replace(/-/g, ' ')}`;
        }
        if (!metadata.date) {
          metadata.date = new Date().toISOString().split('T')[0];
        }
        if (!metadata.author) {
          metadata.author = "Bruno Trentini";
        }
        if (!metadata.tags) {
          metadata.tags = ["blog"];
        }

        return {
          ...post,
          ...metadata,
          content: content.toLowerCase(), // Store content for search
          thumbnail: metadata.hero || '/static/images/bruno.png',
          url: `${window.location.protocol}//${window.location.host}/posts/layout.html?post=${slug}`, // Use absolute URL
          isInternal: true
        };
      }));

      return processedPosts;
    } catch (error) {
      console.warn('Could not load internal posts:', error);
      return [];
    }
  }

  extractFrontmatter(markdownContent) {
    // Look for frontmatter header at the top of the markdown file
    const lines = markdownContent.split('\n');
    let inFrontmatter = false;
    const frontmatter = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '---' && !inFrontmatter) {
        inFrontmatter = true;
        continue;
      }
      if (trimmed === '---' && inFrontmatter) {
        break;
      }
      if (inFrontmatter && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        let value = valueParts.join(':').trim();

        // Handle arrays (tags: [item1, item2])
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If JSON parsing fails, treat as comma-separated string
            value = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
          }
        } else {
          // Remove quotes if present
          value = value.replace(/^['"]|['"]$/g, '');
        }

        frontmatter[key.trim()] = value;
      }
    }

    return frontmatter;
  }

  createFilters() {
    // Use the existing filter container from HTML
    this.filterContainer = document.getElementById('blogFilters');

    // Get all unique topics
    const topics = new Set();
    this.posts.forEach(post => {
      if (post.topic) {
        topics.add(post.topic);
      }
      // For internal posts, add tags as topics
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => topics.add(tag));
      }
    });

    // Create filter buttons
    const filterButtons = ['all', ...Array.from(topics).sort()];

    this.filterContainer.innerHTML = `
      <div class="filter-buttons">
        ${filterButtons.map(topic => `
          <button class="filter-btn ${topic === 'all' ? 'active' : ''}"
                  data-topic="${topic}">
            ${topic === 'all' ? 'All Posts' : this.formatTopicName(topic)}
          </button>
        `).join('')}
      </div>
    `;

    // Add event listeners to filter buttons
    this.filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const topic = e.target.dataset.topic;
        this.setFilter(topic);
      });
    });
  }

  formatTopicName(topic) {
    // Special formatting for specific topics
    const specialCases = {
      'machine learning': 'Machine Learning',
      'tutorial': 'Tutorial',
      'presentation': 'Presentations',
      'presentations': 'Presentations',
      'linkedin': 'LinkedIn',
      'youtube': 'YouTube',
      'random': 'Random'
    };

    if (specialCases[topic]) {
      return specialCases[topic];
    }

    // Default: Capitalize first letter and replace underscores with spaces
    return topic.charAt(0).toUpperCase() + topic.slice(1).replace(/_/g, ' ');
  }

  setFilter(topic) {
    this.currentFilter = topic;
    this.currentPage = 1; // Reset to first page
    this.applyFilter();

    // Update active button
    this.filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.topic === topic);
    });
  }

  applyFilter() {
    let filtered = [...this.posts];

    // Apply topic filter if not 'all'
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(post => {
        // Check if post matches the filter topic
        if (post.topic === this.currentFilter) return true;
        if (post.tags && Array.isArray(post.tags) && post.tags.includes(this.currentFilter)) return true;
        return false;
      });
    }

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(post => {
        const title = (post.title || '').toLowerCase();
        const description = (post.description || '').toLowerCase();
        const content = (post.content || '').toLowerCase();

        return title.includes(this.searchQuery) ||
               description.includes(this.searchQuery) ||
               content.includes(this.searchQuery);
      });
    }

    this.filteredPosts = filtered;
    this.currentPage = 1;
    this.render();
  }

  setupEventListeners() {
    this.prevBtn.addEventListener('click', () => this.changePage(-1));
    this.nextBtn.addEventListener('click', () => this.changePage(1));

    // Handle screen resize to adjust posts per page
    window.addEventListener('resize', () => {
      const newPostsPerPage = this.isMobile() ? 2 : 5;
      if (newPostsPerPage !== this.postsPerPage) {
        this.postsPerPage = newPostsPerPage;
        this.currentPage = 1; // Reset to first page
        this.render();
      }
    });
  }

  setupSearchListener() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.updateClearButtonVisibility();
        this.applyFilter();
      });
    }

    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.searchInput.value = '';
        this.updateClearButtonVisibility();
        this.applyFilter();
      });
    }
  }

  updateClearButtonVisibility() {
    if (this.clearSearchBtn) {
      this.clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
    }
  }

  changePage(direction) {
    this.currentPage += direction;
    this.render();
  }

  render() {
    const startIndex = (this.currentPage - 1) * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    const postsToShow = this.filteredPosts.slice(startIndex, endIndex);

    this.blogList.innerHTML = '';

    // Show search results count if searching
    if (this.searchQuery) {
      const resultsCount = document.createElement('div');
      resultsCount.className = 'search-results-count';
      resultsCount.textContent = `Found ${this.filteredPosts.length} post${this.filteredPosts.length !== 1 ? 's' : ''} matching "${this.searchQuery}"`;
      this.blogList.appendChild(resultsCount);
    }

    postsToShow.forEach(post => {
      const postElement = this.createPostElement(post);
      this.blogList.appendChild(postElement);
    });

    this.updatePagination();
  }

  createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'blog-post';

    const title = post.title || 'Untitled Post';
    const thumbnail = post.thumbnail ? `<img src="${post.thumbnail}" alt="${title}" class="blog-thumbnail">` : '';

    const truncatedDescription = (post.description && post.description.length > 150)
      ? post.description.substring(0, 150) + '...'
      : (post.description || 'No description available.');

    const date = post.date ? new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Date not available';

    // Create external domain indicator for external posts
    let externalIndicator = '';
    if (!post.isInternal) {
      try {
        const url = new URL(post.url);
        const domain = url.hostname.replace('www.', '');
        externalIndicator = `<span class="external-domain"> opens ${domain}</span>`;
      } catch (e) {
        externalIndicator = `<span class="external-domain"> opens external</span>`;
      }
    }

    article.innerHTML = `
      <div class="blog-post-content">
        ${thumbnail}
        <div class="blog-post-text">
          <h3 class="blog-title"><a href="${post.url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
          <p class="blog-description">${truncatedDescription}</p>
          <div class="blog-meta">
            <span class="blog-date">${date}</span>
            ${externalIndicator}
            ${post.source ? `<span class="blog-source">${post.source}</span>` : ''}
          </div>
        </div>
      </div>
    `;

    return article;
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
    const startIndex = (this.currentPage - 1) * this.postsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.postsPerPage, this.filteredPosts.length);

    this.pageInfo.textContent = `Page ${this.currentPage} of ${totalPages} (${startIndex}-${endIndex} of ${this.filteredPosts.length})`;

    this.prevBtn.disabled = this.currentPage === 1;
    this.nextBtn.disabled = this.currentPage === totalPages;
  }
}

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const blogManager = new BlogManager();
  blogManager.init();
});
