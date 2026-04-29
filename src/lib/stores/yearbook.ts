import { create } from 'zustand';
import { api } from '../api';
import type { YearbookEntry } from '../types';

interface YearbookState {
  entries: YearbookEntry[];
  isLoading: boolean;
  fetchEntries: (academicYear?: string) => Promise<void>;
  submitEntry: (data: Partial<YearbookEntry>, academicYear: string) => Promise<void>;
  fetchUserEntry: () => Promise<YearbookEntry | null>;
}

export const useYearbookStore = create<YearbookState>((set) => ({
  entries: [],
  isLoading: false,

  fetchEntries: async (academicYear?: string) => {
    set({ isLoading: true });
    try {
      const data = await api.fetch(`/yearbook${academicYear ? `?academicYear=${academicYear}` : ''}`);
      set({ entries: data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  submitEntry: async (data: Partial<YearbookEntry>, academicYear: string) => {
    await api.fetch('/yearbook', {
      method: 'POST',
      body: JSON.stringify({
        academic_year: academicYear,
        ...data,
      }),
    });
  },

  fetchUserEntry: async (): Promise<YearbookEntry | null> => {
    try {
      return await api.fetch('/yearbook/me');
    } catch (error) {
      return null;
    }
  },
}));

