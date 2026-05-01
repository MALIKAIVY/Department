const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const accessToken = localStorage.getItem('access_token');
    
    const headers: Record<string, string> = {
      ...((options.headers as any) || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');

          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });

          if (!refreshRes.ok) throw new Error('Refresh failed');

          const data = await refreshRes.json();
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
          
          isRefreshing = false;
          onTokenRefreshed(data.access_token);
        } catch (err) {
          isRefreshing = false;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          throw err;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          this.fetch(endpoint, options).then(resolve).catch(reject);
        });
      });
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error(`API Error: ${response.statusText}`);
      }
      throw new Error(errorData.detail || errorData.message || 'API request failed');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
       return response.json();
    }
    return response.text();
  },
  
  async post(endpoint: string, body: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  async put(endpoint: string, body: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  async patch(endpoint: string, body: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  async delete(endpoint: string, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
};
