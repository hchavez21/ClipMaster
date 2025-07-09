// API service for ClipMaster frontend
const API_BASE_URL = 'http://localhost:5000/api'

class ApiService {
  // Helper method for making HTTP requests
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Clipboard API methods
  async getClipboardItems(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/clipboard${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async createClipboardItem(data) {
    return this.request('/clipboard', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateClipboardItem(id, data) {
    return this.request(`/clipboard/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteClipboardItem(id) {
    return this.request(`/clipboard/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleClipboardItemPin(id) {
    return this.request(`/clipboard/${id}/pin`, {
      method: 'POST',
    })
  }

  async getClipboardStats(userId = 1) {
    return this.request(`/clipboard/stats?user_id=${userId}`)
  }

  // Template API methods
  async getTemplates(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/templates${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async createTemplate(data) {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTemplate(id, data) {
    return this.request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTemplate(id) {
    return this.request(`/templates/${id}`, {
      method: 'DELETE',
    })
  }

  async useTemplate(id, variables) {
    return this.request(`/templates/${id}/use`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    })
  }

  async toggleTemplateFavorite(id) {
    return this.request(`/templates/${id}/favorite`, {
      method: 'POST',
    })
  }

  async getTemplateCategories(userId = 1) {
    return this.request(`/templates/categories?user_id=${userId}`)
  }

  async getTemplateStats(userId = 1) {
    return this.request(`/templates/stats?user_id=${userId}`)
  }

  // Utility methods
  async detectContentType(content) {
    // Simple content type detection
    if (content.match(/^https?:\/\//)) {
      return 'link'
    } else if (content.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) {
      return 'image'
    } else if (content.match(/\.(pdf|doc|docx|txt|csv|xlsx)$/i)) {
      return 'file'
    } else {
      return 'text'
    }
  }

  async copyToClipboard(content) {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  async readFromClipboard() {
    try {
      const content = await navigator.clipboard.readText()
      return content
    } catch (error) {
      console.error('Failed to read from clipboard:', error)
      return null
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService

