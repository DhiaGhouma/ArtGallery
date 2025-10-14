// API service for Django REST API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

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
  likes: number;
  views: number;
  comments: Comment[];
  created_at: string;
  is_liked?: boolean;
}

export interface Comment {
  id: number;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
  text: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Auth helpers
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API functions
export const api = {
  // Artworks
  async getArtworks(params?: {
    page?: number;
    category?: string;
    style?: string;
    search?: string;
    sort?: string;
  }): Promise<PaginatedResponse<Artwork>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.style) queryParams.append('style', params.style);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort) queryParams.append('sort', params.sort);

    const response = await fetch(`${API_BASE_URL}/artworks/?${queryParams}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch artworks');
    return response.json();
  },

  async getArtwork(id: number): Promise<Artwork> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch artwork');
    return response.json();
  },

  async uploadArtwork(formData: FormData): Promise<Artwork> {
    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload artwork');
    return response.json();
  },

  async likeArtwork(id: number): Promise<{ liked: boolean; likes: number }> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/like/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to like artwork');
    return response.json();
  },

  async commentOnArtwork(id: number, text: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/comment/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to comment');
    return response.json();
  },

  // Auth
  async register(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async login(data: {
    username: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  // Profile
  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },
};
