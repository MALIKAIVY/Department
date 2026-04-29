import { create } from 'zustand';
import { api } from '../api';
import type { User, Profile, AuthResponse, SignUpData } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (profile: Profile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  signUp: async (signUpData: SignUpData) => {
    const data: AuthResponse = await api.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(signUpData)
    });
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    set({
      user: data.user,
      profile: data.user, // The backend returns the Profile model as 'user'
      isAuthenticated: true,
    });

  },

  signIn: async (email: string, password: string) => {
    const data: AuthResponse = await api.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    set({
      user: data.user,
      profile: data.user, // The backend returns the Profile model as 'user'
      isAuthenticated: true,
    });

  },


  signOut: async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      set({ isLoading: false, isAuthenticated: false, user: null, profile: null });
      return;
    }

    try {
      const data = await api.fetch('/auth/me');
      set({
        user: data, // data is the Profile model directly
        profile: data,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch (error: any) {
      // Refresh logic is handled in api.ts
      // If api.fetch fails even after refresh, it will clear tokens and redirect
      set({ isLoading: false, isAuthenticated: false, user: null, profile: null });
    }
  },

  updateProfile: (profile: Profile) => {
    set({ profile });
  },
}));

