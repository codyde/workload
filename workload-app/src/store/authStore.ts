import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email: string, _password: string) => {
        set({ user: { email } });
      },
      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      // Optional: Add custom serialization/deserialization
      // getStorage: () => localStorage,
    }
  )
);