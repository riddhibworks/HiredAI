import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  setAuth: (token: string, userId: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      setAuth: (token, userId, email) => {
        console.info('[Auth] Authenticated: userId=%s, email=%s', userId, email);
        set({ token, userId, email });
      },
      logout: () => {
        console.info('[Auth] User logged out');
        set({ token: null, userId: null, email: null });
      },
    }),
    { name: 'hiredai-auth' }
  )
);
