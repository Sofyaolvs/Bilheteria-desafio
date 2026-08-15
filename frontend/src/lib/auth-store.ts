import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

// Guardamos o JWT no localStorage (via zustand/persist) em vez de um cookie
// httpOnly. Decisão consciente para o prazo do desafio: cookie httpOnly
// seria mais resistente a XSS, mas exigiria CSRF token + configuração de
// cookies cross-origin entre front (Vite) e back (Nest). Documentado no
// README como limitação conhecida.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'elite-eventos-auth' },
  ),
);
