import { create } from 'zustand';
import { api } from '../api';
import type { Connection } from '../types';

interface ConnectionState {
  connections: Connection[];
  isLoading: boolean;
  fetchConnections: () => Promise<void>;
  sendConnectionRequest: (receiverId: string, message?: string) => Promise<void>;
  respondToConnection: (connectionId: string, status: 'accepted' | 'rejected') => Promise<void>;
  getConnectionStatus: (otherId: string) => Promise<Connection | null>;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connections: [],
  isLoading: false,

  fetchConnections: async () => {
    set({ isLoading: true });
    try {
      const data = await api.fetch('/connections');
      set({ connections: data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  sendConnectionRequest: async (receiverId: string, message?: string) => {
    await api.fetch(`/connections/${receiverId}?message=${encodeURIComponent(message || '')}`, {
      method: 'POST'
    });
  },

  respondToConnection: async (connectionId: string, status: 'accepted' | 'rejected') => {
    await api.fetch(`/connections/${connectionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.id === connectionId ? { ...conn, status } : conn
      ),
    }));
  },

  getConnectionStatus: async (otherId: string) => {
    try {
      return await api.fetch(`/connections/status/${otherId}`);
    } catch (error) {
      return null;
    }
  },
}));

