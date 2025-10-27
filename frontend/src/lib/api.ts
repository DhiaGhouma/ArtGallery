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
  comments_count: number;
  views: number;
  is_liked?: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
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
  artwork?: {
    id: number;
    title: string;
    image: string;
  };
  comment?: {
    id: number;
    text: string;
  };
  reason: string;
  description?: string;
  is_resolved: boolean;
  resolved?: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  artworks_count?: number;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: User;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

// Helper to get CSRF token from cookies
const getCookie = (name: string): string | null => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Auth helper - Django uses session auth
const getAuthHeader = (): HeadersInit => {
  const csrftoken = getCookie('csrftoken');
  return {
    'X-CSRFToken': csrftoken || '',
  };
};

// API functions
export const api = {
  // ============ Artworks ============
  
  async getArtworks(params?: { 
    search?: string; 
    category?: string; 
    style?: string;
    featured?: boolean;
    page?: number;
    sort?: string;
  }): Promise<Artwork[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    if (params?.style && params.style !== 'all') {
      queryParams.append('style', params.style);
    }
    if (params?.featured) {
      queryParams.append('featured', 'true');
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/artworks/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch artworks');
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async getArtwork(id: number): Promise<Artwork> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch artwork');
    }
    
    return response.json();
  },

  async uploadArtwork(formData: FormData): Promise<{ id: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/artworks/upload/`, {
      method: 'POST',
      headers: getAuthHeader(),
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload artwork');
    }
    
    return response.json();
  },

  async updateArtwork(id: number, formData: FormData): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/`, {
      method: 'PUT',
      headers: getAuthHeader(),
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update artwork');
    }
    
    return response.json();
  },

  async deleteArtwork(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeader(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete artwork');
    }
  },

  // ============ Likes ============
  
  async likeArtwork(id: number): Promise<{ liked: boolean; likes_count: number }> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/like/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to like artwork');
    }
    
    return response.json();
  },

  // ============ Comments ============
  
  async commentOnArtwork(id: number, text: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/artworks/${id}/comment/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add comment');
    }
    
    return response.json();
  },

  async updateComment(id: number, text: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/comments/${id}/`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update comment');
    }
    
    return response.json();
  },

  async deleteComment(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeader(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete comment');
    }
  },

  // ============ AI Comment Suggestions ============
  
  async getCommentSuggestions(artworkId: number): Promise<{ suggestions: string[]; artwork_id: number; artwork_title: string }> {
    const response = await fetch(`${API_BASE_URL}/artworks/${artworkId}/suggest-comments/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate suggestions');
    }
    
    return response.json();
  },

  // ============ Reports ============
  
  async register(data: { 
    username: string; 
    email: string; 
    password: string;
  }): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    return response.json();
  },

  async login(data: { 
    username: string; 
    password: string;
  }): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  },

  async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: getAuthHeader(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
    
    return response.json();
  },

  async checkAuth(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/check/`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check authentication');
    }
    
    return response.json();
  },

  // ============ Profile ============
  
  async getProfile(username?: string): Promise<User> {
    const url = username 
      ? `${API_BASE_URL}/users/${username}/`
      : `${API_BASE_URL}/auth/profile/`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }
    
    return response.json();
  },

  async updateProfile(data: Partial<{ 
    username: string; 
    email: string; 
    bio?: string; 
    location?: string; 
    website?: string;
  }>): Promise<{ message: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    
    return response.json();
  },

  async uploadAvatar(file: File): Promise<{ message: string; avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/auth/profile/avatar/`, {
      method: 'POST',
      headers: getAuthHeader(),
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }
    
    return response.json();
  },

  // ============ Reports ============
  
  async getReports(): Promise<Report[]> {
    const response = await fetch(`${API_BASE_URL}/reports/`, {
      credentials: 'include',
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    return response.json();
  },

  async createReport(data: {
    artwork_id?: number;
    comment_id?: number;
    reason: string;
    description?: string;
  }): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create report');
    }
    
    return response.json();
  },

  async resolveReport(id: number): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${id}/resolve/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resolve report');
    }
    
    return response.json();
  },

  async deleteReport(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reports/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeader(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete report');
    }
  },

  // ============ Admin - Users ============
  
  async getAllUsers(params?: {
    search?: string;
    is_staff?: boolean;
    is_active?: boolean;
  }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_staff !== undefined) {
      queryParams.append('is_staff', String(params.is_staff));
    }
    if (params?.is_active !== undefined) {
      queryParams.append('is_active', String(params.is_active));
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/admin/users/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  },

  async updateUserStatus(userId: number, data: {
    is_active?: boolean;
    is_staff?: boolean;
  }): Promise<{ message: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user status');
    }
    
    return response.json();
  },

  async deleteUser(userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/`, {
      method: 'DELETE',
      headers: getAuthHeader(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  },

  // ============ Admin - Analytics ============
  
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalArtworks: number;
    totalReports: number;
    pendingReports: number;
    totalTransactions: number;
    totalRevenue: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/admin/stats/`, {
      credentials: 'include',
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin stats');
    }
    
    return response.json();
  },

  async getAnalytics(period?: 'week' | 'month' | 'year'): Promise<{
    userGrowth: Array<{ date: string; count: number }>;
    artworkGrowth: Array<{ date: string; count: number }>;
    revenueGrowth: Array<{ date: string; amount: number }>;
  }> {
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/admin/analytics/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    
    return response.json();
  },

  // ============ Admin - Activity Log ============
  
  async getActivityLog(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Array<{
    id: number;
    action: string;
    user: { id: number; username: string };
    timestamp: string;
    details?: string;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/admin/activity/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity log');
    }
    
    return response.json();
  },

  // ============ Categories ============
  
  async getCategories(): Promise<Array<{
    id: number;
    name: string;
    description?: string;
  }>> {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return response.json();
  },
};