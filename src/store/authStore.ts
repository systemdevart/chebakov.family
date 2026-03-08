import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      login: (username: string, password: string) => {
        const validUsername = import.meta.env.VITE_ADMIN_USERNAME || 'chebakov';
        const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'family2024';

        if (username === validUsername && password === validPassword) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'chebakov-auth-storage',
    }
  )
);
