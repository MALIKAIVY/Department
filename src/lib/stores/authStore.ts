import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (profile: Profile) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
          profile: data.user,
          isAuthenticated: true,
          isLoading: false,
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
          profile: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      signOut: async () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      checkAuth: async () => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false, user: null, profile: null });
          return;
        }

        set({ isLoading: true });
        try {
          const data = await api.fetch('/auth/me');
          set({
            user: data,
            profile: data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // If api.fetch fails (even after refresh attempts), clear state
          set({ isLoading: false, isAuthenticated: false, user: null, profile: null });
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        await api.fetch('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          })
        });

        const data = await api.fetch('/auth/me');
        set({
          user: data,
          profile: data,
          isAuthenticated: true,
        });
      },

      updateProfile: (profile: Profile) => {
        set({ profile, user: profile });
      },
    }),
    {
      name: 'dtcy-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        profile: state.profile, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
