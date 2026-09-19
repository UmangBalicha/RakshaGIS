import { create } from 'zustand';
import { getSessionProfile, signOut } from '../lib/auth';
export const useAuthStore = create()((set) => ({
    profile: null,
    initialized: false,
    loading: false,
    init: async () => {
        set({ loading: true });
        try {
            const profile = await getSessionProfile();
            set({ profile, initialized: true });
        }
        catch {
            set({ profile: null, initialized: true });
        }
        finally {
            set({ loading: false });
        }
    },
    setProfile: (p) => set({ profile: p, initialized: true }),
    logout: async () => {
        await signOut();
        set({ profile: null });
    },
}));
export function useIsAdmin() {
    return useAuthStore((s) => s.profile?.role === 'admin');
}
