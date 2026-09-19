import { create } from 'zustand';
import { getSessionProfile, signOut } from '../lib/auth';
import type { Profile } from '../lib/types';

interface AuthState {
  profile: Profile | null;
  initialized: boolean;
  loading: boolean;
  init: () => Promise<void>;
  setProfile: (p: Profile | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  profile: null,
  initialized: false,
  loading: false,

  init: async () => {
    set({ loading: true });
    try {
      const profile = await getSessionProfile();
      set({ profile, initialized: true });
    } catch {
      set({ profile: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  setProfile: (p) => set({ profile: p, initialized: true }),

  logout: async () => {
    await signOut();
    set({ profile: null });
  },
}));

export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.profile?.role === 'admin');
}
