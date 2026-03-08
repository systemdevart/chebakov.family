'use client';

import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,

  login: (username: string, password: string) => {
    const validUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'chebakov';
    const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'family2024';

    if (username === validUsername && password === validPassword) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => set({ isAuthenticated: false }),
}));
