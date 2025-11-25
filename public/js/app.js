/**
 * NetFlow Main Application Script
 */

const App = {
  apiBase: "/api",
  token: null,

  /**
   * Initialize application
   */
  init() {
    this.token = localStorage.getItem("authToken");
    this.setupEventListeners();
  },

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle logout
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-logout]")) {
        this.logout();
      }
    });
  },

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Add auth token if available
    if (this.token) {
      defaultOptions.headers["Authorization"] = `Bearer ${this.token}`;
    }

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, mergedOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  /**
   * Show notification
   */
  notify(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = "fixed";
    notification.style.top = "1rem";
    notification.style.right = "1rem";
    notification.style.zIndex = "9999";
    notification.style.maxWidth = "400px";

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  },

  /**
   * Get auth token
   */
  getToken() {
    return this.token;
  },

  /**
   * Set auth token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  },

  /**
   * Get current user from token
   */
  getCurrentUser() {
    if (!this.token) return null;

    try {
      const parts = this.token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return user.exp > now;
  },

  /**
   * Check if user has admin role
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === "admin";
  },

  /**
   * Logout user
   */
  logout() {
    this.setToken(null);
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  /**
   * Redirect if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "/login";
      return false;
    }
    return true;
  },

  /**
   * Redirect if not admin
   */
  requireAdmin() {
    if (!this.isAdmin()) {
      this.notify("Admin access required", "danger");
      return false;
    }
    return true;
  },

  /**
   * Format currency
   */
  formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  },

  /**
   * Format date
   */
  formatDate(date, format = "short") {
    const dateObj = new Date(date);

    if (format === "short") {
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  },

  /**
   * Validate email
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Show loading spinner
   */
  showLoading(element) {
    element.innerHTML = '<div class="spinner"></div>';
  },

  /**
   * Hide loading spinner
   */
  hideLoading(element) {
    element.innerHTML = "";
  },
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
