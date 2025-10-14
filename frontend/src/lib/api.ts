// API service for Django REST API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types
export interface Artwork {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  style: string;
  artist: {
    id: number;
    username: string;
    avatar?: string;
  };
  likes_count: number;
  views: number;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  text: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  created_at: string;
}
export interface Report {
  id: number;
  reporter: {
    id: number;
    username: string;
  };
  artwork: {
    id: number;
    title: string;
    image: string;
  };
  comment?: {
    id: number;
    text: string;
  };
  reason: string;
  is_resolved: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

// Auth helper
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API functions
export const api = {
  // Get all artworks
  async getArtworks(params?: { search?: string; category?: string; style?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params?.style && params.style !== 'all') queryParams.append('style', params.style);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch artworks');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // Get single artwork
  async getArtwork(id: number) {
    const response = await fetch(`${API_BASE_URL}/artwork/${id}/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch artwork');
    return response.json();
  },

  // Like an artwork
  async likeArtwork(id: number) {
    const response = await fetch(`${API_BASE_URL}/artwork/${id}/like/`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to like artwork');
    return response.json();
  },

  // Upload artwork
  async uploadArtwork(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload artwork');
    return response.json();
  },

  // Comment on artwork
  async commentOnArtwork(id: number, text: string) {
    const response = await fetch(`${API_BASE_URL}/artwork/${id}/comment/`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to comment');
    return response.json();
  },

  // Auth
  async register(data: { username: string; email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Registration failed'); // use error.error
}

    return response.json();
  },

  async login(data: { username: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    const result = await response.json();
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    return result;
  },

  // Profile
  async getProfile(username?: string) {
    const url = username 
      ? `${API_BASE_URL}/profile/${username}/`
      : `${API_BASE_URL}/profile/`;
    
    const response = await fetch(url, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  async updateProfile(data: Partial<{ username: string; email: string; avatar?: string; bio?: string }>) {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },
  // Reports
  async getReports(): Promise<Report[]> {
    const response = await fetch(`${API_BASE_URL}/reports/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  },

  async createReport(data: {
    artwork_id: number;
    comment_id?: number;
    reason: string;
  }): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create report');
    return response.json();
  },

  async resolveReport(id: number): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${id}/resolve/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to resolve report');
    return response.json();
  },

  async deleteArtwork(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete artwork');
  },

  async deleteComment(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete comment');
  },
};



