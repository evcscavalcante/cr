class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'https://api.laboratorio-evcs.com';
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.user = null;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const fetchOptions = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };
    try {
      let response = await fetch(url, fetchOptions);
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${this.accessToken}`
          };
          response = await fetch(url, fetchOptions);
        }
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });
      if (!response.ok) {
        this.logout();
        return false;
      }
      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('access_token', data.accessToken);
      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      this.logout();
      return false;
    }
  }

  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    this.user = response.user;
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    return response.user;
  }

  async register(email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async recoverPassword(email) {
    return this.request('/api/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders()
    }).catch(() => {});
  }

  getCurrentUser() {
    return this.user;
  }

  getCurrentUserId() {
    return this.user?.uid;
  }

  async getData(collection, id = null) {
    const endpoint = id ? `/api/data/${collection}/${id}` : `/api/data/${collection}`;
    return this.request(endpoint);
  }

  async createData(collection, data) {
    return this.request(`/api/data/${collection}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateData(collection, id, data) {
    return this.request(`/api/data/${collection}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteData(collection, id) {
    return this.request(`/api/data/${collection}/${id}`, {
      method: 'DELETE'
    });
  }

  async sendAuditLogs(logs) {
    return this.request('/api/audit/logs', {
      method: 'POST',
      body: JSON.stringify({ logs })
    });
  }

  async registerConsent(type, value, metadata) {
    return this.request('/api/consent/register', {
      method: 'POST',
      body: JSON.stringify({ type, value, metadata })
    });
  }
}

window.api = new ApiClient();
